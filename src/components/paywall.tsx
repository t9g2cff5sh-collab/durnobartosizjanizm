import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { DUES_LABEL, formatPieniazki, DUES_FEE } from "@/lib/dues";

export function Paywall({ action }: { action: string }) {
  return (
    <div className="mt-6 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
      <p className="font-mono text-xs tracking-[0.18em] text-subtle">
        Składka
      </p>
      <p className="mt-2 font-display text-2xl tracking-tight">
        {formatPieniazki(DUES_FEE)}
      </p>
      <p className="mt-2 text-sm text-muted">
        {DUES_LABEL}. Dopiero po wpłacie z kieszeni możesz {action}.
      </p>
      <Button asChild className="mt-4">
        <Link to="/skladka">Złóż składkę</Link>
      </Button>
    </div>
  );
}
