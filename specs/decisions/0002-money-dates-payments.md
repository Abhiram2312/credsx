# ADR 0002: Rupees, calendar dates, and payments

## Status

Accepted.

## Decision

- Store money as integer paise. Calculate with Python `Decimal` at the boundary. Do not use binary floating point for amounts.
- Format for display with `en-IN`.
- Store statement and payment dates as calendar dates. Compute "days remaining" in `Asia/Kolkata`. Do not divide a timestamp delta by 24 hours.
- Remaining due = max(total due − sum of payments on that statement, 0).
- Reject a payment that would make the sum of payments larger than the total due.
- A missing minimum due is stored as absent and shown as "Not provided". It is not zero.
- The outstanding total sums remaining due once per unpaid statement.
- A statement with remaining due of zero is paid. It stays in history and is excluded from outstanding, minimum, unpaid count, and next due.
- Due soon means the due date is today or within the next 7 calendar days, and the statement is still unpaid. Overdue, due today, and due soon are also written in words.

## Consequences

Tests use a fixed clock and synthetic paise amounts. The first version has no import path, so every statement and payment is entered on a form.
