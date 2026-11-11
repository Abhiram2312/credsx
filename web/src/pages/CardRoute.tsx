import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router";
import { api } from "../api/client";
import { loadCards } from "../cardStore";
import { Dashboard } from "../Dashboard";
import { SHOWCASE, skinFor } from "../showcase";
import { Shell } from "../shell/Shell";
import { LedgerCardPage } from "./LedgerCardPage";

export function CardRoute() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const saved = loadCards();
  const known = SHOWCASE.find((card) => card.id === id) ?? saved.find((card) => card.id === id);
  const ledger = useQuery({
    queryKey: ["card", id],
    queryFn: () => api.card(id),
    enabled: !known && id.length > 0,
    retry: false,
  });

  if (known) {
    return (
      <Shell>
        <Dashboard card={known} skin={skinFor(known, saved)} onBack={() => navigate("/cards")} />
      </Shell>
    );
  }

  return (
    <Shell>
      <LedgerCardPage card={ledger.data} missing={ledger.isError} onBack={() => navigate("/cards")} />
    </Shell>
  );
}
