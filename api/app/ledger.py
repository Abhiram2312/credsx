from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

KOLKATA = ZoneInfo("Asia/Kolkata")
CHARGE = frozenset({"purchase", "fee", "interest"})
CREDIT = frozenset({"refund", "reversal"})


@dataclass(frozen=True)
class Tx:
    amount_paise: int
    type: str
    statement_id: str | None
    transacted_on: date
    card_id: str
    category: str = "Other"


@dataclass(frozen=True)
class Pay:
    statement_id: str
    amount_paise: int
    paid_on: date


@dataclass(frozen=True)
class Stmt:
    id: str
    card_id: str
    total_due_paise: int
    minimum_due_paise: int | None
    due_date: date
    statement_date: date
    paid_paise: int = 0


def remaining(total_due_paise: int, paid_paise: int) -> int:
    return max(total_due_paise - paid_paise, 0)


def can_allocate(total_due_paise: int, already_paid: int, new_amount: int) -> bool:
    return new_amount > 0 and already_paid + new_amount <= total_due_paise


def _sign(tx: Tx) -> int:
    if tx.type in CHARGE:
        return tx.amount_paise
    if tx.type in CREDIT:
        return -tx.amount_paise
    return 0


def unbilled_paise(txs: list[Tx], card_id: str | None = None) -> int:
    total = 0
    for tx in txs:
        if tx.statement_id is not None:
            continue
        if card_id is not None and tx.card_id != card_id:
            continue
        total += _sign(tx)
    return total


def outstanding_paise(stmts: list[Stmt], txs: list[Tx], card_id: str | None = None) -> int:
    billed = 0
    for stmt in stmts:
        if card_id is not None and stmt.card_id != card_id:
            continue
        billed += remaining(stmt.total_due_paise, stmt.paid_paise)
    return billed + unbilled_paise(txs, card_id)


def available_paise(limit_paise: int | None, outstanding: int) -> int | None:
    if limit_paise is None:
        return None
    return limit_paise - outstanding


def utilization_bps(outstanding: int, limit_paise: int | None) -> int | None:
    if limit_paise is None or limit_paise <= 0:
        return None
    return (outstanding * 10_000) // limit_paise


def spending_paise(txs: list[Tx], start: date, end: date, card_id: str | None = None) -> int:
    total = 0
    for tx in txs:
        if tx.transacted_on < start or tx.transacted_on > end:
            continue
        if card_id is not None and tx.card_id != card_id:
            continue
        total += _sign(tx)
    return total


def status_for(remaining_paise: int, due: date, paid_paise: int, today: date, soon_days: int = 7) -> str:
    if remaining_paise == 0:
        return "paid"
    if due < today:
        return "overdue"
    if (due - today).days <= soon_days:
        return "due_soon"
    if paid_paise > 0:
        return "partially_paid"
    return "upcoming"


def today_in_kolkata(now: datetime) -> date:
    return now.astimezone(KOLKATA).date()


def month_start(day: date) -> date:
    return day.replace(day=1)


def month_end(day: date) -> date:
    if day.month == 12:
        return date(day.year, 12, 31)
    return date(day.year, day.month + 1, 1) - timedelta(days=1)


def outstanding_as_of(stmts: list[Stmt], txs: list[Tx], payments: list[Pay], day: date, card_id: str | None = None) -> int:
    stmt_ids = {stmt.id for stmt in stmts if card_id is None or stmt.card_id == card_id}
    billed_ids = {stmt.id for stmt in stmts if stmt.statement_date <= day and stmt.id in stmt_ids}
    billed = 0
    for stmt in stmts:
        if stmt.id not in billed_ids:
            continue
        paid = sum(pay.amount_paise for pay in payments if pay.statement_id == stmt.id and pay.paid_on <= day)
        billed += remaining(stmt.total_due_paise, paid)
    unbilled = 0
    for tx in txs:
        if card_id is not None and tx.card_id != card_id:
            continue
        if tx.transacted_on > day:
            continue
        if tx.statement_id is not None and tx.statement_id in billed_ids:
            continue
        unbilled += _sign(tx)
    return billed + unbilled
