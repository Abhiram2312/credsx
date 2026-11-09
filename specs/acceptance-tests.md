# Acceptance tests

Synthetic data only. Clock is injectable. No test contacts Google, a bank, or a host.

## AT-001 Partial payment

Statement total 100000 paise. Payment 40000. Remaining is 60000. Outstanding includes 60000. The statement is unpaid.

## AT-002 Paid statement

A second payment of 60000. Remaining is 0. The statement is absent from outstanding, unpaid count, minimum sum, and next due. It is still returned in history.

## AT-003 Overpayment rejected

Remaining 60000. A payment of 60001 is rejected. The stored payments are unchanged.

## AT-004 Missing minimum

Two unpaid statements. Minimums 50000 and null. Known minimum sum is 50000. Missing count is 1. The null one renders "Not provided", not ₹0.

## AT-005 No double count

Two unpaid statements, 100000 and 200000 remaining. Outstanding is 300000. Paying the first does not change the second.

## AT-006 Archived card

An unpaid statement on an archived card is excluded from outstanding and next due. It remains available when archived cards are requested.

## AT-007 Calendar days

Timezone `Asia/Kolkata`. Fixed clock on a date D. Due date D is 0, "Due today". D+1 is 1. D−1 is −1, "Overdue". D+7 is "Due soon". D+8 is not due soon. A case crosses the end of a month.

## AT-008 Overlap flag

Two unpaid statements on one card whose billing periods overlap are both counted and both flagged.

## AT-009 Prototype motion

`index.html` shows the six ledger cards, not the previous graph copy. The ring script is unchanged. Reduced motion is a static fan. No rupee amount is hardcoded in the prototype.
