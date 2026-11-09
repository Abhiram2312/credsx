# Data model

Money columns are integers in paise. Dates are calendar dates. Identifiers are UUIDs. Nothing here stores a full card number or a credential.

## card

| Field | Type | Rule |
| --- | --- | --- |
| id | uuid | Primary key |
| issuer | text | Required |
| nickname | text | Required |
| network | text | Required, one of visa, mastercard, rupay, amex, other |
| last_four | char(4) | Optional, digits only |
| archived_at | timestamptz | Null while active |
| sort_order | int | For a non-drag reorder |
| created_at | timestamptz | |

## statement

| Field | Type | Rule |
| --- | --- | --- |
| id | uuid | Primary key |
| card_id | uuid | Required |
| statement_date | date | Required |
| period_start | date | Optional |
| period_end | date | Optional, not before period_start |
| due_date | date | Required |
| total_due_paise | bigint | Required, zero or positive |
| minimum_due_paise | bigint | Null if not provided. Zero is a real zero |
| notes | text | Optional |
| created_at | timestamptz | |

## payment

| Field | Type | Rule |
| --- | --- | --- |
| id | uuid | Primary key |
| statement_id | uuid | Required |
| paid_on | date | Required |
| amount_paise | bigint | Required, positive |
| note | text | Optional |
| created_at | timestamptz | |

A new payment is saved only when the sum of payments for that statement, including the new one, is less than or equal to `total_due_paise`.

## Derived, not stored

- remaining_paise = max(total_due_paise − sum of payments, 0)
- unpaid = remaining_paise > 0
- outstanding = sum of remaining_paise over unpaid statements on cards that are not archived
- known_minimum = sum of minimum_due_paise where unpaid, not archived, and the minimum is not null
- missing_minimum_count = unpaid, not archived, minimum is null
- next_due = minimum due_date among unpaid statements on active cards

## owner_setting

One row. Holds the allowlisted Google email once the owner supplies it, the due-soon threshold (default 7), and the timezone `Asia/Kolkata`. The email is not guessed in a migration.
