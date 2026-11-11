import { motion } from "motion/react";
import { networkLabel, type CreditCard } from "./cardStore";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

const PANELS = [
  { title: "Outstanding", body: "No statement yet." },
  { title: "Minimum", body: "Not provided." },
  { title: "Next due", body: "No date yet." },
] as const;

type Props = {
  card: CreditCard;
  skin: number;
  onBack: () => void;
};

export function Dashboard({ card, skin, onBack }: Props) {
  const reduced = usePrefersReducedMotion();
  const travel = reduced
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 140, damping: 16 };

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduced ? undefined : { opacity: 0 }}
      transition={{ duration: reduced ? 0 : 0.25 }}
    >
      <button
        type="button"
        className="inline-flex min-h-11 items-center text-sm text-ink"
        onClick={onBack}
      >
        All cards
      </button>
      <motion.article
        className="skin-plate relative mt-4 overflow-hidden rounded-[28px] px-6 py-8 sm:px-10"
        data-skin={skin}
        style={{ transformPerspective: 1100 }}
        initial={reduced ? false : { rotateY: -78, rotateX: 18, scale: 0.55, y: 90, opacity: 0 }}
        animate={{ rotateY: 0, rotateX: 0, scale: 1, y: 0, opacity: 1 }}
        transition={travel}
      >
        {!reduced ? (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 w-1/3"
            initial={{ x: "-160%" }}
            animate={{ x: "420%" }}
            transition={{ duration: 0.85, delay: 0.25, ease: "easeOut" }}
            style={{ background: "linear-gradient(100deg, transparent, rgba(255,255,255,0.28), transparent)" }}
          />
        ) : null}
        {card.network !== "other" ? (
          <p className="skin-quiet m-0 text-[11px] tracking-[0.18em] uppercase">
            {networkLabel(card.network)}
          </p>
        ) : null}
        <h2 className="mt-6 mb-0 text-[clamp(36px,6vw,64px)] leading-none font-medium tracking-[-0.045em]">
          {card.nickname}
        </h2>
        <motion.div
          aria-hidden
          className="mt-5 h-px w-24 origin-left bg-accent"
          initial={reduced ? false : { scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={reduced ? { duration: 0 } : { duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
        />
        {card.issuer ? <p className="skin-quiet mt-4 mb-0 text-lg">{card.issuer}</p> : null}
        {card.lastFour ? (
          <p className="skin-quiet mt-8 mb-0 text-sm tracking-[0.18em]">{`···· ${card.lastFour}`}</p>
        ) : null}
      </motion.article>
      <motion.div
        className="mt-6 grid gap-3 sm:grid-cols-3"
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: reduced ? 0 : 0.09, delayChildren: reduced ? 0 : 0.28 } },
        }}
      >
        {PANELS.map((panel) => (
          <motion.section
            key={panel.title}
            className="rounded-[22px] border border-line bg-card px-5 py-6"
            variants={{
              hidden: reduced ? { opacity: 1 } : { opacity: 0, y: 42, rotateX: -18 },
              show: { opacity: 1, y: 0, rotateX: 0, transition: travel },
            }}
            style={{ transformPerspective: 800 }}
          >
            <h3 className="m-0 text-sm text-faint">{panel.title}</h3>
            <p className="mt-3 mb-0 text-2xl leading-none font-medium tracking-[-0.04em]">{panel.body}</p>
          </motion.section>
        ))}
      </motion.div>
      <motion.section
        className="mt-3 rounded-[22px] border border-line bg-card px-5 py-6"
        initial={reduced ? false : { opacity: 0, y: 36 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...travel, delay: reduced ? 0 : 0.55 }}
      >
        <h3 className="m-0 text-sm text-faint">Statements</h3>
        <p className="mt-3 mb-0 max-w-[38em] text-base leading-relaxed text-muted">
          {card.issuer
            ? `None yet. You pay ${card.issuer} yourself, then record the amount and the date here.`
            : "None yet. You pay the issuer yourself, then record the amount and the date here."}{" "}
          This page does not show a sample balance.
        </p>
      </motion.section>
    </motion.div>
  );
}
