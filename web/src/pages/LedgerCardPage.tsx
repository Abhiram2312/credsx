import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router";
import type { LedgerCard } from "../api/client";
import { api } from "../api/client";
import { formatBps, formatINR } from "../format";
import { Panel, primaryButton, quietButton } from "../shell/Shell";

type Props = {
  card: LedgerCard | undefined;
  missing: boolean;
  onBack: () => void;
};

export function LedgerCardPage({ card, missing, onBack }: Props) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState("");
  const [message, setMessage] = useState("");

  if (!card) {
    return (
      <div>
        <button type="button" className="inline-flex min-h-11 items-center text-sm" onClick={onBack}>
          All cards
        </button>
        <p className="mt-6 text-muted">{missing ? "This card is not in the ledger." : "Loading the card."}</p>
      </div>
    );
  }

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["card", card.id] });
    await queryClient.invalidateQueries({ queryKey: ["cards"] });
  };

  const rename = async () => {
    setMessage("");
    try {
      await api.patchCard(card.id, { nickname: nickname || card.nickname });
      await refresh();
      setEditing(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The card could not be saved.");
    }
  };

  const toggle = async () => {
    setMessage("");
    try {
      await api.patchCard(card.id, { status: card.status === "active" ? "inactive" : "active" });
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The card could not be saved.");
    }
  };

  const archive = async () => {
    await api.archiveCard(card.id);
    await queryClient.invalidateQueries({ queryKey: ["cards"] });
    onBack();
  };

  return (
    <div>
      <button type="button" className="inline-flex min-h-11 items-center text-sm" onClick={onBack}>
        All cards
      </button>
      <h1 className="mt-4 mb-2 text-[clamp(36px,6vw,64px)] leading-none font-medium tracking-[-0.045em]">{card.nickname}</h1>
      <p className="m-0 text-muted">
        {card.issuer}
        {card.last_four ? ` ···· ${card.last_four}` : ""}
        {` · ${card.status}`}
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Panel title="Outstanding">
          <p className="m-0 text-2xl font-medium tracking-[-0.04em]">{formatINR(card.outstanding_paise)}</p>
        </Panel>
        <Panel title="Available credit">
          <p className="m-0 text-2xl font-medium tracking-[-0.04em]">{formatINR(card.available_paise)}</p>
        </Panel>
        <Panel title="Utilization">
          <p className="m-0 text-2xl font-medium tracking-[-0.04em]">{formatBps(card.utilization_bps)}</p>
        </Panel>
      </div>
      <div className="mt-3 flex flex-wrap gap-3">
        <Link className={primaryButton} to={`/transactions?card=${card.id}`}>
          Transactions
        </Link>
        <Link className={quietButton} to={`/payments?card=${card.id}`}>
          Payments
        </Link>
        <button type="button" className={quietButton} onClick={() => { setNickname(card.nickname); setEditing(true); }}>
          Edit name
        </button>
        <button type="button" className={quietButton} onClick={() => void toggle()}>
          {card.status === "active" ? "Deactivate" : "Activate"}
        </button>
        <button type="button" className={quietButton} onClick={() => void archive()}>
          Archive
        </button>
      </div>
      {editing ? (
        <form
          className="mt-4 grid max-w-md gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void rename();
          }}
        >
          <label className="grid gap-1 text-sm">
            Name you use
            <input className="min-h-11 rounded-md border border-line bg-card px-3" value={nickname} onChange={(event) => setNickname(event.target.value)} />
          </label>
          <button type="submit" className={primaryButton}>
            Save name
          </button>
        </form>
      ) : null}
      {message ? <p className="text-secondary">{message}</p> : null}
    </div>
  );
}
