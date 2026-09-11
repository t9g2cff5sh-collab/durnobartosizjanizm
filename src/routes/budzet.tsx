import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Paywall } from "@/components/paywall";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  TITHE_PERCENT,
  addProject,
  completeProject,
  formatIban,
  getBudget,
  getMyVote,
  proposeCause,
  voteCause,
  type Cause,
  type Project,
} from "@/lib/budget";
import { getDomainSnapshot } from "@/lib/domain";
import { formatPieniazki, getDuesStatus } from "@/lib/dues";
import { useResolvedAuth } from "@/lib/use-resolved-auth";
import { formatPlDate } from "@/lib/utils";
import { CO_CREATOR } from "@/lib/world";

export const Route = createFileRoute("/budzet")({
  loader: () => getBudget(),
  component: BudzetPage,
});

function BudzetPage() {
  const initial = Route.useLoaderData();
  const { user, isSignedIn } = useResolvedAuth();
  const budget = useQuery({
    queryKey: ["budget"],
    queryFn: () => getBudget(),
    initialData: initial,
  });
  const dues = useQuery({
    queryKey: ["dues"],
    queryFn: () => getDuesStatus(),
    enabled: isSignedIn,
  });
  const vote = useQuery({
    queryKey: ["cause-vote"],
    queryFn: () => getMyVote(),
    enabled: isSignedIn && Boolean(dues.data?.paid),
  });
  const domain = useQuery({
    queryKey: ["domain"],
    queryFn: () => getDomainSnapshot(),
  });
  const snap = budget.data;
  const isFounder = Boolean(user) && domain.data?.founder?.userId === user?.id;
  const canAct = Boolean(dues.data?.paid);

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-5 pb-20 md:px-10">
        <p className="font-mono text-xs tracking-[0.18em] text-subtle">
          {CO_CREATOR.name} · wspólna kasa
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight md:text-5xl">
          Budżet świata
        </h1>
        <p className="mt-3 max-w-xl text-muted">
          Wspólny budżet schodzi na kartę konta firmowego. Z każdego dobrze
          zrealizowanego projektu {TITHE_PERCENT}% idzie na cel, który wybieracie
          razem.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
            <p className="font-mono text-xs tracking-[0.18em] text-subtle">
              {snap?.firmLabel ?? "Konto firmowe"}
            </p>
            <p className="mt-2 font-display text-4xl tracking-tight">
              {formatPieniazki(snap?.firmBalance ?? 0)}
            </p>
            <p className="mt-2 text-sm text-muted">
              {snap?.firmHolder ? `${snap.firmHolder}. ` : ""}
              {snap?.firmLast4 ? `Karta •••• ${snap.firmLast4}. ` : "Bez pełnego numeru karty. "}
              {snap?.firmIban
                ? `IBAN ${formatIban(snap.firmIban)}.`
                : "IBAN ustawia prorok w kurii."}
            </p>
          </div>
          <div className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
            <p className="font-mono text-xs tracking-[0.18em] text-subtle">
              {TITHE_PERCENT}% na cel
            </p>
            <p className="mt-2 font-display text-4xl tracking-tight">
              {formatPieniazki(snap?.causePot ?? 0)}
            </p>
            <p className="mt-2 text-sm text-muted">
              {snap?.winningCause
                ? `Teraz: ${snap.winningCause.title}`
                : "Chór jeszcze nie wybrał celu."}{" "}
              Licznik 5% na przygodę to lore wygranych. Zero prawdziwych przelewów na stronie.
            </p>
          </div>
        </div>

        <div className="mt-14 grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <section>
            <h2 className="font-display text-2xl tracking-tight">Projekty</h2>
            <p className="mt-1 text-sm text-muted">
              W toku, potem prorok zalicza jako dobrze zrealizowane.
            </p>
            {isSignedIn ? (
              canAct ? (
                <ProjectComposer />
              ) : (
                <Paywall action="wpisać projekt" />
              )
            ) : (
              <p className="mt-4 text-sm text-muted">
                <Link to="/login" className="underline underline-offset-4">
                  Wejdź
                </Link>
                , żeby dodać projekt.
              </p>
            )}
            <ul className="mt-6 space-y-3">
              {(snap?.projects ?? []).length === 0 ? (
                <li className="rounded-xl bg-surface px-4 py-8 text-sm text-subtle shadow-[var(--shadow-border)]">
                  Jeszcze żaden projekt.
                </li>
              ) : (
                (snap?.projects ?? []).map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    canComplete={isFounder && project.status === "tok"}
                  />
                ))
              )}
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl tracking-tight">Wspólny cel</h2>
            <p className="mt-1 text-sm text-muted">
              Zgłoś i zagłosuj. Kto ma najwięcej głosów, dostaje {TITHE_PERCENT}
              %.
            </p>
            {isSignedIn ? (
              canAct ? (
                <CauseComposer />
              ) : (
                <Paywall action="wybierać cel" />
              )
            ) : (
              <p className="mt-4 text-sm text-muted">
                <Link to="/login" className="underline underline-offset-4">
                  Wejdź
                </Link>
                , żeby głosować.
              </p>
            )}
            <ul className="mt-6 space-y-3">
              {(snap?.causes ?? []).length === 0 ? (
                <li className="rounded-xl bg-surface px-4 py-8 text-sm text-subtle shadow-[var(--shadow-border)]">
                  Brak celów.
                </li>
              ) : (
                (snap?.causes ?? []).map((cause) => (
                  <CauseCard
                    key={cause.id}
                    cause={cause}
                    canVote={canAct}
                    selected={vote.data?.causeId === cause.id}
                    winning={snap?.winningCause?.id === cause.id}
                  />
                ))
              )}
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}

function ProjectComposer() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [earned, setEarned] = useState("");
  const [body, setBody] = useState("");
  const add = useMutation({
    mutationFn: () =>
      addProject({
        data: { title, body, earned: Number(earned) },
      }),
    onSuccess: () => {
      setTitle("");
      setEarned("");
      setBody("");
      toast.success("Projekt w toku.");
      void queryClient.invalidateQueries({ queryKey: ["budget"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <form
      className="mt-5 space-y-3 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]"
      onSubmit={(e) => {
        e.preventDefault();
        add.mutate();
      }}
    >
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Nazwa projektu"
        required
      />
      <Input
        type="number"
        min={1}
        step={1}
        value={earned}
        onChange={(e) => setEarned(e.target.value)}
        placeholder="Zarobione pieniążki"
        required
      />
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Co to było."
        className="min-h-20"
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={add.isPending || !title.trim()}>
          Dodaj
        </Button>
      </div>
    </form>
  );
}

function ProjectCard({
  project,
  canComplete,
}: {
  project: Project;
  canComplete: boolean;
}) {
  const queryClient = useQueryClient();
  const done = useMutation({
    mutationFn: () => completeProject({ data: { id: project.id } }),
    onSuccess: (res) => {
      toast.success(res.message);
      void queryClient.invalidateQueries({ queryKey: ["budget"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <li className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs tracking-[0.18em] text-subtle">
            {project.status === "gotowe" ? "Zaliczone" : "W toku"}
          </p>
          <h3 className="mt-1 font-display text-xl tracking-tight">
            {project.title}
          </h3>
          <p className="mt-1 text-xs text-subtle">
            {project.authorName}
            {project.createdAt ? ` · ${formatPlDate(project.createdAt)}` : ""}
          </p>
        </div>
        <p className="font-display text-xl tracking-tight">
          {formatPieniazki(project.earned)}
        </p>
      </div>
      {project.body ? (
        <p className="mt-2 text-sm text-muted">{project.body}</p>
      ) : null}
      {project.status === "gotowe" ? (
        <p className="mt-3 text-sm text-muted">
          {formatPieniazki(project.net)} na kartę firmową.{" "}
          {formatPieniazki(project.tithe)} ({TITHE_PERCENT}%) na:{" "}
          {project.causeTitle}.
        </p>
      ) : canComplete ? (
        <Button
          className="mt-3"
          size="sm"
          disabled={done.isPending}
          onClick={() => done.mutate()}
        >
          Dobrze zrealizowane
        </Button>
      ) : null}
    </li>
  );
}

function CauseComposer() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const add = useMutation({
    mutationFn: () => proposeCause({ data: { title, body } }),
    onSuccess: () => {
      setTitle("");
      setBody("");
      toast.success("Cel zgłoszony. Twój głos już na nim.");
      void queryClient.invalidateQueries({ queryKey: ["budget"] });
      void queryClient.invalidateQueries({ queryKey: ["cause-vote"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <form
      className="mt-5 space-y-3 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]"
      onSubmit={(e) => {
        e.preventDefault();
        add.mutate();
      }}
    >
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Na co idzie 5%"
        required
      />
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Dlaczego ten cel."
        className="min-h-20"
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={add.isPending || !title.trim()}>
          Zgłoś cel
        </Button>
      </div>
    </form>
  );
}

function CauseCard({
  cause,
  canVote,
  selected,
  winning,
}: {
  cause: Cause;
  canVote: boolean;
  selected: boolean;
  winning: boolean;
}) {
  const queryClient = useQueryClient();
  const vote = useMutation({
    mutationFn: () => voteCause({ data: { id: cause.id } }),
    onSuccess: () => {
      toast.success("Głos oddany.");
      void queryClient.invalidateQueries({ queryKey: ["budget"] });
      void queryClient.invalidateQueries({ queryKey: ["cause-vote"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <li className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          {winning ? (
            <p className="font-mono text-xs tracking-[0.18em] text-subtle">
              Wybrany
            </p>
          ) : null}
          <h3 className="font-display text-xl tracking-tight">{cause.title}</h3>
          <p className="mt-1 text-xs text-subtle">{cause.authorName}</p>
        </div>
        <p className="font-mono text-sm tabular-nums text-muted">
          {cause.votes}
        </p>
      </div>
      {cause.body ? (
        <p className="mt-2 text-sm text-muted">{cause.body}</p>
      ) : null}
      {canVote ? (
        <Button
          className="mt-3"
          size="sm"
          variant={selected ? "outline" : "primary"}
          disabled={vote.isPending || selected}
          onClick={() => vote.mutate()}
        >
          {selected ? "Twój głos" : "Głosuję"}
        </Button>
      ) : null}
    </li>
  );
}
