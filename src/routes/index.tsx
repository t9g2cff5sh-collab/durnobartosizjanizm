import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, MapPin } from "lucide-react";
import { toast } from "sonner";
import { Guestbook } from "@/components/guestbook";
import { HouseBoard } from "@/components/house-board";
import { SiteHeader } from "@/components/site-header";
import { SealMark } from "@/components/seal-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useResolvedAuth } from "@/lib/use-resolved-auth";
import { getBudget, type BudgetSnapshot } from "@/lib/budget";
import { getDomainSnapshot, getHouseWord, type DomainSnapshot, type HouseWord } from "@/lib/domain";
import { getNotices, type Notice } from "@/lib/life";
import { getLoyaltyBoard, type LoyalMark } from "@/lib/loyalty";
import { formatPlDate } from "@/lib/utils";
import {
  BOARD_LINE,
  CO_CREATOR,
  HOST_NAME,
  HOST_TITLE,
  WORLD_HOST,
} from "@/lib/world";



export const Route = createFileRoute("/")({
  loader: async () => {
    const [domain, notices, budget, loyalty, word] = await Promise.all([
      getDomainSnapshot(),
      getNotices(),
      getBudget(),
      getLoyaltyBoard(),
      getHouseWord(),
    ]);
    return { domain, notices, budget, loyalty, word };
  },
  component: Home,
});

function Home() {
  const initial = Route.useLoaderData();
  const { isSignedIn } = useResolvedAuth();
  const domain = useQuery({
    queryKey: ["domain"],
    queryFn: () => getDomainSnapshot(),
    initialData: initial.domain,
  });
  const notices = useQuery({
    queryKey: ["notices"],
    queryFn: () => getNotices(),
    initialData: initial.notices,
  });
  const budget = useQuery({
    queryKey: ["budget"],
    queryFn: () => getBudget(),
    initialData: initial.budget,
  });
  const loyalty = useQuery({
    queryKey: ["loyalty"],
    queryFn: () => getLoyaltyBoard(),
    initialData: initial.loyalty,
  });
  const word = useQuery({
    queryKey: ["house-word"],
    queryFn: () => getHouseWord(),
    initialData: initial.word,
  });

  const snapshot = domain.data;
  const claiming = isSignedIn && snapshot && !snapshot.claimed;

  return (
    <div className="relative min-h-dvh">
      <SiteHeader />
      {claiming ? (
        <ClaimingSplash />
      ) : snapshot?.claimed && snapshot.founder ? (
        <ClaimedHome
          snapshot={snapshot}
          notices={notices.data?.notices ?? []}
          budget={budget.data}
          loyal={loyalty.data?.loyal ?? []}
          word={word.data}
        />
      ) : (
        <UnclaimedLanding
          isSignedIn={isSignedIn}
          notices={notices.data?.notices ?? []}
          budget={budget.data}
          loyal={loyalty.data?.loyal ?? []}
          word={word.data}
        />
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

function UnclaimedLanding({
  isSignedIn,
  notices,
  budget,
  loyal,
  word,
}: {
  isSignedIn: boolean;
  notices: Notice[];
  budget: BudgetSnapshot | undefined;
  loyal: LoyalMark[];
  word?: HouseWord | null;
}) {
  return (
    <main className="relative mx-auto max-w-6xl px-5 pb-24 pt-6 md:px-10 md:pt-10">
      <div className="stagger-in">
        <Badge>Świat wolny · 01</Badge>
        <p className="mt-5 font-mono text-xs tracking-[0.22em] text-subtle">
          {WORLD_HOST}
        </p>
        <h1 className="mt-3 font-display text-[clamp(2.2rem,6.5vw,4.25rem)] leading-[0.95] tracking-[-0.04em]">
          DurnoBartosizjanizm czeka na proroka.
        </h1>
        <p className="mt-5 max-w-md text-lg leading-relaxed text-muted">
          Pierwsze konto pieczętuje ten świat. Potem jedna tablica
          informacyjna: ogłoszenia, pieniążki i wyróżnienia lojalnych.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
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

      <HouseBoard notices={notices} budget={budget} loyal={loyal} word={word} />
    </main>
  );
}

function ClaimedHome({
  snapshot,
  notices,
  budget,
  loyal,
  word,
}: {
  snapshot: DomainSnapshot;
  notices: Notice[];
  budget: BudgetSnapshot | undefined;
  loyal: LoyalMark[];
  word?: HouseWord | null;
}) {
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
          Tablica domu
        </h1>
        <p className="mt-5 font-display text-2xl tracking-tight text-muted">
          {founder.displayName}
          {founder.title ? ` · ${founder.title}` : " · Prorok"}
        </p>
        <p className="mt-2 text-sm text-muted">
          {CO_CREATOR.name} · {CO_CREATOR.title} · {HOST_NAME} · {HOST_TITLE}
        </p>
        <p className="mt-3 max-w-xl text-sm text-muted">{BOARD_LINE}</p>
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

      <HouseBoard notices={notices} budget={budget} loyal={loyal} word={word} />

      <div className="mt-16 grid gap-14 lg:grid-cols-[1.4fr_0.8fr]">
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

          {snapshot.notes.length > 0 ? (
            <div className="mt-14">
              <h2 className="font-mono text-xs tracking-[0.18em] text-subtle">
                Zapiski
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
            {word?.line ? (
              <p className="mt-4 font-display text-xl tracking-tight">{word.line}</p>
            ) : null}
            <ShareWorld />
          </div>
          <div className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
            <h2 className="font-display text-2xl tracking-tight">Łącza</h2>
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
