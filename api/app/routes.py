from __future__ import annotations

import csv
import io
import uuid
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db import get_session
from app.ledger import (
    available_paise,
    can_allocate,
    month_end,
    month_start,
    outstanding_as_of,
    outstanding_paise,
    spending_paise,
    status_for,
    today_in_kolkata,
    utilization_bps,
)
from app.models import Allocation, Card, Category, Payment, Statement, Transaction
from app.money import parse_rupees
from app.records import audit, card_figures, owner_row, touch

router = APIRouter(prefix="/api")

NETWORKS = {"visa", "mastercard", "rupay", "amex", "other"}
TX_TYPES = {"purchase", "refund", "fee", "interest", "reversal"}


class CardIn(BaseModel):
    issuer: str = Field(min_length=1, max_length=120)
    nickname: str = Field(min_length=1, max_length=80)
    network: str
    last_four: str | None = None
    credit_limit: str | None = None
    cycle_start_day: int | None = Field(default=None, ge=1, le=31)
    cycle_end_day: int | None = Field(default=None, ge=1, le=31)
    statement_day: int | None = Field(default=None, ge=1, le=31)
    due_day: int | None = Field(default=None, ge=1, le=31)
    status: str = "active"


class CardPatch(BaseModel):
    issuer: str | None = None
    nickname: str | None = None
    network: str | None = None
    last_four: str | None = None
    credit_limit: str | None = None
    clear_limit: bool = False
    cycle_start_day: int | None = Field(default=None, ge=1, le=31)
    cycle_end_day: int | None = Field(default=None, ge=1, le=31)
    statement_day: int | None = Field(default=None, ge=1, le=31)
    due_day: int | None = Field(default=None, ge=1, le=31)
    status: str | None = None
    archived: bool | None = None


class TxIn(BaseModel):
    merchant: str = Field(min_length=1, max_length=160)
    amount: str
    transacted_on: date
    card_id: uuid.UUID
    category_id: uuid.UUID
    type: str
    description: str = ""


class StatementIn(BaseModel):
    card_id: uuid.UUID
    period_start: date | None = None
    period_end: date | None = None
    statement_date: date
    due_date: date
    total_due: str
    minimum_due: str | None = None


class LinkIn(BaseModel):
    transaction_ids: list[uuid.UUID]


class PaymentIn(BaseModel):
    statement_id: uuid.UUID
    paid_on: date
    amount: str
    note: str = ""
    idempotency_key: str = Field(min_length=8, max_length=80)


class PaymentPatch(BaseModel):
    paid_on: date | None = None
    amount: str | None = None
    note: str | None = None


class CategoryIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)


class SettingsPatch(BaseModel):
    soon_days: int = Field(ge=0, le=60)


def session_dep(session: Session = Depends(get_session)) -> Session:
    return session


def fail(message: str, code: int = 422) -> None:
    raise HTTPException(status_code=code, detail=message)


def clean_last_four(value: str | None) -> str | None:
    if value is None or value == "":
        return None
    if len(value) != 4 or not value.isdigit():
        fail("Last four must be four digits, or blank.")
    return value


def money(value: str, allow_zero: bool = False) -> int:
    try:
        return parse_rupees(value, allow_zero=allow_zero)
    except ValueError as exc:
        fail(str(exc))
        raise AssertionError from exc


def optional_money(value: str | None) -> int | None:
    if value is None or value.strip() == "":
        return None
    return money(value)


def card_or_404(session: Session, owner_id: uuid.UUID, card_id: uuid.UUID) -> Card:
    row = session.scalar(select(Card).where(Card.id == card_id, Card.owner_id == owner_id))
    if row is None:
        fail("Card not found.", 404)
        raise AssertionError
    return row


def dump_card(session: Session, owner_id: uuid.UUID, row: Card) -> dict[str, object]:
    figures = card_figures(session, owner_id, row)
    return {
        "id": str(row.id),
        "issuer": row.issuer,
        "nickname": row.nickname,
        "network": row.network,
        "last_four": row.last_four,
        "credit_limit_paise": row.credit_limit_paise,
        "cycle_start_day": row.cycle_start_day,
        "cycle_end_day": row.cycle_end_day,
        "statement_day": row.statement_day,
        "due_day": row.due_day,
        "status": row.status,
        "archived_at": row.archived_at.isoformat() if row.archived_at else None,
        **figures,
    }


@router.get("/cards")
def list_cards(include_archived: bool = False, session: Session = Depends(session_dep)) -> list[dict[str, object]]:
    owner = owner_row(session)
    query = select(Card).where(Card.owner_id == owner.id).order_by(Card.created_at)
    if not include_archived:
        query = query.where(Card.archived_at.is_(None))
    rows = list(session.scalars(query))
    payload = [dump_card(session, owner.id, row) for row in rows]
    session.commit()
    return payload


@router.post("/cards", status_code=201)
def create_card(body: CardIn, session: Session = Depends(session_dep)) -> dict[str, object]:
    if body.network not in NETWORKS:
        fail("Choose a network.")
    if body.status not in {"active", "inactive"}:
        fail("Status must be active or inactive.")
    owner = owner_row(session)
    row = Card(
        owner_id=owner.id,
        issuer=body.issuer.strip(),
        nickname=body.nickname.strip(),
        network=body.network,
        last_four=clean_last_four(body.last_four),
        credit_limit_paise=optional_money(body.credit_limit),
        cycle_start_day=body.cycle_start_day,
        cycle_end_day=body.cycle_end_day,
        statement_day=body.statement_day,
        due_day=body.due_day,
        status=body.status,
    )
    session.add(row)
    session.flush()
    audit(session, owner.id, "card", row.id, "create")
    payload = dump_card(session, owner.id, row)
    session.commit()
    return payload


@router.get("/cards/{card_id}")
def get_card(card_id: uuid.UUID, session: Session = Depends(session_dep)) -> dict[str, object]:
    owner = owner_row(session)
    row = card_or_404(session, owner.id, card_id)
    payload = dump_card(session, owner.id, row)
    session.commit()
    return payload


@router.patch("/cards/{card_id}")
def patch_card(card_id: uuid.UUID, body: CardPatch, session: Session = Depends(session_dep)) -> dict[str, object]:
    owner = owner_row(session)
    row = card_or_404(session, owner.id, card_id)
    if body.network is not None and body.network not in NETWORKS:
        fail("Choose a network.")
    if body.status is not None and body.status not in {"active", "inactive"}:
        fail("Status must be active or inactive.")
    for field in ("issuer", "nickname", "network", "status", "cycle_start_day", "cycle_end_day", "statement_day", "due_day"):
        value = getattr(body, field)
        if value is not None:
            setattr(row, field, value.strip() if isinstance(value, str) else value)
    if body.last_four is not None:
        row.last_four = clean_last_four(body.last_four)
    if body.clear_limit:
        row.credit_limit_paise = None
    elif body.credit_limit is not None:
        row.credit_limit_paise = optional_money(body.credit_limit)
    if body.archived is True:
        row.archived_at = datetime.now().astimezone()
    if body.archived is False:
        row.archived_at = None
    touch(row)
    audit(session, owner.id, "card", row.id, "update")
    payload = dump_card(session, owner.id, row)
    session.commit()
    return payload


@router.delete("/cards/{card_id}")
def archive_card(card_id: uuid.UUID, session: Session = Depends(session_dep)) -> dict[str, str]:
    owner = owner_row(session)
    row = card_or_404(session, owner.id, card_id)
    row.archived_at = datetime.now().astimezone()
    touch(row)
    audit(session, owner.id, "card", row.id, "archive")
    session.commit()
    return {"status": "archived"}


@router.get("/categories")
def list_categories(session: Session = Depends(session_dep)) -> list[dict[str, object]]:
    owner = owner_row(session)
    rows = session.scalars(select(Category).where(Category.owner_id == owner.id, Category.hidden.is_(False)).order_by(Category.name))
    payload = [{"id": str(row.id), "name": row.name, "is_system": row.is_system} for row in rows]
    session.commit()
    return payload


@router.post("/categories", status_code=201)
def create_category(body: CategoryIn, session: Session = Depends(session_dep)) -> dict[str, object]:
    owner = owner_row(session)
    name = body.name.strip()
    existing = session.scalar(select(Category).where(Category.owner_id == owner.id, Category.name == name))
    if existing is not None:
        fail("That category already exists.")
    row = Category(owner_id=owner.id, name=name, is_system=False)
    session.add(row)
    session.flush()
    audit(session, owner.id, "category", row.id, "create")
    session.commit()
    return {"id": str(row.id), "name": row.name, "is_system": False}


def tx_query(session: Session, owner_id: uuid.UUID):
    return (
        select(Transaction, Card.nickname, Category.name)
        .join(Card, Card.id == Transaction.card_id)
        .join(Category, Category.id == Transaction.category_id)
        .where(Transaction.owner_id == owner_id)
    )


def dump_tx(row: Transaction, nickname: str, category: str) -> dict[str, object]:
    return {
        "id": str(row.id),
        "card_id": str(row.card_id),
        "card": nickname,
        "category_id": str(row.category_id),
        "category": category,
        "statement_id": str(row.statement_id) if row.statement_id else None,
        "merchant": row.merchant,
        "amount_paise": row.amount_paise,
        "transacted_on": row.transacted_on.isoformat(),
        "type": row.type,
        "description": row.description,
    }


@router.get("/transactions")
def list_transactions(
    card_id: uuid.UUID | None = None,
    category_id: uuid.UUID | None = None,
    type: str | None = None,
    q: str | None = None,
    start: date | None = None,
    end: date | None = None,
    sort: str = "date",
    direction: str = "desc",
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    session: Session = Depends(session_dep),
) -> dict[str, object]:
    owner = owner_row(session)
    query = tx_query(session, owner.id)
    if card_id:
        query = query.where(Transaction.card_id == card_id)
    if category_id:
        query = query.where(Transaction.category_id == category_id)
    if type:
        query = query.where(Transaction.type == type)
    if q:
        query = query.where(Transaction.merchant.ilike(f"%{q.strip()}%"))
    if start:
        query = query.where(Transaction.transacted_on >= start)
    if end:
        query = query.where(Transaction.transacted_on <= end)
    total = session.scalar(select(func.count()).select_from(query.order_by(None).subquery())) or 0
    column = Transaction.amount_paise if sort == "amount" else Transaction.transacted_on
    query = query.order_by(column.asc() if direction == "asc" else column.desc()).limit(limit).offset(offset)
    items = [dump_tx(row, nickname, category) for row, nickname, category in session.execute(query).all()]
    session.commit()
    return {"items": items, "total": int(total)}


@router.post("/transactions", status_code=201)
def create_transaction(body: TxIn, session: Session = Depends(session_dep)) -> dict[str, object]:
    if body.type not in TX_TYPES:
        fail("Choose a transaction type.")
    owner = owner_row(session)
    card = card_or_404(session, owner.id, body.card_id)
    category = session.scalar(select(Category).where(Category.id == body.category_id, Category.owner_id == owner.id))
    if category is None:
        fail("Choose a category.")
    row = Transaction(
        owner_id=owner.id,
        card_id=card.id,
        category_id=category.id,
        merchant=body.merchant.strip(),
        amount_paise=money(body.amount),
        transacted_on=body.transacted_on,
        type=body.type,
        description=body.description.strip(),
    )
    session.add(row)
    session.flush()
    audit(session, owner.id, "transaction", row.id, "create")
    payload = dump_tx(row, card.nickname, category.name)
    session.commit()
    return payload


@router.patch("/transactions/{tx_id}")
def patch_transaction(tx_id: uuid.UUID, body: TxIn, session: Session = Depends(session_dep)) -> dict[str, object]:
    if body.type not in TX_TYPES:
        fail("Choose a transaction type.")
    owner = owner_row(session)
    row = session.scalar(select(Transaction).where(Transaction.id == tx_id, Transaction.owner_id == owner.id))
    if row is None:
        fail("Transaction not found.", 404)
    card = card_or_404(session, owner.id, body.card_id)
    category = session.scalar(select(Category).where(Category.id == body.category_id, Category.owner_id == owner.id))
    if category is None:
        fail("Choose a category.")
    row.card_id = card.id
    row.category_id = category.id
    row.merchant = body.merchant.strip()
    row.amount_paise = money(body.amount)
    row.transacted_on = body.transacted_on
    row.type = body.type
    row.description = body.description.strip()
    touch(row)
    audit(session, owner.id, "transaction", row.id, "update")
    session.commit()
    return dump_tx(row, card.nickname, category.name)


@router.delete("/transactions/{tx_id}")
def delete_transaction(tx_id: uuid.UUID, session: Session = Depends(session_dep)) -> dict[str, str]:
    owner = owner_row(session)
    row = session.scalar(select(Transaction).where(Transaction.id == tx_id, Transaction.owner_id == owner.id))
    if row is None:
        fail("Transaction not found.", 404)
    audit(session, owner.id, "transaction", row.id, "delete")
    session.delete(row)
    session.commit()
    return {"status": "deleted"}


@router.get("/transactions/export")
def export_transactions(
    card_id: uuid.UUID | None = None,
    category_id: uuid.UUID | None = None,
    start: date | None = None,
    end: date | None = None,
    session: Session = Depends(session_dep),
) -> Response:
    owner = owner_row(session)
    query = tx_query(session, owner.id).order_by(Transaction.transacted_on)
    if card_id:
        query = query.where(Transaction.card_id == card_id)
    if category_id:
        query = query.where(Transaction.category_id == category_id)
    if start:
        query = query.where(Transaction.transacted_on >= start)
    if end:
        query = query.where(Transaction.transacted_on <= end)
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["date", "merchant", "type", "category", "card", "amount_paise", "description"])
    for row, nickname, category in session.execute(query).all():
        writer.writerow([row.transacted_on.isoformat(), row.merchant, row.type, category, nickname, row.amount_paise, row.description])
    session.commit()
    return Response(buffer.getvalue(), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=transactions.csv"})


def statement_paid(session: Session, statement_id: uuid.UUID) -> int:
    total = session.scalar(select(func.coalesce(func.sum(Allocation.amount_paise), 0)).where(Allocation.statement_id == statement_id))
    return int(total or 0)


def dump_statement(session: Session, row: Statement, nickname: str, today: date, soon_days: int) -> dict[str, object]:
    paid = statement_paid(session, row.id)
    left = max(row.total_due_paise - paid, 0)
    return {
        "id": str(row.id),
        "card_id": str(row.card_id),
        "card": nickname,
        "period_start": row.period_start.isoformat() if row.period_start else None,
        "period_end": row.period_end.isoformat() if row.period_end else None,
        "statement_date": row.statement_date.isoformat(),
        "due_date": row.due_date.isoformat(),
        "total_due_paise": row.total_due_paise,
        "minimum_due_paise": row.minimum_due_paise,
        "paid_paise": paid,
        "remaining_paise": left,
        "status": status_for(left, row.due_date, paid, today, soon_days),
    }


@router.get("/statements")
def list_statements(card_id: uuid.UUID | None = None, session: Session = Depends(session_dep)) -> list[dict[str, object]]:
    owner = owner_row(session)
    today = today_in_kolkata(datetime.now().astimezone())
    query = select(Statement, Card.nickname).join(Card, Card.id == Statement.card_id).where(Statement.owner_id == owner.id)
    if card_id:
        query = query.where(Statement.card_id == card_id)
    query = query.order_by(Statement.due_date)
    payload = [dump_statement(session, row, nickname, today, owner.soon_days) for row, nickname in session.execute(query).all()]
    session.commit()
    return payload


@router.post("/statements", status_code=201)
def create_statement(body: StatementIn, session: Session = Depends(session_dep)) -> dict[str, object]:
    if body.period_start and body.period_end and body.period_end < body.period_start:
        fail("The period end is before the period start.")
    owner = owner_row(session)
    card = card_or_404(session, owner.id, body.card_id)
    row = Statement(
        owner_id=owner.id,
        card_id=card.id,
        period_start=body.period_start,
        period_end=body.period_end,
        statement_date=body.statement_date,
        due_date=body.due_date,
        total_due_paise=money(body.total_due, allow_zero=True),
        minimum_due_paise=None if body.minimum_due is None or body.minimum_due.strip() == "" else money(body.minimum_due, allow_zero=True),
    )
    session.add(row)
    session.flush()
    audit(session, owner.id, "statement", row.id, "create")
    today = today_in_kolkata(datetime.now().astimezone())
    payload = dump_statement(session, row, card.nickname, today, owner.soon_days)
    session.commit()
    return payload


@router.get("/statements/{statement_id}")
def get_statement(statement_id: uuid.UUID, session: Session = Depends(session_dep)) -> dict[str, object]:
    owner = owner_row(session)
    row = session.scalar(select(Statement).where(Statement.id == statement_id, Statement.owner_id == owner.id))
    if row is None:
        fail("Statement not found.", 404)
    card = card_or_404(session, owner.id, row.card_id)
    today = today_in_kolkata(datetime.now().astimezone())
    payload = dump_statement(session, row, card.nickname, today, owner.soon_days)
    linked = session.scalars(select(Transaction).where(Transaction.statement_id == row.id))
    signed = 0
    for tx in linked:
        signed += tx.amount_paise if tx.type in {"purchase", "fee", "interest"} else -tx.amount_paise
    if signed != row.total_due_paise:
        payload["link_warning"] = "Linked transactions do not add up to the statement total. The total you entered stays as it is."
    session.commit()
    return payload


@router.post("/statements/{statement_id}/link")
def link_transactions(statement_id: uuid.UUID, body: LinkIn, session: Session = Depends(session_dep)) -> dict[str, object]:
    owner = owner_row(session)
    row = session.scalar(select(Statement).where(Statement.id == statement_id, Statement.owner_id == owner.id))
    if row is None:
        fail("Statement not found.", 404)
    for tx_id in body.transaction_ids:
        tx = session.scalar(select(Transaction).where(Transaction.id == tx_id, Transaction.owner_id == owner.id))
        if tx is None:
            fail("Transaction not found.", 404)
        if tx.card_id != row.card_id:
            fail("A transaction can only join a statement for the same card.")
        if tx.statement_id is not None and tx.statement_id != row.id:
            fail("That transaction is already on another statement.")
        tx.statement_id = row.id
        touch(tx)
    audit(session, owner.id, "statement", row.id, "link")
    card = card_or_404(session, owner.id, row.card_id)
    today = today_in_kolkata(datetime.now().astimezone())
    payload = dump_statement(session, row, card.nickname, today, owner.soon_days)
    session.commit()
    return payload


@router.get("/payments")
def list_payments(session: Session = Depends(session_dep)) -> list[dict[str, object]]:
    owner = owner_row(session)
    rows = session.execute(
        select(Payment, Allocation, Statement, Card.nickname)
        .join(Allocation, Allocation.payment_id == Payment.id)
        .join(Statement, Statement.id == Allocation.statement_id)
        .join(Card, Card.id == Statement.card_id)
        .where(Payment.owner_id == owner.id)
        .order_by(Payment.paid_on.desc())
    ).all()
    payload = [
        {
            "id": str(payment.id),
            "statement_id": str(statement.id),
            "card": nickname,
            "paid_on": payment.paid_on.isoformat(),
            "amount_paise": payment.amount_paise,
            "note": payment.note,
        }
        for payment, _allocation, statement, nickname in rows
    ]
    session.commit()
    return payload


@router.post("/payments", status_code=201)
def create_payment(body: PaymentIn, session: Session = Depends(session_dep)) -> dict[str, object]:
    owner = owner_row(session)
    existing = session.scalar(select(Payment).where(Payment.idempotency_key == body.idempotency_key, Payment.owner_id == owner.id))
    if existing is not None:
        session.commit()
        return {"id": str(existing.id), "amount_paise": existing.amount_paise, "paid_on": existing.paid_on.isoformat(), "duplicate": True}
    statement = session.scalar(select(Statement).where(Statement.id == body.statement_id, Statement.owner_id == owner.id).with_for_update())
    if statement is None:
        fail("Statement not found.", 404)
    amount = money(body.amount)
    paid = statement_paid(session, statement.id)
    if not can_allocate(statement.total_due_paise, paid, amount):
        fail("That payment is larger than the remaining due.")
    payment = Payment(owner_id=owner.id, paid_on=body.paid_on, amount_paise=amount, note=body.note.strip(), idempotency_key=body.idempotency_key)
    session.add(payment)
    session.flush()
    session.add(Allocation(payment_id=payment.id, statement_id=statement.id, amount_paise=amount))
    audit(session, owner.id, "payment", payment.id, "create")
    session.commit()
    return {"id": str(payment.id), "amount_paise": amount, "paid_on": payment.paid_on.isoformat(), "duplicate": False}


@router.patch("/payments/{payment_id}")
def patch_payment(payment_id: uuid.UUID, body: PaymentPatch, session: Session = Depends(session_dep)) -> dict[str, object]:
    owner = owner_row(session)
    payment = session.scalar(select(Payment).where(Payment.id == payment_id, Payment.owner_id == owner.id))
    if payment is None:
        fail("Payment not found.", 404)
    allocation = session.scalar(select(Allocation).where(Allocation.payment_id == payment.id))
    if allocation is None:
        fail("Payment has no statement.", 409)
    statement = session.scalar(select(Statement).where(Statement.id == allocation.statement_id).with_for_update())
    if statement is None:
        fail("Statement not found.", 404)
    next_amount = money(body.amount) if body.amount is not None else payment.amount_paise
    others = statement_paid(session, statement.id) - allocation.amount_paise
    if not can_allocate(statement.total_due_paise, others, next_amount):
        fail("That payment is larger than the remaining due.")
    payment.amount_paise = next_amount
    allocation.amount_paise = next_amount
    if body.paid_on is not None:
        payment.paid_on = body.paid_on
    if body.note is not None:
        payment.note = body.note.strip()
    touch(payment)
    audit(session, owner.id, "payment", payment.id, "update")
    session.commit()
    return {"id": str(payment.id), "amount_paise": payment.amount_paise, "paid_on": payment.paid_on.isoformat()}


def _books(session: Session, owner_id: uuid.UUID):
    from app.records import _world

    return _world(session, owner_id)


@router.get("/analytics/overview")
def overview(session: Session = Depends(session_dep)) -> dict[str, object]:
    owner = owner_row(session)
    today = today_in_kolkata(datetime.now().astimezone())
    start, end = month_start(today), month_end(today)
    cards = list(session.scalars(select(Card).where(Card.owner_id == owner.id, Card.archived_at.is_(None))))
    stmts, txs, _payments, _names = _books(session, owner.id)
    card_name = {str(card.id): card.nickname for card in cards}
    limits = [card.credit_limit_paise for card in cards if card.credit_limit_paise]
    limit_sum = sum(limits) if limits else None
    active_ids = {str(card.id) for card in cards}
    owed_active = outstanding_paise([s for s in stmts if s.card_id in active_ids], [t for t in txs if t.card_id in active_ids])
    month_spend = spending_paise([t for t in txs if t.card_id in active_ids], start, end)
    by_category: dict[str, int] = {}
    by_card: dict[str, int] = {}
    for tx in txs:
        if tx.card_id not in active_ids or tx.transacted_on < start or tx.transacted_on > end:
            continue
        signed = tx.amount_paise if tx.type in {"purchase", "fee", "interest"} else -tx.amount_paise
        by_category[tx.category] = by_category.get(tx.category, 0) + signed
        by_card[tx.card_id] = by_card.get(tx.card_id, 0) + signed
    top_category = max(by_category, key=by_category.get) if by_category else None
    top_card_id = max(by_card, key=by_card.get) if by_card else None
    deadlines = []
    for stmt in sorted(stmts, key=lambda item: item.due_date):
        if stmt.card_id not in active_ids:
            continue
        left = max(stmt.total_due_paise - stmt.paid_paise, 0)
        state = status_for(left, stmt.due_date, stmt.paid_paise, today, owner.soon_days)
        if state == "paid":
            continue
        deadlines.append({"card": card_name.get(stmt.card_id, "Card"), "due_date": stmt.due_date.isoformat(), "remaining_paise": left, "status": state})
    recent_query = tx_query(session, owner.id).order_by(Transaction.transacted_on.desc()).limit(6)
    recent = [dump_tx(row, nickname, category) for row, nickname, category in session.execute(recent_query).all()]
    has_records = bool(cards or txs or stmts)
    session.commit()
    return {
        "has_records": has_records,
        "monthly_spending_paise": month_spend,
        "outstanding_paise": owed_active,
        "upcoming_count": len(deadlines),
        "next_due": deadlines[0]["due_date"] if deadlines else None,
        "available_paise": available_paise(limit_sum, owed_active) if limit_sum is not None else None,
        "cards_missing_limit": sum(1 for card in cards if card.credit_limit_paise is None),
        "utilization_bps": utilization_bps(owed_active, limit_sum),
        "top_category": top_category,
        "top_category_paise": by_category.get(top_category, 0) if top_category else 0,
        "top_card": card_name.get(top_card_id, None) if top_card_id else None,
        "top_card_paise": by_card.get(top_card_id, 0) if top_card_id else 0,
        "deadlines": deadlines[:6],
        "recent": recent,
        "card_balances": [
            {"card": card.nickname, "outstanding_paise": outstanding_paise(stmts, txs, str(card.id))}
            for card in cards
        ],
    }


@router.get("/analytics/monthly")
def monthly(start: date, end: date, session: Session = Depends(session_dep)) -> list[dict[str, object]]:
    owner = owner_row(session)
    cards = list(session.scalars(select(Card).where(Card.owner_id == owner.id, Card.archived_at.is_(None))))
    limit_sum = sum(card.credit_limit_paise or 0 for card in cards)
    stmts, txs, payments, _names = _books(session, owner.id)
    points = []
    cursor = month_start(start)
    while cursor <= end:
        last = min(month_end(cursor), end)
        spend = spending_paise(txs, cursor, last)
        owed = outstanding_as_of(stmts, txs, payments, last)
        points.append({
            "month": cursor.strftime("%Y-%m"),
            "spending_paise": spend,
            "outstanding_paise": owed,
            "utilization_bps": utilization_bps(owed, limit_sum or None),
        })
        cursor = date(cursor.year + (cursor.month == 12), 1 if cursor.month == 12 else cursor.month + 1, 1)
    session.commit()
    return points


@router.get("/analytics/categories")
def by_category(start: date, end: date, session: Session = Depends(session_dep)) -> list[dict[str, object]]:
    owner = owner_row(session)
    _stmts, txs, _payments, _names = _books(session, owner.id)
    totals: dict[str, int] = {}
    for tx in txs:
        if tx.transacted_on < start or tx.transacted_on > end:
            continue
        signed = tx.amount_paise if tx.type in {"purchase", "fee", "interest"} else -tx.amount_paise
        totals[tx.category] = totals.get(tx.category, 0) + signed
    session.commit()
    return [{"category": name, "spending_paise": amount} for name, amount in sorted(totals.items(), key=lambda item: item[1], reverse=True)]


@router.get("/analytics/cards")
def by_card(start: date, end: date, session: Session = Depends(session_dep)) -> list[dict[str, object]]:
    owner = owner_row(session)
    cards = list(session.scalars(select(Card).where(Card.owner_id == owner.id, Card.archived_at.is_(None))))
    stmts, txs, _payments, _names = _books(session, owner.id)
    payload = [
        {
            "card": card.nickname,
            "spending_paise": spending_paise(txs, start, end, str(card.id)),
            "outstanding_paise": outstanding_paise(stmts, txs, str(card.id)),
        }
        for card in cards
    ]
    session.commit()
    return payload


@router.get("/settings")
def get_settings(session: Session = Depends(session_dep)) -> dict[str, object]:
    owner = owner_row(session)
    session.commit()
    return {"soon_days": owner.soon_days, "currency": "INR", "timezone": owner.timezone}


@router.patch("/settings")
def patch_settings(body: SettingsPatch, session: Session = Depends(session_dep)) -> dict[str, object]:
    owner = owner_row(session)
    owner.soon_days = body.soon_days
    touch(owner)
    session.commit()
    return {"soon_days": owner.soon_days, "currency": "INR", "timezone": owner.timezone}


@router.get("/export")
def export_all(session: Session = Depends(session_dep)) -> dict[str, object]:
    owner = owner_row(session)
    cards = session.scalars(select(Card).where(Card.owner_id == owner.id))
    categories = session.scalars(select(Category).where(Category.owner_id == owner.id))
    txs = session.scalars(select(Transaction).where(Transaction.owner_id == owner.id))
    statements = session.scalars(select(Statement).where(Statement.owner_id == owner.id))
    payments = session.scalars(select(Payment).where(Payment.owner_id == owner.id))
    allocations = session.execute(select(Allocation).join(Payment, Payment.id == Allocation.payment_id).where(Payment.owner_id == owner.id)).scalars()
    session.commit()
    return {
        "cards": [dump_card_raw(row) for row in cards],
        "categories": [{"id": str(row.id), "name": row.name} for row in categories],
        "transactions": [row_dict(row) for row in txs],
        "statements": [row_dict(row) for row in statements],
        "payments": [row_dict(row) for row in payments],
        "allocations": [row_dict(row) for row in allocations],
    }


def dump_card_raw(row: Card) -> dict[str, object]:
    return {
        "id": str(row.id),
        "issuer": row.issuer,
        "nickname": row.nickname,
        "network": row.network,
        "last_four": row.last_four,
        "credit_limit_paise": row.credit_limit_paise,
        "status": row.status,
    }


def row_dict(row: Transaction | Statement | Payment | Allocation) -> dict[str, object]:
    payload: dict[str, object] = {}
    for column in row.__table__.columns:
        value = getattr(row, column.name)
        if isinstance(value, uuid.UUID):
            payload[column.name] = str(value)
        elif isinstance(value, (date, datetime)):
            payload[column.name] = value.isoformat()
        else:
            payload[column.name] = value
    return payload


class Backup(BaseModel):
    cards: list[dict[str, object]] = []
    categories: list[dict[str, object]] = []
    transactions: list[dict[str, object]] = []
    statements: list[dict[str, object]] = []
    payments: list[dict[str, object]] = []
    allocations: list[dict[str, object]] = []


@router.post("/import")
def import_all(body: Backup, session: Session = Depends(session_dep)) -> dict[str, str]:
    owner = owner_row(session)
    counts = [
        session.scalar(select(func.count()).select_from(Card).where(Card.owner_id == owner.id)) or 0,
        session.scalar(select(func.count()).select_from(Transaction).where(Transaction.owner_id == owner.id)) or 0,
        session.scalar(select(func.count()).select_from(Statement).where(Statement.owner_id == owner.id)) or 0,
        session.scalar(select(func.count()).select_from(Payment).where(Payment.owner_id == owner.id)) or 0,
    ]
    if any(counts):
        session.commit()
        fail("Restore is refused because this ledger already has records.", 409)
    known_categories = {row.name: row.id for row in session.scalars(select(Category).where(Category.owner_id == owner.id))}
    for item in body.categories:
        name = str(item.get("name", "")).strip()
        if name and name not in known_categories:
            row = Category(id=uuid.UUID(str(item["id"])) if item.get("id") else uuid.uuid4(), owner_id=owner.id, name=name, is_system=False)
            session.add(row)
            known_categories[name] = row.id
    for item in body.cards:
        session.add(Card(
            id=uuid.UUID(str(item["id"])),
            owner_id=owner.id,
            issuer=str(item["issuer"]),
            nickname=str(item["nickname"]),
            network=str(item.get("network") or "other"),
            last_four=item.get("last_four") if isinstance(item.get("last_four"), str) else None,
            credit_limit_paise=item.get("credit_limit_paise") if isinstance(item.get("credit_limit_paise"), int) else None,
            status=str(item.get("status") or "active"),
        ))
    session.flush()
    for item in body.statements:
        session.add(Statement(
            id=uuid.UUID(str(item["id"])),
            owner_id=owner.id,
            card_id=uuid.UUID(str(item["card_id"])),
            statement_date=date.fromisoformat(str(item["statement_date"])[:10]),
            due_date=date.fromisoformat(str(item["due_date"])[:10]),
            total_due_paise=int(item["total_due_paise"]),
            minimum_due_paise=int(item["minimum_due_paise"]) if item.get("minimum_due_paise") is not None else None,
            period_start=date.fromisoformat(str(item["period_start"])[:10]) if item.get("period_start") else None,
            period_end=date.fromisoformat(str(item["period_end"])[:10]) if item.get("period_end") else None,
        ))
    session.flush()
    for item in body.transactions:
        category_id = uuid.UUID(str(item["category_id"])) if item.get("category_id") else known_categories.get("Other")
        if category_id is None:
            fail("Backup is missing a category.")
        session.add(Transaction(
            id=uuid.UUID(str(item["id"])),
            owner_id=owner.id,
            card_id=uuid.UUID(str(item["card_id"])),
            category_id=category_id,
            statement_id=uuid.UUID(str(item["statement_id"])) if item.get("statement_id") else None,
            merchant=str(item["merchant"]),
            amount_paise=int(item["amount_paise"]),
            transacted_on=date.fromisoformat(str(item["transacted_on"])[:10]),
            type=str(item["type"]),
            description=str(item.get("description") or ""),
        ))
    for item in body.payments:
        session.add(Payment(
            id=uuid.UUID(str(item["id"])),
            owner_id=owner.id,
            paid_on=date.fromisoformat(str(item["paid_on"])[:10]),
            amount_paise=int(item["amount_paise"]),
            note=str(item.get("note") or ""),
            idempotency_key=str(item.get("idempotency_key") or uuid.uuid4()),
        ))
    session.flush()
    for item in body.allocations:
        session.add(Allocation(
            id=uuid.UUID(str(item["id"])),
            payment_id=uuid.UUID(str(item["payment_id"])),
            statement_id=uuid.UUID(str(item["statement_id"])),
            amount_paise=int(item["amount_paise"]),
        ))
    audit(session, owner.id, "owner", owner.id, "restore")
    session.commit()
    return {"status": "restored"}
