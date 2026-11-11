import { useLocation } from "react-router";

type Variant = "dashboard" | "wallet" | "activity" | "settings" | "landing";

function variantFor(path: string): Variant | null {
  if (path === "/") return "dashboard";
  if (path === "/cards") return null;
  if (path === "/transactions") return "activity";
  if (path === "/payments") return "wallet";
  if (path === "/analytics") return "landing";
  if (path === "/settings" || path.startsWith("/cards/")) return "settings";
  return null;
}

export function PageBackground() {
  const { pathname } = useLocation();
  const variant = variantFor(pathname);
  if (!variant) return null;

  return (
    <div className={`page-bg page-bg-${variant}`} aria-hidden="true">
      <div className="page-bg-light" />
      <svg className="page-bg-geo" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
        <Field variant={variant} />
      </svg>
      {variant === "settings" ? null : <div className="page-bg-glass" />}
      <div className="page-bg-grain" />
      <div className="page-bg-vignette" />
    </div>
  );
}

function Field({ variant }: { variant: Variant }) {
  const shift = variant === "wallet" ? "translate(-80 40)" : variant === "activity" ? "translate(40 -30)" : variant === "landing" ? "translate(0 20)" : variant === "settings" ? "translate(60 0)" : "";
  const calm = variant === "settings" ? 0.35 : variant === "landing" ? 0.7 : 0.55;

  return (
    <>
      <defs>
        <pattern id="bg-lattice" width="84" height="48" patternUnits="userSpaceOnUse">
          <path d="M0 24 L21 12 L42 24 L21 36 Z M42 24 L63 12 L84 24 L63 36 Z M21 36 L42 24 L63 36 L42 48 Z" fill="none" stroke="var(--bg-accent)" strokeWidth="0.7" />
          <path d="M21 12 L42 24 L21 36 M42 0 L63 12 L42 24" fill="none" stroke="var(--bg-ink)" strokeWidth="0.45" opacity="0.55" />
        </pattern>
        <radialGradient id="bg-calm" cx="46%" cy="42%" r="58%">
          <stop offset="0%" stopColor="white" stopOpacity="0.12" />
          <stop offset="48%" stopColor="white" stopOpacity="0.4" />
          <stop offset="100%" stopColor="white" stopOpacity="1" />
        </radialGradient>
        <mask id="bg-edge">
          <rect width="1200" height="800" fill="url(#bg-calm)" />
        </mask>
      </defs>
      <g className="bg-drift" transform={shift}>
        <rect width="1200" height="800" fill="url(#bg-lattice)" mask="url(#bg-edge)" opacity={calm} />
      </g>
      <Waves variant={variant} />
      {variant === "settings" ? null : <Veins variant={variant} />}
    </>
  );
}

function Waves({ variant }: { variant: Variant }) {
  const flip = variant === "wallet" || variant === "activity" ? "translate(1200 0) scale(-1 1)" : "";
  return (
    <g transform={flip} opacity={variant === "settings" ? 0.65 : 1}>
      <path d="M640 -40 C 860 160, 760 340, 1040 460 C 1240 550, 1120 700, 1400 780 L 1400 -40 Z" fill="currentColor" opacity="0.045" />
      <path d="M820 -40 C 980 180, 900 400, 1140 520 C 1320 620, 1240 740, 1460 820 L 1460 -40 Z" fill="currentColor" opacity="0.035" />
      <path d="M760 80 C 900 220, 860 380, 1080 470" fill="none" stroke="currentColor" strokeWidth="1.1" opacity="0.16" />
      <path d="M800 150 C 960 280, 920 460, 1160 540" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.12" />
    </g>
  );
}

function Veins({ variant }: { variant: Variant }) {
  const flip = variant === "activity" ? "translate(0 800) scale(1 -1)" : variant === "landing" ? "translate(200 -40)" : "";
  return (
    <g className="bg-extra" transform={flip}>
      <path d="M760 -30 C 900 90, 1040 20, 1180 150 S 1340 80, 1420 220" fill="none" stroke="var(--bg-accent)" strokeWidth="1.15" opacity="0.5" />
      <path d="M800 20 C 940 120, 1080 40, 1240 170" fill="none" stroke="var(--bg-ink)" strokeWidth="0.7" opacity="0.22" />
      <path d="M-60 620 C 80 540, 160 720, 40 820" fill="none" stroke="var(--bg-accent)" strokeWidth="1" opacity="0.4" />
    </g>
  );
}
