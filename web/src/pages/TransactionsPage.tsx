import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "react-router";
import { z } from "zod";
import { api } from "../api/client";
import { formatINR, todayInput } from "../format";
import { PageHead, Panel, Shell, inputClass, primaryButton, quietButton } from "../shell/Shell";

const schema = z.object({
  merchant: z.string().trim().min(1, "Enter the merchant."),
  amount: z.string().trim().regex(/^\d+(\.\d{1,2})?$/, "Enter rupees, up to two decimals."),
  transacted_on: z.string().min(1, "Choose a date."),
  card_id: z.string().min(1, "Choose a card."),
  category_id: z.string().min(1, "Choose a category."),
  type: z.enum(["purchase", "refund", "fee", "interest", "reversal"]),
  description: z.string(),
});

type FormValues = z.infer<typeof schema>;

export function TransactionsPage() {
  const [params] = useSearchParams();
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("date");
  const [message, setMessage] = useState("");
  const cards = useQuery({ queryKey: ["cards"], queryFn: api.cards, retry: false });
  const categories = useQuery({ queryKey: ["categories"], queryFn: api.categories, retry: false });
  const query = useMemo(() => {
    const search = new URLSearchParams();
    if (q) search.set("q", q);
    if (params.get("card")) search.set("card_id", params.get("card") ?? "");
    search.set("sort", sort);
    search.set("direction", "desc");
    const text = search.toString();
    return text ? `?${text}` : "";
  }, [q, sort, params]);
  const rows = useQuery({ queryKey: ["transactions", query], queryFn: () => api.transactions(query), retry: false });
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      merchant: "",
      amount: "",
      transacted_on: todayInput(),
      card_id: params.get("card") ?? "",
      category_id: "",
      type: "purchase",
      description: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setMessage("");
    try {
      await api.createTransaction(values);
      form.reset({ ...values, merchant: "", amount: "", description: "" });
      await queryClient.invalidateQueries({ queryKey: ["transactions"] });
      await queryClient.invalidateQueries({ queryKey: ["overview"] });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The transaction could not be saved.");
    }
  });

  const remove = async (id: string) => {
    await api.deleteTransaction(id);
    await queryClient.invalidateQueries({ queryKey: ["transactions"] });
  };

  const exportCsv = () => {
    const link = document.createElement("a");
    link.href = `/api/transactions/export${query}`;
    link.download = "transactions.csv";
    link.click();
  };

  return (
    <Shell>
      <div>
        <PageHead kicker="Ledger" title="Transactions" />
        {rows.isError ? <p className="text-secondary">The ledger is not running on this computer.</p> : null}
        {params.get("new") === "1" || (cards.data && cards.data.length > 0) ? (
          <form className="mt-8 grid max-w-xl gap-3" onSubmit={(event) => void onSubmit(event)}>
            <label className="grid gap-1 text-sm">Merchant<input className={inputClass} {...form.register("merchant")} /></label>
            {form.formState.errors.merchant ? <span className="text-sm text-secondary">{form.formState.errors.merchant.message}</span> : null}
            <label className="grid gap-1 text-sm">Amount in rupees<input className={inputClass} inputMode="decimal" {...form.register("amount")} /></label>
            {form.formState.errors.amount ? <span className="text-sm text-secondary">{form.formState.errors.amount.message}</span> : null}
            <label className="grid gap-1 text-sm">Date<input className={inputClass} type="date" {...form.register("transacted_on")} /></label>
            <label className="grid gap-1 text-sm">Card
              <select className={inputClass} {...form.register("card_id")}>
                <option value="">Choose</option>
                {cards.data?.map((card) => <option key={card.id} value={card.id}>{card.nickname}</option>)}
              </select>
            </label>
            {form.formState.errors.card_id ? <span className="text-sm text-secondary">{form.formState.errors.card_id.message}</span> : null}
            <label className="grid gap-1 text-sm">Category
              <select className={inputClass} {...form.register("category_id")}>
                <option value="">Choose</option>
                {categories.data?.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
            {form.formState.errors.category_id ? <span className="text-sm text-secondary">{form.formState.errors.category_id.message}</span> : null}
            <label className="grid gap-1 text-sm">Type
              <select className={inputClass} {...form.register("type")}>
                <option value="purchase">Purchase</option>
                <option value="refund">Refund</option>
                <option value="fee">Fee</option>
                <option value="interest">Interest</option>
                <option value="reversal">Reversal</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm">Description<input className={inputClass} {...form.register("description")} /></label>
            <button type="submit" className={primaryButton}>Add transaction</button>
            {message ? <p className="text-sm text-secondary">{message}</p> : null}
          </form>
        ) : null}
        <div className="mt-8 flex flex-wrap gap-3">
          <input className={`${inputClass} max-w-xs`} placeholder="Search merchants" value={q} onChange={(event) => setQ(event.target.value)} />
          <button type="button" className={quietButton} onClick={() => setSort(sort === "date" ? "amount" : "date")}>Sort by {sort === "date" ? "amount" : "date"}</button>
          <button type="button" className={quietButton} onClick={exportCsv}>Export CSV</button>
        </div>
        <div className="mt-4">
          <Panel title="Ledger">
            {rows.data && rows.data.items.length === 0 ? <p className="m-0 text-muted">Nothing recorded yet.</p> : (
              <ul className="m-0 list-none p-0">
                {rows.data?.items.map((tx) => (
                  <li key={tx.id} className="grid gap-1 border-b border-line py-3 text-sm sm:grid-cols-[1fr_auto_auto] sm:items-center">
                    <span>{tx.merchant}<span className="ml-2 text-faint">{tx.category} · {tx.type}</span></span>
                    <span>{tx.transacted_on}</span>
                    <span className="flex items-center gap-3">
                      {formatINR(tx.type === "refund" || tx.type === "reversal" ? -tx.amount_paise : tx.amount_paise)}
                      <button type="button" className="min-h-11 text-faint" onClick={() => void remove(tx.id)}>Delete</button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </Shell>
  );
}
