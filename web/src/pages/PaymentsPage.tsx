import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useSearchParams } from "react-router";
import { api } from "../api/client";
import { formatINR, statusLabel, todayInput } from "../format";
import { PageHead, Panel, Shell, inputClass, primaryButton } from "../shell/Shell";

export function PaymentsPage() {
  const [params] = useSearchParams();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const cards = useQuery({ queryKey: ["cards"], queryFn: api.cards, retry: false });
  const statements = useQuery({ queryKey: ["statements"], queryFn: api.statements, retry: false });
  const payments = useQuery({ queryKey: ["payments"], queryFn: api.payments, retry: false });
  const [statement, setStatement] = useState({ card_id: params.get("card") ?? "", statement_date: todayInput(), due_date: todayInput(), total_due: "", minimum_due: "", period_start: "", period_end: "" });
  const [payment, setPayment] = useState({ statement_id: "", paid_on: todayInput(), amount: "", note: "" });

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["statements"] });
    await queryClient.invalidateQueries({ queryKey: ["payments"] });
    await queryClient.invalidateQueries({ queryKey: ["overview"] });
    await queryClient.invalidateQueries({ queryKey: ["cards"] });
  };

  const addStatement = async () => {
    setMessage("");
    try {
      await api.createStatement({
        ...statement,
        period_start: statement.period_start || null,
        period_end: statement.period_end || null,
        minimum_due: statement.minimum_due || null,
      });
      setStatement({ ...statement, total_due: "", minimum_due: "" });
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The statement could not be saved.");
    }
  };

  const addPayment = async () => {
    setMessage("");
    try {
      await api.createPayment({ ...payment, idempotency_key: crypto.randomUUID() });
      setPayment({ ...payment, amount: "", note: "" });
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The payment could not be saved.");
    }
  };

  const visible = statements.data?.filter((row) => !params.get("card") || row.card_id === params.get("card")) ?? [];

  return (
    <Shell>
      <PageHead kicker="Statements" title="Payments" />
      {statements.isError ? <p className="mt-4 text-secondary">The ledger is not running on this computer.</p> : null}
      {message ? <p className="text-sm text-secondary">{message}</p> : null}
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <form className="grid gap-3" onSubmit={(event) => { event.preventDefault(); void addStatement(); }}>
          <h2 className="m-0 text-sm text-faint">Add a statement</h2>
          <select className={inputClass} value={statement.card_id} onChange={(event) => setStatement({ ...statement, card_id: event.target.value })}>
            <option value="">Card</option>
            {cards.data?.map((card) => <option key={card.id} value={card.id}>{card.nickname}</option>)}
          </select>
          <input className={inputClass} type="date" aria-label="Statement date" value={statement.statement_date} onChange={(event) => setStatement({ ...statement, statement_date: event.target.value })} />
          <input className={inputClass} type="date" aria-label="Due date" value={statement.due_date} onChange={(event) => setStatement({ ...statement, due_date: event.target.value })} />
          <input className={inputClass} placeholder="Statement balance in rupees" value={statement.total_due} onChange={(event) => setStatement({ ...statement, total_due: event.target.value })} />
          <input className={inputClass} placeholder="Minimum due, optional" value={statement.minimum_due} onChange={(event) => setStatement({ ...statement, minimum_due: event.target.value })} />
          <button type="submit" className={primaryButton}>Save statement</button>
        </form>
        <form className="grid gap-3" onSubmit={(event) => { event.preventDefault(); void addPayment(); }}>
          <h2 className="m-0 text-sm text-faint">Record a payment</h2>
          <select className={inputClass} value={payment.statement_id} onChange={(event) => setPayment({ ...payment, statement_id: event.target.value })}>
            <option value="">Statement</option>
            {visible.map((row) => <option key={row.id} value={row.id}>{row.card} due {row.due_date}</option>)}
          </select>
          <input className={inputClass} type="date" aria-label="Date paid" value={payment.paid_on} onChange={(event) => setPayment({ ...payment, paid_on: event.target.value })} />
          <input className={inputClass} placeholder="Amount paid in rupees" value={payment.amount} onChange={(event) => setPayment({ ...payment, amount: event.target.value })} />
          <input className={inputClass} placeholder="Note, optional" value={payment.note} onChange={(event) => setPayment({ ...payment, note: event.target.value })} />
          <button type="submit" className={primaryButton}>Record payment</button>
        </form>
      </div>
      <div className="mt-10">
        <Panel title="Statements">
          {visible.length === 0 ? <p className="m-0 text-muted">Nothing recorded yet. You pay the issuer yourself, then record the amount and the date here.</p> : (
            <ul className="m-0 list-none p-0">
              {visible.map((row) => (
                <li key={row.id} className="grid gap-1 border-b border-line py-3 text-sm">
                  <span className="flex flex-wrap justify-between gap-3">
                    <span>{row.card}</span>
                    <span className={row.status === "overdue" ? "text-secondary" : ""}>{statusLabel(row.status)}</span>
                  </span>
                  <span className="text-muted">Due {row.due_date}. Remaining {formatINR(row.remaining_paise)}. Minimum {formatINR(row.minimum_due_paise)}.</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
      <div className="mt-3">
        <Panel title="Payment history">
          {payments.data && payments.data.length === 0 ? <p className="m-0 text-muted">No payments yet.</p> : (
            <ul className="m-0 list-none p-0">
              {payments.data?.map((row) => (
                <li key={row.id} className="flex justify-between gap-4 border-b border-line py-3 text-sm">
                  <span>{row.card} · {row.paid_on}</span>
                  <span>{formatINR(row.amount_paise)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </Shell>
  );
}
