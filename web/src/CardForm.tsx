import { motion } from "motion/react";
import { useState, type FormEvent } from "react";
import { NETWORKS, type CreditCard, type NetworkId } from "./cardStore";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

export type CardDraft = {
  creditLimit: string;
  cycleStart: string;
  cycleEnd: string;
  statementDay: string;
  dueDay: string;
};

type Props = {
  onSave: (card: CreditCard, draft: CardDraft) => void;
  onClose: () => void;
};

export function CardForm({ onSave, onClose }: Props) {
  const reduced = usePrefersReducedMotion();
  const [issuer, setIssuer] = useState("");
  const [nickname, setNickname] = useState("");
  const [network, setNetwork] = useState<NetworkId>("visa");
  const [lastFour, setLastFour] = useState("");
  const [creditLimit, setCreditLimit] = useState("");
  const [cycleStart, setCycleStart] = useState("");
  const [cycleEnd, setCycleEnd] = useState("");
  const [statementDay, setStatementDay] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [errors, setErrors] = useState<{ issuer?: string; nickname?: string; lastFour?: string; day?: string; limit?: string }>({});

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const next: typeof errors = {};
    if (!issuer.trim()) next.issuer = "Enter the issuer.";
    if (!nickname.trim()) next.nickname = "Enter a name you will recognize.";
    if (lastFour !== "" && !/^\d{4}$/.test(lastFour)) {
      next.lastFour = "Use four digits, or leave this blank.";
    }
    const days = [cycleStart, cycleEnd, statementDay, dueDay];
    if (days.some((day) => day !== "" && !/^(?:[1-9]|[12]\d|3[01])$/.test(day))) {
      next.day = "Use a day from 1 to 31, or leave it blank.";
    }
    if (creditLimit !== "" && !/^\d+(\.\d{1,2})?$/.test(creditLimit)) {
      next.limit = "Enter the limit in rupees, or leave it blank.";
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    onSave(
      {
        id: crypto.randomUUID(),
        issuer: issuer.trim(),
        nickname: nickname.trim(),
        network,
        lastFour,
      },
      { creditLimit, cycleStart, cycleEnd, statementDay, dueDay },
    );
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
      <label className="grid gap-1 text-sm">
        Credit limit, optional
        <input className="min-h-11 rounded-md border border-line bg-card px-3 text-ink" inputMode="decimal" value={creditLimit} onChange={(event) => setCreditLimit(event.target.value)} />
        {errors.limit ? <span className="text-ink">{errors.limit}</span> : null}
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1 text-sm">
          Cycle start day
          <input className="min-h-11 rounded-md border border-line bg-card px-3 text-ink" inputMode="numeric" value={cycleStart} onChange={(event) => setCycleStart(event.target.value)} />
        </label>
        <label className="grid gap-1 text-sm">
          Cycle end day
          <input className="min-h-11 rounded-md border border-line bg-card px-3 text-ink" inputMode="numeric" value={cycleEnd} onChange={(event) => setCycleEnd(event.target.value)} />
        </label>
        <label className="grid gap-1 text-sm">
          Statement day
          <input className="min-h-11 rounded-md border border-line bg-card px-3 text-ink" inputMode="numeric" value={statementDay} onChange={(event) => setStatementDay(event.target.value)} />
        </label>
        <label className="grid gap-1 text-sm">
          Due day
          <input className="min-h-11 rounded-md border border-line bg-card px-3 text-ink" inputMode="numeric" value={dueDay} onChange={(event) => setDueDay(event.target.value)} />
        </label>
      </div>
      {errors.day ? <span className="text-sm text-ink">{errors.day}</span> : null}
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
