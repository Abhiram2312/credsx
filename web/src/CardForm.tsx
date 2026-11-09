import { motion } from "motion/react";
import { useState, type FormEvent } from "react";
import { NETWORKS, type CreditCard, type NetworkId } from "./cardStore";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

type Props = {
  onSave: (card: CreditCard) => void;
  onClose: () => void;
};

export function CardForm({ onSave, onClose }: Props) {
  const reduced = usePrefersReducedMotion();
  const [issuer, setIssuer] = useState("");
  const [nickname, setNickname] = useState("");
  const [network, setNetwork] = useState<NetworkId>("visa");
  const [lastFour, setLastFour] = useState("");
  const [errors, setErrors] = useState<{ issuer?: string; nickname?: string; lastFour?: string }>({});

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const next: typeof errors = {};
    if (!issuer.trim()) next.issuer = "Enter the issuer.";
    if (!nickname.trim()) next.nickname = "Enter a name you will recognize.";
    if (lastFour !== "" && !/^\d{4}$/.test(lastFour)) {
      next.lastFour = "Use four digits, or leave this blank.";
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    onSave({
      id: crypto.randomUUID(),
      issuer: issuer.trim(),
      nickname: nickname.trim(),
      network,
      lastFour,
    });
  };

  return (
    <motion.form
      className="mx-auto mt-6 grid max-w-md gap-4"
      onSubmit={submit}
      initial={reduced ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
    >
      <label className="grid gap-1 text-sm">
        Issuer
        <input
          className="min-h-11 rounded-md border border-line bg-card px-3 text-ink"
          value={issuer}
          onChange={(event) => setIssuer(event.target.value)}
          autoComplete="organization"
        />
        {errors.issuer ? <span className="text-ink">{errors.issuer}</span> : null}
      </label>
      <label className="grid gap-1 text-sm">
        Name you use
        <input
          className="min-h-11 rounded-md border border-line bg-card px-3 text-ink"
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
        />
        {errors.nickname ? <span className="text-ink">{errors.nickname}</span> : null}
      </label>
      <label className="grid gap-1 text-sm">
        Network
        <select
          className="min-h-11 rounded-md border border-line bg-card px-3 text-ink"
          value={network}
          onChange={(event) => setNetwork(event.target.value as NetworkId)}
        >
          {NETWORKS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        Last four, optional
        <input
          className="min-h-11 rounded-md border border-line bg-card px-3 text-ink"
          inputMode="numeric"
          maxLength={4}
          value={lastFour}
          onChange={(event) => setLastFour(event.target.value.replace(/\D/g, "").slice(0, 4))}
        />
        {errors.lastFour ? <span className="text-ink">{errors.lastFour}</span> : null}
      </label>
      <div className="flex flex-wrap gap-3">
        <button type="submit" className="inline-flex min-h-11 items-center rounded-md bg-ink px-4 text-sm text-bg">
          Put it on the circle
        </button>
        <button type="button" className="inline-flex min-h-11 items-center rounded-md border border-line px-4 text-sm" onClick={onClose}>
          Close
        </button>
      </div>
    </motion.form>
  );
}
