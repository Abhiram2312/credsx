export function formatINR(paise: number | null | undefined): string {
  if (paise === null || paise === undefined) return "Not provided.";
  const sign = paise < 0 ? "-" : "";
  const abs = Math.abs(paise);
  const rupees = Math.trunc(abs / 100);
  const frac = String(abs % 100).padStart(2, "0");
  return `${sign}₹${new Intl.NumberFormat("en-IN").format(rupees)}.${frac}`;
}

export function formatBps(bps: number | null | undefined): string {
  if (bps === null || bps === undefined) return "Not provided.";
  const sign = bps < 0 ? "-" : "";
  const abs = Math.abs(bps);
  const whole = Math.trunc(abs / 100);
  const frac = String(abs % 100).padStart(2, "0");
  return `${sign}${whole}.${frac}%`;
}

export function todayInput(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

const STATUS: Record<string, string> = {
  paid: "Paid",
  partially_paid: "Partially paid",
  due_soon: "Due soon",
  overdue: "Overdue",
  upcoming: "Upcoming",
};

export function statusLabel(value: string): string {
  return STATUS[value] ?? value;
}
