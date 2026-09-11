import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { getCredos, getDomainSnapshot } from "@/lib/domain";
import { CREDO_LINE, FAME, OPAL_CREDO, TONE_LINE } from "@/lib/world";

export const Route = createFileRoute("/slawa")({
  loader: async () => {
    const [domain, credos] = await Promise.all([getDomainSnapshot(), getCredos()]);
    return { domain, credos };
  },
  component: SlawaPage,
});

type Person = (typeof FAME)[number];

function FameCard({
  person,
  liveName,
  featured = false,
}: {
  person: Person;
  liveName?: string | null;
  featured?: boolean;
}) {
  return (
    <li
      id={person.id}
      className={
        featured
          ? "rounded-xl bg-surface p-6 shadow-[var(--shadow-border-hover)] md:p-8"
          : "rounded-xl bg-surface p-5 shadow-[var(--shadow-border)] md:p-6"
      }
    >
      <div className="flex items-start gap-4">
        <span
          aria-hidden
          className="grid size-12 shrink-0 place-items-center rounded-full bg-surface-2 font-display text-xl text-accent shadow-[var(--shadow-border)]"
        >
          {person.mark}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs tracking-[0.18em] text-subtle">
            {featured ? "Miejsce zarezerwowane · " : ""}
            {person.office}
            {person.aka ? ` · ${person.aka}` : ""}
          </p>
          <h2
            className={
              featured
                ? "mt-1 font-display text-3xl tracking-tight md:text-4xl"
                : "mt-1 font-display text-2xl tracking-tight md:text-3xl"
            }
          >
            {liveName ?? person.name}
          </h2>
          {liveName && liveName !== person.name ? (
            <p className="mt-1 text-sm text-subtle">{person.name}</p>
          ) : null}
          <p className="mt-3 text-sm text-muted">{person.blurb}</p>
          {featured ? (
            <p className="mt-4 font-display text-xl tracking-tight">{OPAL_CREDO}</p>
          ) : null}
          <ul className="mt-4 space-y-2">
            {person.merits.map((merit) => (
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
        </div>
      </div>
    </li>
  );
}

function SlawaPage() {
  const initial = Route.useLoaderData();
  const domain = useQuery({
    queryKey: ["domain"],
    queryFn: () => getDomainSnapshot(),
    initialData: initial.domain,
  });
  const credos = useQuery({
    queryKey: ["credos"],
    queryFn: () => getCredos(),
    initialData: initial.credos,
  });
  const founder = domain.data?.founder;
  const living = credos.data?.credos ?? [];
  const lukasz = FAME.find((person) => person.id === "opal")!;
  const rest = FAME.filter((person) => person.id !== "opal");

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 pb-20 md:px-10">
        <p className="font-mono text-xs tracking-[0.18em] text-subtle">
          Galeria sław
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight md:text-5xl">
          DurnoBartosizjanie
        </h1>
        <p className="mt-3 max-w-xl text-muted">
          Łukasz też. Miejsce zarezerwowane — na górze, nie na końcu.
        </p>
        <p className="mt-2 max-w-xl text-sm text-muted">{TONE_LINE}</p>

        <ul className="mt-12 space-y-6">
          <FameCard person={lukasz} featured />
        </ul>

        <h2 className="mt-16 font-display text-2xl tracking-tight">Sztab i próg</h2>
        <ul className="mt-6 space-y-6">
          {rest.map((person) => (
            <FameCard
              key={person.id}
              person={person}
              liveName={
                person.id === "prorok" && founder ? founder.displayName : null
              }
            />
          ))}
        </ul>

        <h2 className="mt-16 font-display text-2xl tracking-tight">Żywi na ścianie</h2>
        <p className="mt-2 max-w-xl text-sm text-muted">
          {CREDO_LINE} Kto pieczętuje kredo, wchodzi do galerii żywych. Łukasz ma miejsce zarezerwowane.
        </p>
        <ul className="mt-6 divide-y divide-border rounded-xl bg-surface shadow-[var(--shadow-border)]">
          <li className="px-5 py-5">
            <p className="font-mono text-xs tracking-[0.18em] text-subtle">
              Łukasz Opiłka · Opał · Bit · zarezerwowane
            </p>
            <p className="mt-2 font-display text-xl tracking-tight">{OPAL_CREDO}</p>
          </li>
          {living.map((item) => (
            <li key={item.userId} className="px-5 py-5">
              <p className="font-mono text-xs tracking-[0.18em] text-subtle">
                {item.displayName}
                {item.title
                  ? ` · ${item.title}`
                  : item.role === "founder"
                    ? " · Prorok"
                    : " · należący"}
              </p>
              <p className="mt-2 font-display text-xl tracking-tight">{item.credo}</p>
            </li>
          ))}
        </ul>
        <Button asChild size="sm" className="mt-4">
          <Link to="/kredo">Złóż kredo</Link>
        </Button>
      </main>
    </div>
  );
}
