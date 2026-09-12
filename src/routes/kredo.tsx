import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CredoBox } from "@/components/credo-box";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { getCredos } from "@/lib/domain";
import { CREDO_LINE } from "@/lib/world";

export const Route = createFileRoute("/kredo")({
  loader: () => getCredos(),
  component: CredoPage,
});

function CredoPage() {
  const initial = Route.useLoaderData();
  const list = useQuery({
    queryKey: ["credos"],
    queryFn: () => getCredos(),
    initialData: initial,
  });
  const credos = list.data?.credos ?? [];

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 pb-20 md:px-10">
        <p className="font-mono text-xs tracking-[0.18em] text-subtle">
          Kanon VII
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight md:text-5xl">
          Kredo
        </h1>
        <p className="mt-3 max-w-xl text-muted">{CREDO_LINE}</p>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Nie ma jednego tekstu do recytacji. Należący przynosi swoje i stoi przy nim.
        </p>

        <h2 className="mt-12 font-display text-2xl tracking-tight">Twoje</h2>
        <CredoBox />

        <h2 className="mt-12 font-display text-2xl tracking-tight">Ściana</h2>
        <ul className="mt-4 divide-y divide-border rounded-xl bg-surface shadow-[var(--shadow-border)]">
          {credos.length === 0 ? (
            <li className="px-5 py-10 text-center text-sm text-subtle">
              Jeszcze pusto. Kto należy, wpisuje pierwsze.
            </li>
          ) : (
            credos.map((item) => (
              <li key={item.userId} className="px-5 py-5">
                <p className="font-mono text-xs tracking-[0.18em] text-subtle">
                  {item.displayName}
                  {item.title ? ` · ${item.title}` : ""}
                </p>
                <p className="mt-2 font-display text-xl tracking-tight text-fg">
                  {item.credo}
                </p>
              </li>
            ))
          )}
        </ul>
        <Button asChild size="sm" className="mt-6">
          <Link to="/slawa">Zobacz galerię lojalnych</Link>
        </Button>
      </main>
    </div>
  );
}
