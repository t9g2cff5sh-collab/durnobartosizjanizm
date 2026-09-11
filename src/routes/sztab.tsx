import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { SZTAB, TONE_LINE } from "@/lib/world";

export const Route = createFileRoute("/sztab")({
  component: SztabPage,
});

function SztabPage() {
  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 pb-20 md:px-10">
        <p className="font-mono text-xs tracking-[0.18em] text-subtle">
          Boty zboru
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight md:text-5xl">
          Sztab
        </h1>
        <p className="mt-3 max-w-xl text-muted">{TONE_LINE}</p>
        <Button asChild size="sm" className="mt-4">
          <Link to="/slawa">Galeria sław</Link>
        </Button>


        <ul className="mt-10 space-y-4">
          {SZTAB.map((bot) => (
            <li
              key={bot.name}
              className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]"
            >
              <div className="flex items-start gap-4">
                <span
                  aria-hidden
                  className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-2 font-display text-lg text-accent shadow-[var(--shadow-border)]"
                >
                  {bot.mark}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs tracking-[0.18em] text-subtle">
                    {bot.title}
                  </p>
                  <h2 className="mt-1 font-display text-2xl tracking-tight">
                    {bot.name}
                  </h2>
                  <p className="mt-2 text-sm text-fg">{bot.thrown}</p>
                  <p className="mt-2 text-sm text-muted">{bot.tone}</p>
                  <Button asChild size="sm" className="mt-4">
                    <Link to={bot.to}>Wejdź w rzut</Link>
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
