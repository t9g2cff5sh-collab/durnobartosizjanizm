import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Guestbook } from "@/components/guestbook";
import { SiteHeader } from "@/components/site-header";
import { getDomainSnapshot } from "@/lib/domain";
import { CO_CREATOR } from "@/lib/world";

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
          {CO_CREATOR.name} · {CO_CREATOR.title}
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight md:text-5xl">
          Księga gości
        </h1>
        <p className="mt-3 text-muted">
          Kto tu był, zostawia imię. To nie komentarz — to podpis.
        </p>
        <div className="mt-10">
          <Guestbook entries={domain.data?.guestbook ?? []} hideIntro />
        </div>
      </main>
    </div>
  );
}
