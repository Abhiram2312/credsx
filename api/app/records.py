from __future__ import annotations

import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.ledger import Pay, Stmt, Tx, available_paise, outstanding_paise, utilization_bps
from app.models import Allocation, AuditLog, Card, Category, Owner, Payment, Statement, Transaction, utcnow

CATEGORIES = (
    "Shopping",
    "Food & Dining",
    "Travel",
    "Transportation",
    "Entertainment",
    "Bills & Utilities",
    "Healthcare",
    "Education",
    "Groceries",
    "Fuel",
    "Subscriptions",
    "Other",
)


def owner_row(session: Session) -> Owner:
    row = session.scalar(select(Owner).limit(1))
    if row is None:
        row = Owner()
        session.add(row)
        session.flush()
    for name in CATEGORIES:
        exists = session.scalar(select(Category.id).where(Category.owner_id == row.id, Category.name == name))
        if exists is None:
            session.add(Category(owner_id=row.id, name=name, is_system=True))
    session.flush()
    return row


def audit(session: Session, owner_id: uuid.UUID, entity: str, entity_id: uuid.UUID, action: str) -> None:
    session.add(AuditLog(owner_id=owner_id, entity=entity, entity_id=entity_id, action=action))


def _paid_map(session: Session, owner_id: uuid.UUID) -> dict[uuid.UUID, int]:
    rows = session.execute(
        select(Allocation.statement_id, func.coalesce(func.sum(Allocation.amount_paise), 0))
        .join(Payment, Payment.id == Allocation.payment_id)
        .where(Payment.owner_id == owner_id)
        .group_by(Allocation.statement_id)
    ).all()
    return {statement_id: int(total) for statement_id, total in rows}


def _world(session: Session, owner_id: uuid.UUID) -> tuple[list[Stmt], list[Tx], list[Pay], dict[uuid.UUID, str]]:
    paid = _paid_map(session, owner_id)
    statements = list(session.scalars(select(Statement).where(Statement.owner_id == owner_id)))
    categories = {row.id: row.name for row in session.scalars(select(Category).where(Category.owner_id == owner_id))}
    txs = [
        Tx(
            amount_paise=row.amount_paise,
            type=row.type,
            statement_id=str(row.statement_id) if row.statement_id else None,
            transacted_on=row.transacted_on,
            card_id=str(row.card_id),
            category=categories.get(row.category_id, "Other"),
        )
        for row in session.scalars(select(Transaction).where(Transaction.owner_id == owner_id))
    ]
    stmts = [
        Stmt(
            id=str(row.id),
            card_id=str(row.card_id),
            total_due_paise=row.total_due_paise,
            minimum_due_paise=row.minimum_due_paise,
            due_date=row.due_date,
            statement_date=row.statement_date,
            paid_paise=paid.get(row.id, 0),
        )
        for row in statements
    ]
    payments = [
        Pay(statement_id=str(allocation.statement_id), amount_paise=allocation.amount_paise, paid_on=paid_on)
        for allocation, paid_on in session.execute(
            select(Allocation, Payment.paid_on).join(Payment, Payment.id == Allocation.payment_id).where(Payment.owner_id == owner_id)
        ).all()
    ]
    return stmts, txs, payments, categories


def card_figures(session: Session, owner_id: uuid.UUID, card: Card) -> dict[str, int | None]:
    stmts, txs, _, _ = _world(session, owner_id)
    owed = outstanding_paise(stmts, txs, str(card.id))
    return {
        "outstanding_paise": owed,
        "available_paise": available_paise(card.credit_limit_paise, owed),
        "utilization_bps": utilization_bps(owed, card.credit_limit_paise),
    }


def touch(row: Card | Category | Transaction | Statement | Payment | Owner) -> None:
    row.updated_at = utcnow()
