import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { api } from "../api/client";
import { BarChart, Donut, LineChart } from "../charts/Charts";
import { formatINR } from "../format";
import { PageHead, Panel, Shell, quietButton } from "../shell/Shell";

function rangeFor(preset: string): { start: string; end: string } {
  const now = new Date();
  const end = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const startDate = new Date(now);
  if (preset === "previous") {
    startDate.setMonth(startDate.getMonth() - 1, 1);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
    return { start: startDate.toISOString().slice(0, 10), end: endDate.toISOString().slice(0, 10) };
  }
  if (preset === "3") startDate.setMonth(startDate.getMonth() - 2, 1);
  else if (preset === "6") startDate.setMonth(startDate.getMonth() - 5, 1);
  else if (preset === "year") startDate.setMonth(0, 1);
  else startDate.setDate(1);
  const start = new Date(startDate.getTime() - startDate.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  return { start, end };
}

const PRESETS = [
  { id: "month", label: "This month" },
  { id: "previous", label: "Previous month" },
  { id: "3", label: "Last 3 months" },
  { id: "6", label: "Last 6 months" },
  { id: "year", label: "This year" },
] as const;

export function AnalyticsPage() {
  const [preset, setPreset] = useState("month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const range = useMemo(() => (preset === "custom" && customStart && customEnd ? { start: customStart, end: customEnd } : rangeFor(preset)), [preset, customStart, customEnd]);
  const monthly = useQuery({ queryKey: ["monthly", range], queryFn: () => api.monthly(range.start, range.end), retry: false });
  const categories = useQuery({ queryKey: ["category-spend", range], queryFn: () => api.categorySpend(range.start, range.end), retry: false });
  const cards = useQuery({ queryKey: ["card-spend", range], queryFn: () => api.cardSpend(range.start, range.end), retry: false });
  const points = monthly.data ?? [];
  const previous = points.length > 1 ? points[points.length - 2] : null;
  const current = points.length > 0 ? points[points.length - 1] : null;

  return (
    <Shell>
      <PageHead kicker="Report" title="Analytics" />
      <div className="mt-6 flex flex-wrap gap-2">
        {PRESETS.map((item) => (
          <button key={item.id} type="button" className={quietButton} onClick={() => setPreset(item.id)} aria-pressed={preset === item.id}>{item.label}</button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-3">
        <input className="min-h-11 rounded-md border border-line bg-card px-3" type="date" aria-label="From" value={customStart} onChange={(event) => { setCustomStart(event.target.value); setPreset("custom"); }} />
        <input className="min-h-11 rounded-md border border-line bg-card px-3" type="date" aria-label="To" value={customEnd} onChange={(event) => { setCustomEnd(event.target.value); setPreset("custom"); }} />
      </div>
      {monthly.isError ? <p className="text-secondary">The ledger is not running on this computer.</p> : null}
      <div className="mt-8 grid gap-3 lg:grid-cols-2">
        <Panel title="Monthly spending">
          <BarChart label="Monthly spending" rows={points.map((point) => ({ name: point.month, value: point.spending_paise }))} />
        </Panel>
        <Panel title="Categories">
          <Donut label="Spending by category" rows={(categories.data ?? []).map((row) => ({ name: row.category, value: row.spending_paise }))} />
        </Panel>
        <Panel title="Cards">
          <BarChart label="Spending by card" rows={(cards.data ?? []).map((row) => ({ name: row.card, value: row.spending_paise }))} />
        </Panel>
        <Panel title="Outstanding">
          <LineChart label="Outstanding balance" rows={points.map((point) => ({ name: point.month, value: point.outstanding_paise }))} />
        </Panel>
        <Panel title="Utilization">
          <LineChart label="Credit utilization" rows={points.map((point) => ({ name: point.month, value: point.utilization_bps ?? 0 }))} />
        </Panel>
        <Panel title="Month on month">
          {current ? <p className="m-0 text-muted">This period {formatINR(current.spending_paise)}. Previous {previous ? formatINR(previous.spending_paise) : "Not provided."}</p> : <p className="m-0 text-muted">Nothing recorded for this range.</p>}
        </Panel>
      </div>
    </Shell>
  );
}
