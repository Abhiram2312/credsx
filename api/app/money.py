from __future__ import annotations

from decimal import Decimal, InvalidOperation


def parse_rupees(value: str, allow_zero: bool = False) -> int:
    text = value.strip().replace(",", "").replace("₹", "")
    if not text:
        raise ValueError("Enter an amount.")
    try:
        amount = Decimal(text)
    except InvalidOperation as exc:
        raise ValueError("Enter an amount in rupees.") from exc
    if amount < 0 or (amount == 0 and not allow_zero):
        raise ValueError("Amount must be greater than zero.")
    if amount != amount.quantize(Decimal("0.01")):
        raise ValueError("Use at most two decimal places.")
    return int(amount * 100)
