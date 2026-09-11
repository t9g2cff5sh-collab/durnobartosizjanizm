import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Paywall } from "@/components/paywall";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addDayItem,
  getDayLog,
  moveDayItem,
  type DayItem,
} from "@/lib/choir";
import { getDuesStatus } from "@/lib/dues";
import { useResolvedAuth } from "@/lib/use-resolved-auth";
import { KRONIKA_SEED } from "@/lib/world";

export const Route = createFileRoute("/kronika")({
  loader: () => getDayLog(),
  component: KronikaPage,
});

const COLS: { id: DayItem["status"]; label: string }[] = [
  { id: "plan", label: "Plan" },
  { id: "zrobione", label: "Zrobione" },
  { id: "otwarte", label: "Otwarte" },
];

function KronikaPage() {
  const initial = Route.useLoaderData();
  const { isSignedIn } = useResolvedAuth();
  const log = useQuery({
    queryKey: ["day-log"],
    queryFn: () => getDayLog(),
    initialData: initial,
  });
  const dues = useQuery({
    queryKey: ["dues"],
    queryFn: () => getDuesStatus(),
    enabled: isSignedIn,
  });
  const canPost = Boolean(dues.data?.paid);
  const items = log.data?.items ?? [];

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-5 pb-20 md:px-10">
        <p className="font-mono text-xs tracking-[0.18em] text-subtle">
          Piątki
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight md:text-5xl">
          Kronika
        </h1>
        <p className="mt-3 max-w-xl text-muted">
          Meet-y, które nie wpuszczają. Adres. Dziennik dnia bez kazania.
        </p>

        <ul className="mt-8 space-y-3">
          {KRONIKA_SEED.map((item) => (
            <li
              key={item.t}
              className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]"
            >
              <p className="font-display text-xl tracking-tight">{item.t}</p>
              <p className="mt-2 text-sm text-muted">{item.d}</p>
            </li>
          ))}
        </ul>

        <h2 className="mt-12 font-display text-2xl tracking-tight">
          Dziennik dnia
        </h2>
        <p className="mt-1 text-sm text-muted">Plan → zrobione → otwarte. Bez kazania.</p>

        {isSignedIn ? (
          canPost ? (
            <DayComposer />
          ) : (
            <Paywall action="pisać dziennik" />
          )
        ) : (
          <p className="mt-4 text-sm text-muted">
            <Link to="/login" className="underline underline-offset-4">
              Wejdź
            </Link>
            , żeby dopisać dzień.
          </p>
        )}

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {COLS.map((col) => (
            <section key={col.id}>
              <p className="font-mono text-xs tracking-[0.18em] text-subtle">
                {col.label}
              </p>
              <ul className="mt-3 space-y-2">
                {items.filter((item) => item.status === col.id).length === 0 ? (
                  <li className="rounded-xl bg-surface px-4 py-8 text-center text-sm text-subtle shadow-[var(--shadow-border)]">
                    Pusto.
                  </li>
                ) : (
                  items
                    .filter((item) => item.status === col.id)
                    .map((item) => (
                      <DayCard key={item.id} item={item} canMove={canPost} />
                    ))
                )}
              </ul>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}

function DayComposer() {
  const [body, setBody] = useState("");
  const queryClient = useQueryClient();
  const add = useMutation({
    mutationFn: () => addDayItem({ data: { body } }),
    onSuccess: () => {
      setBody("");
      toast.success("W planie.");
      void queryClient.invalidateQueries({ queryKey: ["day-log"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    add.mutate();
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 flex flex-wrap gap-2">
      <Input
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Co dziś. Bez kazania."
        className="min-w-0 flex-1"
      />
      <Button type="submit" disabled={add.isPending}>
        Do planu
      </Button>
    </form>
  );
}

function DayCard({ item, canMove }: { item: DayItem; canMove: boolean }) {
  const queryClient = useQueryClient();
  const move = useMutation({
    mutationFn: (status: DayItem["status"]) =>
      moveDayItem({ data: { id: item.id, status } }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["day-log"] }),
    onError: (err: Error) => toast.error(err.message),
  });
  const next =
    item.status === "plan"
      ? "zrobione"
      : item.status === "zrobione"
        ? "otwarte"
        : "plan";

  return (
    <li className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
      <p className="text-sm text-fg">{item.body}</p>
      <p className="mt-1 text-xs text-subtle">{item.authorName}</p>
      {canMove ? (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="mt-2"
          onClick={() => move.mutate(next)}
        >
          → {next}
        </Button>
      ) : null}
    </li>
  );
}
