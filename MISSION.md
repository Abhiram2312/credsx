# Mission

Personal credit-card ledger for one owner. Amounts are Indian rupees. The owner pays the card issuer outside this app, then records the amount and the date paid.

The app shows what is still unpaid, the known minimums, the next due date, and the history of statements and payments. It does not pay bills, connect to a bank, or send WhatsApp messages.

## Confirmed

- Currency, locale, and timezone: INR, `en-IN`, `Asia/Kolkata`.
- Database: PostgreSQL for the hosted app.
- Themes: light and dark, both usable.
- Statements: typed in by hand for the first version.
- Payments: partial payments are allowed. A payment larger than the remaining due is rejected. Paid statements stay in history and leave the outstanding total.
- Due soon: 7 calendar days, labeled in words as well as color.
- WhatsApp and OpenWA: out of scope.

## Not confirmed

- The Google account email that is allowed to sign in. The owner will supply it. No other account may register.
- Where the app is hosted. A managed app host plus managed Postgres is the recommendation. A VPS is the alternative. No provider is selected.
- The product name. The prototype wordmark is "Cards" until the owner names it.

## Out of scope

- Payment gateways, UPI, netbanking, or any transfer of money.
- Full card numbers, CVV, PIN, OTP, or bank passwords.
- Bank aggregation and PDF or CSV import, until a later approval.
- WhatsApp, SMS, or email reminders.
- More than one user.
