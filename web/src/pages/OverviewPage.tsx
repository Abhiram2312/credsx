import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { api } from "../api/client";
import { formatBps, formatINR, statusLabel } from "../format";
import { PageHead, Panel, Shell } from "../shell/Shell";

export function OverviewPage() {
  const overview = useQuery({ queryKey: ["overview"], queryFn: api.overview, retry: false });
  const data = overview.data;
  const live = Boolean(data?.has_records);

  return (
    <Shell>
      <div>
        <PageHead kicker="Position" title="Overview" />
        <p className="mt-4 max-w-xl text-muted">What you spent, what you owe, and what is still available.</p>
        {overview.isError ? <p className="text-secondary">The ledger is not running on this computer.</p> : null}
        <ul className="figure-list">
          <li><span>This month</span><strong>{live ? formatINR(data?.monthly_spending_paise) : "Not yet"}</strong></li>
          <li><span>Outstanding</span><strong>{live ? formatINR(data?.outstanding_paise) : "Not yet"}</strong></li>
          <li><span>Available</span><strong>{live ? formatINR(data?.available_paise) : "Not yet"}</strong></li>
          <li><span>Utilization</span><strong>{live ? formatBps(data?.utilization_bps) : "Not yet"}</strong></li>
          <li><span>Upcoming</span><strong>{live ? data?.upcoming_count : "Not yet"}</strong></li>
          {live ? <li><span>Highest card</span><strong>{data?.top_card ?? "None"}</strong></li> : null}
        </ul>
        {live && data && data.cards_missing_limit > 0 ? <p className="mt-3 text-sm text-muted">{data.cards_missing_limit} cards have no limit yet.</p> : null}
        {live && data?.next_due ? <p className="mt-1 text-sm text-muted">Next due {data.next_due}.</p> : null}
        {live && data?.top_category ? <p className="mt-1 text-sm text-muted">{data.top_category}, {formatINR(data.top_category_paise)}.</p> : null}
        <div className="mt-8 flex flex-wrap gap-4 text-sm">
          <Link className="inline-flex min-h-11 items-center text-secondary" to="/transactions?new=1">Add transaction</Link>
          <Link className="inline-flex min-h-11 items-center text-secondary" to="/payments?new=1">Record payment</Link>
          <Link className="inline-flex min-h-11 items-center text-secondary" to="/cards?add=1">Add credit card</Link>
          <Link className="inline-flex min-h-11 items-center text-secondary" to="/payments?statement=1">Add statement</Link>
        </div>
        {data?.has_records ? (
          <div className="mt-10 grid gap-3 lg:grid-cols-2">
            <Panel title="Recent transactions">
              {data.recent.length === 0 ? <p className="m-0 text-muted">No transactions yet.</p> : (
                <ul className="m-0 list-none p-0">
                  {data.recent.map((tx) => (
                    <li key={tx.id} className="flex justify-between gap-4 border-b border-line py-3 text-sm">
                      <span>{tx.merchant}</span>
                      <span>{formatINR(tx.type === "refund" || tx.type === "reversal" ? -tx.amount_paise : tx.amount_paise)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
            <Panel title="Deadlines">
              {data.deadlines.length === 0 ? <p className="m-0 text-muted">No open statements.</p> : (
                <ul className="m-0 list-none p-0">
                  {data.deadlines.map((item) => (
                    <li key={`${item.card}-${item.due_date}`} className="flex justify-between gap-4 border-b border-line py-3 text-sm">
                      <span>{item.card}<span className="ml-2 text-faint">{statusLabel(item.status)}</span></span>
                      <span>{formatINR(item.remaining_paise)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        ) : null}
      </div>
    </Shell>
  );
}
