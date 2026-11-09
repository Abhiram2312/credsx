import type { CreditCard } from "./cardStore";

export const SHOWCASE: CreditCard[] = [
  { id: "premium", nickname: "Premium", issuer: "", network: "other", lastFour: "" },
  { id: "blue", nickname: "Blue", issuer: "", network: "other", lastFour: "" },
  { id: "rewards", nickname: "Rewards", issuer: "", network: "other", lastFour: "" },
];

export function skinFor(card: CreditCard, saved: CreditCard[]) {
  const featured = SHOWCASE.findIndex((item) => item.id === card.id);
  if (featured >= 0) return featured;
  const index = saved.findIndex((item) => item.id === card.id);
  return ((Math.max(index, 0) % 3) + 3) % 3;
}
