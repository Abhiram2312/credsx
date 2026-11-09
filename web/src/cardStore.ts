export const NETWORKS = [
  { id: "visa", label: "Visa" },
  { id: "mastercard", label: "Mastercard" },
  { id: "rupay", label: "RuPay" },
  { id: "amex", label: "Amex" },
  { id: "other", label: "Other" },
] as const;

export type NetworkId = (typeof NETWORKS)[number]["id"];

export type CreditCard = {
  id: string;
  issuer: string;
  nickname: string;
  network: NetworkId;
  lastFour: string;
};

const KEY = "cards-own";

function isNetwork(value: string): value is NetworkId {
  return NETWORKS.some((item) => item.id === value);
}

function isCard(value: unknown): value is CreditCard {
  if (!value || typeof value !== "object") return false;
  const card = value as Partial<CreditCard>;
  return (
    typeof card.id === "string" &&
    typeof card.issuer === "string" &&
    typeof card.nickname === "string" &&
    typeof card.network === "string" &&
    isNetwork(card.network) &&
    typeof card.lastFour === "string"
  );
}

export function loadCards(): CreditCard[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isCard);
  } catch {
    return [];
  }
}

export function saveCards(cards: CreditCard[]) {
  localStorage.setItem(KEY, JSON.stringify(cards));
}

export function networkLabel(id: NetworkId) {
  return NETWORKS.find((item) => item.id === id)?.label ?? "Other";
}
