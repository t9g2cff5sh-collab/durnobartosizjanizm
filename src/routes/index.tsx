import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, MapPin } from "lucide-react";
import { toast } from "sonner";
import { Guestbook } from "@/components/guestbook";
import { SiteHeader } from "@/components/site-header";
import { SealMark } from "@/components/seal-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useResolvedAuth } from "@/lib/use-resolved-auth";
import { getDomainSnapshot, type DomainSnapshot } from "@/lib/domain";
import { formatPlDate } from "@/lib/utils";
import { CANONS, CO_CREATOR, HOST_NAME, HOST_TITLE, WORLD_HOST } from "@/lib/world";


export const Route = createFileRoute("/")({
  loader: () => getDomainSnapshot(),
  component: Home,
});

function Home() {
  const initial = Route.useLoaderData();
  const { isSignedIn } = useResolvedAuth();
  const domain = useQuery({
    queryKey: ["domain"],
    queryFn: () => getDomainSnapshot(),
    initialData: initial,
  });

  const snapshot = domain.data;
  const claiming = isSignedIn && snapshot && !snapshot.claimed;

  return (
    <div className="relative min-h-dvh">
      <SiteHeader />
      {claiming ? (
        <ClaimingSplash />
      ) : snapshot?.claimed && snapshot.founder ? (
        <ClaimedHome snapshot={snapshot} />
      ) : (
        <UnclaimedLanding isSignedIn={isSignedIn} />
      )}
    </div>
  );
}

function ClaimingSplash() {
  return (
    <main className="mx-auto flex max-w-lg flex-col items-center px-5 py-24 text-center">
      <SealMark size={64} />
      <p className="mt-8 font-display text-3xl tracking-tight">
        Pieczętowanie świata
      </p>
      <p className="mt-3 max-w-sm text-muted">
        Twoje konto jest pierwsze — zostajesz prorokiem DurnoBartosizjanizmu.
      </p>
    </main>
  );
}

function UnclaimedLanding({ isSignedIn }: { isSignedIn: boolean }) {
  return (
    <main className="relative mx-auto max-w-6xl px-5 pb-24 pt-8 md:px-10 md:pt-16">
      <div className="grid gap-16 md:grid-cols-[1.1fr_0.9fr] md:items-end">
        <div className="stagger-in">
          <Badge>Świat wolny · 01</Badge>
          <p className="mt-6 font-mono text-xs tracking-[0.22em] text-subtle">
            {WORLD_HOST}
          </p>
          <h1 className="mt-4 font-display text-[clamp(2.5rem,8vw,5.25rem)] leading-[0.95] tracking-[-0.04em]">
            DurnoBartosizjanizm czeka na proroka.
          </h1>
          <p className="mt-8 max-w-md text-lg leading-relaxed text-muted">
            Pierwsze konto pieczętuje ten świat. {CO_CREATOR.name} już stoi jako
            współtwórca — z tablicą, księgą i studiem kawałków.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            {isSignedIn ? (
              <Button asChild size="lg">
                <Link to="/studio">Otwórz kurię</Link>
              </Button>
            ) : (
              <Button asChild size="lg">
                <Link to="/login">Załóż pierwsze konto</Link>
              </Button>
            )}
            <Button asChild variant="outline" size="lg">
              <Link to="/tablica">Tablica</Link>
            </Button>
          </div>
        </div>

        <ol className="stagger-in divide-y divide-border rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
          {CANONS.map((step) => (
            <li key={step.n} className="flex gap-5 rounded-md px-3 py-5">
              <span className="font-mono text-xs tracking-[0.18em] text-subtle">
                {step.n}
              </span>
              <div>
                <p className="font-display text-xl tracking-tight">{step.t}</p>
                <p className="mt-1 text-sm text-muted">{step.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </main>
  );
}

function ClaimedHome({ snapshot }: { snapshot: DomainSnapshot }) {
  const founder = snapshot.founder!;
  const { user } = useResolvedAuth();
  const isFounderViewer = user?.id === founder.userId;

  return (
    <main className="mx-auto max-w-5xl px-5 pb-24 pt-6 md:px-10">
      <div className="stagger-in">
        <div className="flex flex-wrap items-center gap-3">
          <Badge>Świat · pieczęć 01</Badge>
          {founder.handle ? (
            <span className="font-mono text-xs tracking-wide text-subtle">
              @{founder.handle}
            </span>
          ) : null}
        </div>
        <p className="mt-6 font-mono text-xs tracking-[0.22em] text-subtle">
          {WORLD_HOST}
        </p>
        <h1 className="mt-3 font-display text-[clamp(2.4rem,7vw,4.75rem)] leading-[0.95] tracking-[-0.04em]">
          DurnoBartosizjanizm
        </h1>
        <p className="mt-5 font-display text-2xl tracking-tight text-muted">
          {founder.displayName}
          {founder.title ? ` · ${founder.title}` : " · Prorok"}
        </p>
        <p className="mt-2 text-sm text-muted">
          {CO_CREATOR.name} · {CO_CREATOR.title}
        </p>
        <p className="mt-1 text-sm text-muted">
          {HOST_NAME} · {HOST_TITLE}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-subtle">
          {founder.location ? (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-3.5" />
              {founder.location}
            </span>
          ) : null}
          <span>Od {formatPlDate(founder.claimedAt)}</span>
          <span className="tabular-nums">
            {snapshot.memberCount}{" "}
            {snapshot.memberCount === 1 ? "konto" : "kont"}
          </span>
        </div>
      </div>

      <div className="mt-14 grid gap-14 lg:grid-cols-[1.4fr_0.8fr]">
        <section>
          {founder.manifesto ? (
            <p className="max-w-prose font-display text-2xl leading-snug tracking-tight text-fg">
              {founder.manifesto}
            </p>
          ) : (
            <div className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
              <p className="text-muted">
                Kanon stoi. Manifest proroka pojawi się, gdy zapisze go w kurii.
              </p>
              {isFounderViewer ? (
                <Button asChild className="mt-4" size="sm">
                  <Link to="/studio">Otwórz kurię</Link>
                </Button>
              ) : null}
            </div>
          )}

          <ol className="mt-14 divide-y divide-border rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
            {CANONS.map((step) => (
              <li key={step.n} className="flex gap-5 px-3 py-5">
                <span className="font-mono text-xs tracking-[0.18em] text-subtle">
                  {step.n}
                </span>
                <div>
                  <p className="font-display text-xl tracking-tight">{step.t}</p>
                  <p className="mt-1 text-sm text-muted">{step.d}</p>
                </div>
              </li>
            ))}
          </ol>

          {snapshot.notes.length > 0 ? (
            <div className="mt-14">
              <h2 className="font-mono text-xs tracking-[0.18em] text-subtle">
                Kazania
              </h2>
              <ul className="mt-6 space-y-8">
                {snapshot.notes.map((note) => (
                  <li key={note.id} className="border-t border-border pt-6">
                    <p className="text-xs text-subtle">
                      {formatPlDate(note.createdAt)}
                    </p>
                    <h3 className="mt-2 font-display text-2xl tracking-tight">
                      {note.title}
                    </h3>
                    <p className="mt-3 max-w-prose whitespace-pre-wrap text-muted">
                      {note.body}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-16">
            <Guestbook entries={snapshot.guestbook} compact />
          </div>
        </section>

        <aside className="space-y-8">
          <div className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
            <p className="font-mono text-xs tracking-[0.18em] text-subtle">
              {CO_CREATOR.title}
            </p>
            <h2 className="mt-2 font-display text-2xl tracking-tight">
              {CO_CREATOR.name}
            </h2>
            <p className="mt-2 text-sm text-muted">{CO_CREATOR.blurb}</p>
            <ShareWorld />
          </div>
          <div className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
            <h2 className="font-display text-2xl tracking-tight">Budżet</h2>
            <p className="mt-2 text-sm text-muted">
              Wspólna kasa na kartę firmową. 5% z projektu — na cel chóru.
            </p>
            <Button asChild className="mt-4" size="sm">
              <Link to="/budzet">Otwórz budżet</Link>
            </Button>
          </div>
          <div className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
            <h2 className="font-display text-2xl tracking-tight">Składka</h2>
            <p className="mt-2 text-sm text-muted">
              Członkostwo: 10 Twoich pieniążków. Prorok nic nie płaci.
            </p>
            <Button asChild className="mt-4" size="sm">
              <Link to="/skladka">Złóż składkę</Link>
            </Button>
          </div>
          <div className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
            <h2 className="font-display text-2xl tracking-tight">Sława</h2>
            <p className="mt-2 text-sm text-muted">
              Galeria DurnoBartosizjan. Zasługi dla świata i dla zboru.
            </p>
            <Button asChild className="mt-4" size="sm">
              <Link to="/slawa">Otwórz galerię</Link>
            </Button>
          </div>
          <div className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
            <h2 className="font-display text-2xl tracking-tight">Tablica</h2>
            <p className="mt-2 text-sm text-muted">
              Wyjazdy i zaproszenia. Kto wiesza, ten woła.
            </p>
            <Button asChild className="mt-4" size="sm">
              <Link to="/tablica">Otwórz tablicę</Link>
            </Button>
          </div>
          <div className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
            <h2 className="font-display text-2xl tracking-tight">Kawałki</h2>
            <p className="mt-2 text-sm text-muted">
              Studio — riff, refren, wrzask. Do 45 sekund.
            </p>
            <Button asChild className="mt-4" size="sm">
              <Link to="/kawalki">Nagraj</Link>
            </Button>
          </div>
          <div className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
            <h2 className="font-display text-2xl tracking-tight">Zbór rzucił</h2>
            <p className="mt-2 text-sm text-muted">
              Kodeks, mapa nierazem, kronika, rozumie, skrzynka. 70% mit, 30% dom.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <Link to="/kodeks">Kodeks</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/mapa">Mapa</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/kronika">Kronika</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/rozumie">Rozumie</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/zbor">Zbór</Link>
              </Button>
            </div>
          </div>
          <div className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
            <p className="font-mono text-xs tracking-[0.18em] text-subtle">
              Boty
            </p>
            <h2 className="mt-2 font-display text-2xl tracking-tight">Sztab</h2>
            <p className="mt-2 text-sm text-muted">
              Szef, Wariatka, Bejb2, Nami, Łukasz. Ich rzuty stoją w świecie.
            </p>
            <Button asChild className="mt-4" size="sm">
              <Link to="/sztab">Otwórz sztab</Link>
            </Button>
          </div>
          <div className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
            <p className="font-mono text-xs tracking-[0.18em] text-subtle">
              Synod
            </p>
            <h2 className="mt-2 font-display text-2xl tracking-tight">
              Tablica ToT
            </h2>
            <p className="mt-2 text-sm text-muted">
              Iskry, tok, czekanie, gotowe.
            </p>
            <Button asChild className="mt-4" size="sm">
              <Link to="/tot">Otwórz synod</Link>
            </Button>
          </div>
          <div>
            <h2 className="font-mono text-xs tracking-[0.18em] text-subtle">
              Łącza
            </h2>
            {snapshot.links.length === 0 ? (
              <p className="mt-4 text-sm text-muted">Brak łączy.</p>
            ) : (
              <ul className="mt-4">
                {snapshot.links.map((link) => (
                  <li key={link.id} className="border-b border-border">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-12 items-center justify-between gap-3 text-sm hover:text-accent"
                    >
                      {link.label}
                      <ArrowUpRight className="size-4 text-subtle" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}

function ShareWorld() {
  async function share() {
    const payload = {
      title: "DurnoBartosizjanizm.world",
      text: "Świat DurnoBartosizjanizmu.",
      url:
        typeof window !== "undefined"
          ? window.location.origin
          : `https://${WORLD_HOST}`,
    };
    try {
      if (navigator.share) {
        await navigator.share(payload);
        return;
      }
    } catch {
      return;
    }
    try {
      await navigator.clipboard.writeText(payload.url);
      toast.success("Link skopiowany.");
    } catch {
      toast.error("Nie dało się podać dalej.");
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="mt-4"
      onClick={() => void share()}
    >
      Podaj dalej
    </Button>
  );
}
