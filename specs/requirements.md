# Requirements

Each item has an id, a priority, a reason, and a way to tell it is done. Priorities are must, should, and later.

## Must

### REQ-001 Currency

Priority: must. Reason: the owner said the product is purely Indian.

Done when every amount is stored as paise, shown in INR with `en-IN` grouping, and no other currency can be saved.

### REQ-002 Cards

Priority: must. Reason: statements belong to a card the owner recognizes.

Done when a card can be created, edited, and archived with issuer, nickname, network, and an optional last four. Full number, CVV, PIN, and OTP cannot be entered. Archived cards leave the active totals.

### REQ-003 Statements

Priority: must. Reason: the first version is manual entry.

Done when a statement stores statement date, optional billing period, due date, total due, optional minimum due, and a note. A missing minimum is "Not provided", never 0.

### REQ-004 Payments

Priority: must. Reason: the owner pays outside the app and then records it.

Done when a payment stores date paid, amount paid, and an optional note. Partial payments reduce the remaining due. A payment larger than the remaining due is rejected and not stored. The app never starts a payment.

### REQ-005 Totals

Priority: must. Reason: the first screen has to answer what is unpaid and what is due next.

Done when outstanding is the sum of remaining due on unpaid statements, each statement once. The unpaid count matches that set. Next due is the earliest due date in that set. Paid statements stay listed under history and are absent from these totals.

### REQ-006 Dates

Priority: must. Reason: a due date is a calendar day in India, not a count of hours.

Done when days remaining are computed in `Asia/Kolkata`. Negative means overdue, zero means due today, positive means days left. Due soon is the words for an unpaid statement due within 7 days, including today. Tests inject a fixed clock, including month ends.

### REQ-007 Themes and motion

Priority: must. Reason: the owner asked for light and dark, and for the orbit motion.

Done when both themes are usable, status is not color alone, and the first screen keeps a slow orbit of the six ledger facts. Pointer hover pauses the ring. Reduced motion shows a static fan. Amounts, once shown, do not loop.

### REQ-008 Access

Priority: must. Reason: this is one person's financial data.

Done when only the configured Google account can open the app, the check happens on the server, and secrets are not in the frontend bundle. Blocked until the owner provides the email.

### REQ-009 Reach

Priority: must. Reason: the owner uses a phone and a computer.

Done when the approved host serves the app over HTTPS and the database survives a restart. Blocked until a host is chosen.

## Should

### REQ-010 Minimum total

Priority: should. Reason: a minimum that was never entered must not look like ₹0.

Done when the screen shows the sum of known minimums and a count of statements whose minimum was left blank.

### REQ-011 Overlap

Priority: should. Reason: two open statements on one card can be a double entry.

Done when two unpaid statements on the same card with overlapping billing periods are flagged in words. Totals still count both until the owner deletes or edits one.

### REQ-012 Export

Priority: should. Reason: the owner needs a copy that is not trapped in the database.

Done when cards, statements, and payments export as JSON the owner can download. The file contains no secret and no full card number.

## Later

### REQ-013 Import

CSV or PDF import. Not in the first version.

### REQ-014 Bank links

Not in any current version.

## Out of scope

WhatsApp and OpenWA. Payment processing. Multi-user registration.
