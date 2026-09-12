import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Paywall } from "@/components/paywall";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  addGuest,
  draftLetter,
  drawSurprise,
  filePreemption,
  getGuests,
  getHostPower,
  getHostSeat,
  getPreemptions,
  getPublicLetters,
  getSurprise,
  resolvePreemption,
  sendLetter,
  setGuestStatus,
  type Guest,
  type Preemption,
} from "@/lib/choir";
import { getDuesStatus } from "@/lib/dues";
import { useResolvedAuth } from "@/lib/use-resolved-auth";
import { CHANNELS, HOST_LINE, HOST_NAME, HURTEM_LINE, PIERWOKUP_KINDS, TABLE_HOST_NAME, TABLE_LINE, TONES, type PierwokupKind } from "@/lib/world";

export const Route = createFileRoute("/zbor")({
  loader: async () => {
    const [guests, letters, surprise, host, claims] = await Promise.all([
      getGuests(),
      getPublicLetters(),
      getSurprise(),
      getHostSeat(),
      getPreemptions(),
    ]);
    return { guests, letters, surprise, host, claims };
  },
  component: ZborPage,
});

function statusLabel(status: Preemption["status"]) {
  if (status === "wzial") return `${HOST_NAME} wziął pierwokup`;
  if (status === "oddane") return "oddane dalej";
  return `czeka na ${HOST_NAME}`;
}

function kindLabel(kind: PierwokupKind) {
  return PIERWOKUP_KINDS.find((k) => k.id === kind)?.label ?? kind;
}

function ZborPage() {
  const initial = Route.useLoaderData();
  const { user, isSignedIn } = useResolvedAuth();
  const guests = useQuery({
    queryKey: ["guests"],
    queryFn: () => getGuests(),
    initialData: initial.guests,
  });
  const letters = useQuery({
    queryKey: ["letters-public"],
    queryFn: () => getPublicLetters(),
    initialData: initial.letters,
  });
  const surprise = useQuery({
    queryKey: ["surprise"],
    queryFn: () => getSurprise(),
    initialData: initial.surprise,
  });
  const host = useQuery({
    queryKey: ["host-seat"],
    queryFn: () => getHostSeat(),
    initialData: initial.host,
  });
  const claims = useQuery({
    queryKey: ["preemptions"],
    queryFn: () => getPreemptions(),
    initialData: initial.claims,
  });
  const dues = useQuery({
    queryKey: ["dues"],
    queryFn: () => getDuesStatus(),
    enabled: isSignedIn,
  });
  const power = useQuery({
    queryKey: ["host-power"],
    queryFn: () => getHostPower(),
    enabled: isSignedIn,
  });
  const canPost = Boolean(dues.data?.paid);
  const isHost = Boolean(power.data?.isHost);
  const hostName = host.data?.name ?? HOST_NAME;

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 pb-20 md:px-10">
        <p className="font-mono text-xs tracking-[0.18em] text-subtle">Kontakt</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight md:text-5xl">
          Zbór
        </h1>
        <p className="mt-3 max-w-xl text-muted">
          Skrzynka, lista gości, pierwokup, karta prawa niespodzianki. Ton pod odbiorcę, nie szablon.
        </p>

        <article className="mt-10 flex gap-4 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
          <div className="grid size-12 shrink-0 place-items-center rounded-full border border-border font-display text-xl">
            M
          </div>
          <div>
            <p className="font-mono text-xs tracking-[0.18em] text-subtle">
              Zabezpieczenie od Monitora
            </p>
            <h2 className="mt-1 font-display text-2xl tracking-tight">
              Hostem zostaje {hostName}
            </h2>
            <p className="mt-2 text-sm text-muted">{HOST_LINE}</p>
            <p className="mt-2 text-xs text-subtle">{HURTEM_LINE}</p>
          </div>
        </article>

        <article className="mt-3 flex gap-4 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
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
            <Button asChild size="sm" variant="ghost" className="mt-3">
              <Link to="/ksiega">Księga pod pieczęcią</Link>
            </Button>
          </div>
        </article>

        <h2 className="mt-12 font-display text-2xl tracking-tight">Jak się odezwać</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {TONES.map((tone) => (
            <li
              key={tone.who}
              className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]"
            >
              <p className="font-display text-lg tracking-tight">{tone.who}</p>
              <p className="mt-2 text-sm text-muted">{tone.how}</p>
            </li>
          ))}
        </ul>

        <h2 className="mt-12 font-display text-2xl tracking-tight">Napisz do zboru</h2>
        <p className="mt-1 text-sm text-muted">Draft najpierw. Wysyłka po OK.</p>
        {isSignedIn ? (
          canPost ? (
            <LetterBox />
          ) : (
            <Paywall action="pisać do zboru" />
          )
        ) : (
          <p className="mt-3 text-sm text-muted">
            <Link to="/login" className="underline underline-offset-4">
              Wejdź
            </Link>
            .
          </p>
        )}
        <ul className="mt-6 space-y-4">
          {(letters.data?.letters ?? []).map((letter) => (
            <li key={letter.id} className="border-t border-border pt-4">
              <p className="text-xs text-subtle">{letter.authorName}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-fg">{letter.body}</p>
            </li>
          ))}
        </ul>

        <h2 className="mt-12 font-display text-2xl tracking-tight">Lista gości</h2>
        <p className="mt-1 text-sm text-muted">
          Nick → kanał → status. Bez maili znikąd. Wpuszcza tylko {hostName}. Przy progu stoi jedna osoba.
        </p>
        {canPost ? <GuestForm /> : null}
        <ul className="mt-4 divide-y divide-border rounded-xl bg-surface shadow-[var(--shadow-border)]">
          {(guests.data?.guests ?? []).length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-subtle">Nikogo.</li>
          ) : (
            (guests.data?.guests ?? []).map((guest) => (
              <GuestRow key={guest.id} guest={guest} isHost={isHost} />
            ))
          )}
        </ul>

        <h2 className="mt-12 font-display text-2xl tracking-tight">Opcja pierwokupu</h2>
        <p className="mt-1 text-sm text-muted">
          Zanim kawałek, projekt albo miejsce wyjdzie na zewnątrz, {hostName} ma prawo pierwszego wyboru.
        </p>
        {canPost ? <ClaimForm /> : isSignedIn ? <Paywall action="składać do pierwokupu" /> : null}
        <ul className="mt-4 divide-y divide-border rounded-xl bg-surface shadow-[var(--shadow-border)]">
          {(claims.data?.claims ?? []).length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-subtle">
              Nic nie leży pod pieczęcią.
            </li>
          ) : (
            (claims.data?.claims ?? []).map((claim) => (
              <li key={claim.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <p className="text-sm">
                  <span className="text-fg">{claim.title}</span>
                  <span className="text-subtle">
                    {" "}
                    · {kindLabel(claim.kind)} · {claim.authorName} · {statusLabel(claim.status)}
                  </span>
                </p>
                {isHost && claim.status === "czeka" ? (
                  <ClaimActions id={claim.id} />
                ) : null}
              </li>
            ))
          )}
        </ul>

        <h2 className="mt-12 font-display text-2xl tracking-tight">
          Prawo niespodzianki
        </h2>
        <p className="mt-1 text-sm text-muted">
          Jedna karta. Nigdy nierazem. Kto ciągnie, ten trzyma — reszta czeka.
        </p>
        <div className="mt-4 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
          {surprise.data?.current ? (
            <p className="font-display text-xl tracking-tight">
              {surprise.data.current.authorName}: {surprise.data.current.card}
            </p>
          ) : (
            <p className="text-sm text-muted">Karta leży. Nikt nie trzyma.</p>
          )}
          {canPost ? (
            <DrawButton heldByOther={
              Boolean(
                surprise.data?.current &&
                  surprise.data.current.authorName &&
                  surprise.data.current.authorName !== (user?.displayName ?? ""),
              )
            } />
          ) : isSignedIn ? (
            <Paywall action="ciągnąć kartę" />
          ) : null}
        </div>
      </main>
    </div>
  );
}

function LetterBox() {
  const [body, setBody] = useState("");
  const [draftId, setDraftId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const draft = useMutation({
    mutationFn: () => draftLetter({ data: { body } }),
    onSuccess: (res) => {
      setDraftId(res.id);
      toast.success("Draft. Teraz OK.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
  const send = useMutation({
    mutationFn: () => sendLetter({ data: { id: draftId! } }),
    onSuccess: () => {
      setBody("");
      setDraftId(null);
      toast.success("Poszło do zboru.");
      void queryClient.invalidateQueries({ queryKey: ["letters-public"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <form
      className="mt-4 space-y-3"
      onSubmit={(event: FormEvent) => {
        event.preventDefault();
        if (draftId) send.mutate();
        else draft.mutate();
      }}
    >
      <Textarea
        value={body}
        onChange={(e) => {
          setBody(e.target.value);
          setDraftId(null);
        }}
        placeholder="Draft do zboru."
        rows={4}
        required
      />
      <Button type="submit" disabled={draft.isPending || send.isPending}>
        {draftId ? "OK, wyślij" : "Zapisz draft"}
      </Button>
    </form>
  );
}

function GuestForm() {
  const [nick, setNick] = useState("");
  const [channel, setChannel] = useState<(typeof CHANNELS)[number]>("irl");

  const queryClient = useQueryClient();
  const add = useMutation({
    mutationFn: () => addGuest({ data: { nick, channel } }),
    onSuccess: () => {
      setNick("");
      toast.success(
        channel === "meet"
          ? "Meet sam nie otwiera. Czeka na Monitora."
          : "Na liście. Czeka na Monitora.",
      );
      void queryClient.invalidateQueries({ queryKey: ["guests"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <form
      className="mt-4 flex flex-wrap gap-2"
      onSubmit={(event: FormEvent) => {
        event.preventDefault();
        add.mutate();
      }}
    >
      <Input
        value={nick}
        onChange={(e) => setNick(e.target.value)}
        placeholder="Nick, nie mail"
        className="min-w-0 flex-1"
      />
      <select
        value={channel}
        onChange={(e) => setChannel(e.target.value as (typeof CHANNELS)[number])}
        className="h-10 min-h-11 rounded-md border border-border bg-surface px-3 text-sm text-fg"
      >
        {CHANNELS.map((ch) => (
          <option key={ch} value={ch}>
            {ch}
          </option>
        ))}
      </select>
      <Button type="submit" disabled={add.isPending}>
        Puknij
      </Button>
    </form>
  );
}

function GuestRow({ guest, isHost }: { guest: Guest; isHost: boolean }) {
  const queryClient = useQueryClient();
  const set = useMutation({
    mutationFn: (status: Guest["status"]) =>
      setGuestStatus({ data: { id: guest.id, status } }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["guests"] }),
    onError: (err: Error) => toast.error(err.message),
  });
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
      <p className="text-sm">
        <span className="text-fg">{guest.nick}</span>
        <span className="text-subtle"> · {guest.channel} · {guest.status}</span>
      </p>
      {isHost && guest.status === "czeka" ? (
        <div className="flex gap-1">
          <Button type="button" size="sm" variant="ghost" onClick={() => set.mutate("wpuszczony")}>
            {HOST_NAME} wpuszcza
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => set.mutate("odmowa")}>
            Próg zamknięty
          </Button>
        </div>
      ) : null}
    </li>
  );
}

function ClaimForm() {
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<PierwokupKind>("projekt");
  const queryClient = useQueryClient();
  const add = useMutation({
    mutationFn: () => filePreemption({ data: { title, kind } }),
    onSuccess: () => {
      setTitle("");
      toast.success(`Leży pod pieczęcią. Czeka na ${HOST_NAME}.`);
      void queryClient.invalidateQueries({ queryKey: ["preemptions"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
  return (
    <form
      className="mt-4 flex flex-wrap gap-2"
      onSubmit={(event: FormEvent) => {
        event.preventDefault();
        add.mutate();
      }}
    >
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Co wystawiasz"
        className="min-w-0 flex-1"
        required
      />
      <select
        value={kind}
        onChange={(e) => setKind(e.target.value as PierwokupKind)}
        className="h-10 min-h-11 rounded-md border border-border bg-surface px-3 text-sm text-fg"
      >
        {PIERWOKUP_KINDS.map((k) => (
          <option key={k.id} value={k.id}>
            {k.label}
          </option>
        ))}
      </select>
      <Button type="submit" disabled={add.isPending}>
        Złóż do pierwokupu
      </Button>
    </form>
  );
}

function ClaimActions({ id }: { id: number }) {
  const queryClient = useQueryClient();
  const act = useMutation({
    mutationFn: (decision: "wzial" | "oddane") =>
      resolvePreemption({ data: { id, decision } }),
    onSuccess: (res) => {
      toast.success(res.decision === "wzial" ? `${HOST_NAME} wziął.` : "Oddane dalej.");
      void queryClient.invalidateQueries({ queryKey: ["preemptions"] });
      void queryClient.invalidateQueries({ queryKey: ["songs"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
  return (
    <div className="flex flex-wrap gap-1">
      <Button type="button" size="sm" onClick={() => act.mutate("wzial")} disabled={act.isPending}>
        {HOST_NAME} korzysta
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => act.mutate("oddane")} disabled={act.isPending}>
        Oddaje dalej
      </Button>
    </div>
  );
}

function DrawButton({ heldByOther }: { heldByOther: boolean }) {
  const queryClient = useQueryClient();
  const draw = useMutation({
    mutationFn: () => drawSurprise(),
    onSuccess: (res) => {
      toast.success(res.card);
      void queryClient.invalidateQueries({ queryKey: ["surprise"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
  return (
    <Button
      type="button"
      className="mt-4"
      size="sm"
      onClick={() => draw.mutate()}
      disabled={draw.isPending}
    >
      {heldByOther ? "Czekaj — nierazem" : "Ciągnij kartę"}
    </Button>
  );
}
