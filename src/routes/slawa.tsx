import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BoardShell } from "@/components/board-shell";
import { HonorMark } from "@/components/honor-mark";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { getDomainSnapshot } from "@/lib/domain";
import { getLoyaltyBoard } from "@/lib/loyalty";
import { FAME, type FameMerit } from "@/lib/world";

export const Route = createFileRoute("/slawa")({
  loader: async () => {
    const [domain, loyalty] = await Promise.all([
      getDomainSnapshot(),
      getLoyaltyBoard(),
    ]);
    return { domain, loyalty };
  },
  component: SlawaPage,
});

function SlawaPage() {
  const initial = Route.useLoaderData();
  const domain = useQuery({
    queryKey: ["domain"],
    queryFn: () => getDomainSnapshot(),
    initialData: initial.domain,
  });
  const loyalty = useQuery({
    queryKey: ["loyalty"],
    queryFn: () => getLoyaltyBoard(),
    initialData: initial.loyalty,
  });
  const founder = domain.data?.founder;
  const loyal = loyalty.data?.loyal ?? [];
  const reserved = FAME.filter(
    (person) => "reserved" in person && person.reserved,
  );
  const living = loyal.filter((item) => item.honor !== "zarezerwowane");
  const sztab = FAME.filter(
    (person) => person.id !== "prorok" && !("reserved" in person && person.reserved),
  );

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <BoardShell current="/slawa">
        <section className="space-y-4">
          {reserved.map((person) => (
            <article
              key={person.id}
              id={person.id}
              className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)] md:p-6"
            >
              <p className="font-mono text-xs tracking-[0.18em] text-subtle">
                Miejsce zarezerwowane · {person.office}
                {person.aka ? ` · ${person.aka}` : ""}
              </p>
              <h2 className="mt-2 font-display text-3xl tracking-tight">
                {person.name}
              </h2>
              {"kredo" in person && person.kredo ? (
                <p className="mt-3 font-display text-xl tracking-tight">
                  {person.kredo}
                </p>
              ) : null}
              <p className="mt-3 text-sm text-muted">{person.blurb}</p>
              <ul className="mt-4 space-y-2">
                {person.merits.map((merit: FameMerit) => (
                  <li key={merit.t} className="flex gap-3 text-sm">
                    <span className="mt-0.5 shrink-0 font-mono text-[10px] uppercase tracking-[0.16em] text-subtle">
                      {merit.where}
                    </span>
                    <span className="text-fg">{merit.t}</span>
                  </li>
                ))}
              </ul>
              <Button asChild size="sm" className="mt-5">
                <Link to={person.to}>Ślad</Link>
              </Button>
            </article>
          ))}
        </section>

        <section className="board-wall mt-10">
          <header className="border-b border-border px-5 py-4 md:px-6">
            <p className="font-mono text-xs tracking-[0.18em] text-subtle">
              Galeria wyróżnień
            </p>
            <h2 className="mt-1 font-display text-2xl tracking-tight">
              Lojalni wobec proroka
            </h2>
          </header>
          {living.length === 0 ? (
            <p className="px-5 py-10 text-sm text-muted md:px-6">
              Ściana czeka. Składka otwiera próg. Kredo pieczętuje imię.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {living.map((item) => (
                <li key={item.userId} className="px-5 py-5 md:px-6">
                  <HonorMark mark={item} />
                </li>
              ))}
            </ul>
          )}
          <footer className="border-t border-border px-5 py-4 md:px-6">
            <Button asChild size="sm">
              <Link to="/kredo">Złóż kredo i stań na ścianie</Link>
            </Button>
          </footer>
        </section>

        <section className="mt-16">
          <p className="font-mono text-xs tracking-[0.18em] text-subtle">
            Pieczęcie sztabu
          </p>
          <h2 className="mt-2 font-display text-2xl tracking-tight">
            Sztab domu
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted">
            {founder
              ? `${founder.displayName} pieczętuje próg. Sztab stoi przy nim.`
              : "Sztab stoi przy proroku."}
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {sztab.map((person) => (
              <li
                key={person.id}
                id={person.id}
                className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]"
              >
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-2 font-display text-lg text-accent shadow-[var(--shadow-border)]"
                  >
                    {person.mark}
                  </span>
                  <div className="min-w-0">
                    <p className="font-mono text-xs tracking-[0.18em] text-subtle">
                      {person.office}
                    </p>
                    <h3 className="mt-1 font-display text-xl tracking-tight">
                      {person.name}
                    </h3>
                    <p className="mt-2 text-sm text-muted">{person.blurb}</p>
                    <ul className="mt-3 space-y-1.5">
                      {person.merits.slice(0, 2).map((merit) => (
                        <li key={merit.t} className="text-sm text-fg">
                          {merit.t}
                        </li>
                      ))}
                    </ul>
                    <Button asChild size="sm" variant="ghost" className="mt-3">
                      <Link to={person.to}>Ślad</Link>
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </BoardShell>
    </div>
  );
}
