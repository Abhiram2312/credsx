import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { api } from "../api/client";
import { Atlas } from "../Atlas";
import { CardForm, type CardDraft } from "../CardForm";
import { loadCards, saveCards, type CreditCard } from "../cardStore";
import { Orbit } from "../Orbit";
import { SHOWCASE } from "../showcase";
import { LedgerNav } from "../shell/Shell";
import { ThemeToggle } from "../ThemeToggle";

function day(value: string) {
  return value === "" ? null : Number(value);
}

export function CardsHome() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [params] = useSearchParams();
  const [cards, setCards] = useState<CreditCard[]>(loadCards);
  const [adding, setAdding] = useState(params.get("add") === "1");
  const ledger = useQuery({ queryKey: ["cards"], queryFn: api.cards, retry: false });

  const saveLocal = (next: CreditCard[]) => {
    setCards(next);
    saveCards(next);
  };

  const onSave = async (card: CreditCard, draft: CardDraft) => {
    try {
      await api.createCard({
        issuer: card.issuer,
        nickname: card.nickname,
        network: card.network,
        last_four: card.lastFour || null,
        credit_limit: draft.creditLimit || null,
        cycle_start_day: day(draft.cycleStart),
        cycle_end_day: day(draft.cycleEnd),
        statement_day: day(draft.statementDay),
        due_day: day(draft.dueDay),
        status: "active",
      });
      await queryClient.invalidateQueries({ queryKey: ["cards"] });
    } catch {
      saveLocal([...cards, card]);
    }
    setAdding(false);
  };

  const ledgerCards = ledger.data ?? [];
  const saved = ledger.isSuccess ? [] : cards;

  return (
    <div className="atlas min-h-dvh">
      <Atlas />
      <header className="atlas-bar">
        <button type="button" className="atlas-word" onClick={() => navigate("/cards")}>
          Cards
        </button>
        <div className="atlas-tools">
          <LedgerNav atlas />
          <span className="atlas-meta">INR</span>
          <ThemeToggle />
        </div>
      </header>
      <main className="atlas-main">
        <div className="atlas-stage">
          <Orbit cards={SHOWCASE} onOpen={(id) => navigate(`/cards/${id}`)} onAdd={() => setAdding(true)} />
          {adding ? (
            <div className="atlas-sheet" role="dialog" aria-modal="true" aria-label="Add a card">
              <div className="atlas-sheet-panel bg-bg text-ink">
                <CardForm onClose={() => setAdding(false)} onSave={(card, draft) => void onSave(card, draft)} />
              </div>
            </div>
          ) : null}
          {saved.length > 0 ? (
            <ul className="atlas-saved">
              {saved.map((card) => (
                <li key={card.id}>
                  <button type="button" onClick={() => navigate(`/cards/${card.id}`)}>
                    {card.nickname}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {ledgerCards.length > 0 ? (
            <ul className="atlas-saved">
              {ledgerCards.map((card) => (
                <li key={card.id}>
                  <button type="button" onClick={() => navigate(`/cards/${card.id}`)}>
                    {card.nickname}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </main>
    </div>
  );
}
