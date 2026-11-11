from datetime import date, datetime, timezone

from app.ledger import (
    Pay,
    Stmt,
    Tx,
    available_paise,
    can_allocate,
    outstanding_as_of,
    outstanding_paise,
    spending_paise,
    status_for,
    today_in_kolkata,
    unbilled_paise,
    utilization_bps,
)
from app.money import parse_rupees


def test_worked_example() -> None:
    stmt = Stmt("s", "c", 1_000_000, 100_000, date(2026, 11, 20), date(2026, 11, 1), paid_paise=800_000)
    txs = [Tx(2_000_000, "purchase", None, date(2026, 11, 5), "c")]
    outstanding = outstanding_paise([stmt], txs, "c")
    assert outstanding == 2_200_000
    assert available_paise(10_000_000, outstanding) == 7_800_000
    assert utilization_bps(outstanding, 10_000_000) == 2_200


def test_linked_purchase_is_not_counted_twice() -> None:
    stmt = Stmt("s", "c", 2_000_000, None, date(2026, 11, 20), date(2026, 11, 1), paid_paise=0)
    txs = [Tx(2_000_000, "purchase", "s", date(2026, 11, 5), "c")]
    assert unbilled_paise(txs, "c") == 0
    assert outstanding_paise([stmt], txs, "c") == 2_000_000


def test_refund_reduces_spending_and_outstanding() -> None:
    txs = [
        Tx(2_000_000, "purchase", None, date(2026, 11, 2), "c", "Food & Dining"),
        Tx(500_000, "refund", None, date(2026, 11, 3), "c", "Food & Dining"),
        Tx(100_000, "fee", None, date(2026, 11, 4), "c", "Other"),
    ]
    assert spending_paise(txs, date(2026, 11, 1), date(2026, 11, 30)) == 1_600_000
    assert outstanding_paise([], txs) == 1_600_000


def test_payment_cannot_exceed_remaining() -> None:
    assert can_allocate(1_000_000, 800_000, 200_000)
    assert not can_allocate(1_000_000, 800_000, 200_001)
    assert not can_allocate(1_000_000, 0, 0)


def test_missing_limit_is_unknown() -> None:
    assert available_paise(None, 2_200_000) is None
    assert utilization_bps(2_200_000, None) is None
    assert utilization_bps(0, 0) is None


def test_status_priority() -> None:
    today = date(2026, 11, 11)
    assert status_for(0, date(2026, 11, 1), 100, today) == "paid"
    assert status_for(100, date(2026, 11, 10), 50, today) == "overdue"
    assert status_for(100, today, 50, today) == "due_soon"
    assert status_for(100, date(2026, 11, 18), 50, today) == "due_soon"
    assert status_for(100, date(2026, 11, 19), 50, today) == "partially_paid"
    assert status_for(100, date(2026, 12, 1), 0, today) == "upcoming"


def test_kolkata_date_boundary() -> None:
    now = datetime(2026, 11, 11, 20, 0, tzinfo=timezone.utc)
    assert today_in_kolkata(now) == date(2026, 11, 12)


def test_history_keeps_a_payment_in_its_own_month() -> None:
    stmt = Stmt("s", "c", 1_000_000, None, date(2026, 11, 20), date(2026, 10, 31))
    payments = [Pay("s", 800_000, date(2026, 11, 5))]
    txs = [Tx(1_000_000, "purchase", "s", date(2026, 10, 10), "c")]
    assert outstanding_as_of([stmt], txs, payments, date(2026, 10, 31)) == 1_000_000
    assert outstanding_as_of([stmt], txs, payments, date(2026, 11, 30)) == 200_000


def test_rupees_parse_to_paise() -> None:
    assert parse_rupees("100000") == 10_000_000
    assert parse_rupees("22.5") == 2_250
    assert parse_rupees("₹1,000.50") == 100_050
    for bad in ("", "0", "-5", "1.234", "ten"):
        try:
            parse_rupees(bad)
        except ValueError:
            continue
        raise AssertionError(bad)
