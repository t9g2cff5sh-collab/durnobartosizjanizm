import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Guestbook } from "@/components/guestbook";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { getDomainSnapshot } from "@/lib/domain";
import { HURTEM_LINE, TABLE_HOST_NAME, TABLE_LINE } from "@/lib/world";

export const Route = createFileRoute("/ksiega")({
  loader: () => getDomainSnapshot(),
  component: KsiegaPage,
});

function KsiegaPage() {
  const initial = Route.useLoaderData();
  const domain = useQuery({
    queryKey: ["domain"],
    queryFn: () => getDomainSnapshot(),
    initialData: initial,
  });

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-5 pb-20 md:px-10">
        <p className="font-mono text-xs tracking-[0.18em] text-subtle">
          {TABLE_HOST_NAME} · pieczęć stołu
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight md:text-5xl">
          Księga gości
        </h1>
        <p className="mt-3 text-muted">
          Kto tu był, zostawia imię. To nie komentarz — to podpis pod pieczęcią.
        </p>

        <article className="mt-10 flex gap-4 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
          <div className="grid size-12 shrink-0 place-items-center rounded-full border border-border font-display text-xl">
            Ż
          </div>
          <div>
            <p className="font-mono text-xs tracking-[0.18em] text-subtle">
              Zabezpieczenie od Bozi
            </p>
            <h2 className="mt-1 font-display text-2xl tracking-tight">
              {TABLE_HOST_NAME} pieczętuje stół
            </h2>
            <p className="mt-2 text-sm text-muted">{TABLE_LINE}</p>
            <p className="mt-2 text-xs text-subtle">{HURTEM_LINE}</p>
          </div>
        </article>

        <div className="mt-10">
          <Guestbook entries={domain.data?.guestbook ?? []} hideIntro />
        </div>
        <Button asChild size="sm" variant="ghost" className="mt-8">
          <Link to="/zbor">Próg Monitora</Link>
        </Button>
      </main>
    </div>
  );
}