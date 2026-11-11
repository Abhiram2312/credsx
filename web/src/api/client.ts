export type LedgerCard = {
  id: string;
  issuer: string;
  nickname: string;
  network: string;
  last_four: string | null;
  credit_limit_paise: number | null;
  cycle_start_day: number | null;
  cycle_end_day: number | null;
  statement_day: number | null;
  due_day: number | null;
  status: string;
  archived_at: string | null;
  outstanding_paise: number;
  available_paise: number | null;
  utilization_bps: number | null;
};

export type Category = { id: string; name: string; is_system: boolean };

export type LedgerTx = {
  id: string;
  card_id: string;
  card: string;
  category_id: string;
  category: string;
  statement_id: string | null;
  merchant: string;
  amount_paise: number;
  transacted_on: string;
  type: string;
  description: string;
};

export type StatementRow = {
  id: string;
  card_id: string;
  card: string;
  period_start: string | null;
  period_end: string | null;
  statement_date: string;
  due_date: string;
  total_due_paise: number;
  minimum_due_paise: number | null;
  paid_paise: number;
  remaining_paise: number;
  status: string;
  link_warning?: string;
};

export type PaymentRow = {
  id: string;
  statement_id: string;
  card: string;
  paid_on: string;
  amount_paise: number;
  note: string;
};

export type Overview = {
  has_records: boolean;
  monthly_spending_paise: number;
  outstanding_paise: number;
  upcoming_count: number;
  next_due: string | null;
  available_paise: number | null;
  cards_missing_limit: number;
  utilization_bps: number | null;
  top_category: string | null;
  top_category_paise: number;
  top_card: string | null;
  top_card_paise: number;
  deadlines: { card: string; due_date: string; remaining_paise: number; status: string }[];
  recent: LedgerTx[];
  card_balances: { card: string; outstanding_paise: number }[];
};

export type MonthPoint = {
  month: string;
  spending_paise: number;
  outstanding_paise: number;
  utilization_bps: number | null;
};

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  if (!response.ok) {
    let detail = "The ledger could not complete that request.";
    try {
      const body: unknown = await response.json();
      if (body && typeof body === "object" && "detail" in body && typeof body.detail === "string") {
        detail = body.detail;
      }
    } catch {
      detail = response.statusText || detail;
    }
    throw new ApiError(response.status, detail);
  }
  const type = response.headers.get("content-type") ?? "";
  if (type.includes("text/csv")) return (await response.text()) as T;
  return (await response.json()) as T;
}

export const api = {
  cards: () => request<LedgerCard[]>("/api/cards"),
  card: (id: string) => request<LedgerCard>(`/api/cards/${id}`),
  createCard: (body: unknown) => request<LedgerCard>("/api/cards", { method: "POST", body: JSON.stringify(body) }),
  patchCard: (id: string, body: unknown) => request<LedgerCard>(`/api/cards/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  archiveCard: (id: string) => request<{ status: string }>(`/api/cards/${id}`, { method: "DELETE" }),
  categories: () => request<Category[]>("/api/categories"),
  createCategory: (name: string) => request<Category>("/api/categories", { method: "POST", body: JSON.stringify({ name }) }),
  transactions: (query = "") => request<{ items: LedgerTx[]; total: number }>(`/api/transactions${query}`),
  createTransaction: (body: unknown) => request<LedgerTx>("/api/transactions", { method: "POST", body: JSON.stringify(body) }),
  patchTransaction: (id: string, body: unknown) => request<LedgerTx>(`/api/transactions/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteTransaction: (id: string) => request<{ status: string }>(`/api/transactions/${id}`, { method: "DELETE" }),
  statements: () => request<StatementRow[]>("/api/statements"),
  createStatement: (body: unknown) => request<StatementRow>("/api/statements", { method: "POST", body: JSON.stringify(body) }),
  payments: () => request<PaymentRow[]>("/api/payments"),
  createPayment: (body: unknown) => request<{ id: string }>("/api/payments", { method: "POST", body: JSON.stringify(body) }),
  patchPayment: (id: string, body: unknown) => request<{ id: string }>(`/api/payments/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  overview: () => request<Overview>("/api/analytics/overview"),
  monthly: (start: string, end: string) => request<MonthPoint[]>(`/api/analytics/monthly?start=${start}&end=${end}`),
  categorySpend: (start: string, end: string) => request<{ category: string; spending_paise: number }[]>(`/api/analytics/categories?start=${start}&end=${end}`),
  cardSpend: (start: string, end: string) => request<{ card: string; spending_paise: number; outstanding_paise: number }[]>(`/api/analytics/cards?start=${start}&end=${end}`),
  settings: () => request<{ soon_days: number; currency: string }>("/api/settings"),
  patchSettings: (soon_days: number) => request<{ soon_days: number }>("/api/settings", { method: "PATCH", body: JSON.stringify({ soon_days }) }),
  exportJson: () => request<unknown>("/api/export"),
  importJson: (body: unknown) => request<{ status: string }>("/api/import", { method: "POST", body: JSON.stringify(body) }),
};
