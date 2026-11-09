import { AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import { Atlas } from "./Atlas";
import { CardForm } from "./CardForm";
import { loadCards, saveCards, type CreditCard } from "./cardStore";
import { Dashboard } from "./Dashboard";
import { Orbit } from "./Orbit";
import { SHOWCASE, skinFor } from "./showcase";
import { ThemeToggle } from "./ThemeToggle";

type Screen = { name: "orbit" } | { name: "card"; id: string };

function findCard(id: string, saved: CreditCard[]) {
  return SHOWCASE.find((card) => card.id === id) ?? saved.find((card) => card.id === id);
}

export default function App() {
  const [cards, setCards] = useState<CreditCard[]>(loadCards);
  const [screen, setScreen] = useState<Screen>({ name: "orbit" });
  const [adding, setAdding] = useState(false);
  const open = screen.name === "card" ? findCard(screen.id, cards) : undefined;
  const landing = !(screen.name === "card" && open);

  useEffect(() => {
    saveCards(cards);
  }, [cards]);

  const home = () => {
    setScreen({ name: "orbit" });
    setAdding(false);
  };

  const openCard = (id: string) => {
    setScreen({ name: "card", id });
    setAdding(false);
  };

  return (
    <div className={landing ? "atlas min-h-dvh" : "min-h-dvh bg-bg text-ink"}>
      {landing ? <Atlas /> : null}
      <header className={landing ? "atlas-bar" : "mx-auto flex w-[min(1040px,calc(100%-28px))] items-center justify-between gap-4 pt-7 sm:w-[min(1040px,calc(100%-40px))]"}>
        <button type="button" className={landing ? "atlas-word" : "min-h-11 bg-transparent p-0 text-[15px] font-medium tracking-[-0.04em] text-ink"} onClick={home}>
          Cards
        </button>
        <div className="atlas-tools">
          <span className={landing ? "atlas-meta" : "text-[11px] tracking-[0.18em] text-faint uppercase"}>INR</span>
          <ThemeToggle />
        </div>
      </header>
      <main id="top" className={landing ? "atlas-main" : "mx-auto w-[min(1040px,calc(100%-28px))] pt-8 pb-16 sm:w-[min(1040px,calc(100%-40px))] sm:pt-12"}>
        <AnimatePresence mode="wait">
          {screen.name === "card" && open ? (
            <Dashboard key={open.id} card={open} skin={skinFor(open, cards)} onBack={home} />
          ) : (
            <div key="orbit" className="atlas-stage">
              <Orbit cards={SHOWCASE} onOpen={openCard} onAdd={() => setAdding(true)} />
              {adding ? (
                <div className="atlas-sheet" role="dialog" aria-modal="true" aria-label="Add a card">
                  <div className="atlas-sheet-panel bg-bg text-ink">
                    <CardForm
                      onClose={() => setAdding(false)}
                      onSave={(card) => {
                        setCards((current) => [...current, card]);
                        setAdding(false);
                      }}
                    />
                  </div>
                </div>
              ) : null}
              {cards.length > 0 ? (
                <ul className="atlas-saved">
                  {cards.map((card) => (
                    <li key={card.id}>
                      <button type="button" onClick={() => openCard(card.id)}>
                        {card.nickname}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
