import { Link, createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { CREDO_LINE, HEHA, KODEKS, MANIFEST, TONE_LINE } from "@/lib/world";


export const Route = createFileRoute("/kodeks")({
  component: KodeksPage,
});

function KodeksPage() {
  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 pb-20 md:px-10">
        <p className="font-mono text-xs tracking-[0.18em] text-subtle">
          Szef sztabu
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight md:text-5xl">
          Kodeks zboru
        </h1>
        <p className="mt-3 max-w-xl text-muted">{TONE_LINE}</p>
        <p className="mt-2 max-w-xl text-sm text-muted">{CREDO_LINE}</p>
        <Button asChild size="sm" className="mt-4">
          <Link to="/kredo">Ściana kredo</Link>
        </Button>


        <h2 className="mt-12 font-display text-2xl tracking-tight">Manifest</h2>
        <ol className="mt-4 divide-y divide-border rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
          {MANIFEST.map((item, i) => (
            <li key={item.t} className="flex gap-5 px-3 py-5">
              <span className="font-mono text-xs tracking-[0.18em] text-subtle">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <p className="font-display text-xl tracking-tight">{item.t}</p>
                <p className="mt-1 text-sm text-muted">{item.d}</p>
              </div>
            </li>
          ))}
        </ol>

        <h2 className="mt-12 font-display text-2xl tracking-tight">Reguły domu</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {KODEKS.map((item) => (
            <li
              key={item.t}
              className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]"
            >
              <p className="font-display text-xl tracking-tight">{item.t}</p>
              <p className="mt-2 text-sm text-muted">{item.d}</p>
            </li>
          ))}
        </ul>

        <h2 className="mt-12 font-display text-2xl tracking-tight">FAQ Heha</h2>
        <ul className="mt-4 space-y-4">
          {HEHA.map((item) => (
            <li
              key={item.q}
              className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]"
            >
              <p className="font-display text-xl tracking-tight">{item.q}</p>
              <p className="mt-2 text-sm text-muted">{item.a}</p>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
