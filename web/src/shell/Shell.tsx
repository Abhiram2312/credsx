import type { ReactNode } from "react";
import { NavLink } from "react-router";
import { ThemeToggle } from "../ThemeToggle";

const LINKS = [
  { to: "/", label: "Overview" },
  { to: "/cards", label: "My Cards" },
  { to: "/transactions", label: "Transactions" },
  { to: "/payments", label: "Payments" },
  { to: "/analytics", label: "Analytics" },
  { to: "/settings", label: "Settings" },
] as const;

export function LedgerNav({ atlas = false }: { atlas?: boolean }) {
  return (
    <nav aria-label="Sections" className="flex flex-wrap items-center gap-x-4 gap-y-1">
      {LINKS.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.to === "/"}
          className={({ isActive }) =>
            atlas
              ? `inline-flex min-h-11 items-center text-[11px] tracking-[0.16em] uppercase ${isActive ? "text-[var(--atlas-ink)]" : "text-[var(--atlas-quiet)]"}`
              : `inline-flex min-h-11 items-center text-[11px] tracking-[0.16em] uppercase ${isActive ? "text-foreground" : "text-faint"}`
          }
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}

export function PageHead({ kicker, title, art }: { kicker: string; title: string; art?: ReactNode }) {
  return (
    <div className="page-head">
      <div>
        <p className="kicker">{kicker}</p>
        <h1 className="page-title">{title}</h1>
      </div>
      {art ? <div className="page-art">{art}</div> : null}
    </div>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="quiet-ground min-h-dvh text-foreground">
      <header className="shell-layer mx-auto flex w-[min(1040px,calc(100%-28px))] flex-wrap items-center justify-between gap-4 pt-7 sm:w-[min(1040px,calc(100%-40px))]">
        <NavLink to="/cards" className="min-h-11 text-[15px] font-medium tracking-[-0.04em]">
          Cards
        </NavLink>
        <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1">
          <LedgerNav />
          <span className="text-[11px] tracking-[0.18em] text-faint uppercase">INR</span>
          <ThemeToggle />
        </div>
      </header>
      <main className="shell-layer mx-auto w-[min(1040px,calc(100%-28px))] pt-8 pb-16 sm:w-[min(1040px,calc(100%-40px))] sm:pt-12">{children}</main>
    </div>
  );
}

export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[22px] border border-line bg-elevated px-5 py-6">
      <h2 className="m-0 text-sm text-faint">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export const inputClass = "min-h-11 w-full rounded-md border border-line bg-card px-3 text-ink";
export const primaryButton = "inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm text-background";
export const quietButton = "inline-flex min-h-11 items-center rounded-md border border-line px-4 text-sm";
