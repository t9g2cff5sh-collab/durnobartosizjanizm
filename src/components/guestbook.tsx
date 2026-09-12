import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PenLine } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  getGuestbookInbox,
  sealGuestbook,
  signGuestbook,
  type GuestItem,
} from "@/lib/domain";
import { getDuesStatus } from "@/lib/dues";
import { Paywall } from "@/components/paywall";
import { useResolvedAuth } from "@/lib/use-resolved-auth";
import { formatPlDate } from "@/lib/utils";
import { TABLE_HOST_NAME, TABLE_LINE } from "@/lib/world";

export function Guestbook({
  entries,
  compact = false,
  hideIntro = false,
}: {
  entries: GuestItem[];
  compact?: boolean;
  hideIntro?: boolean;
}) {
  const { user, isSignedIn } = useResolvedAuth();
  const queryClient = useQueryClient();
  const dues = useQuery({
    queryKey: ["dues"],
    queryFn: () => getDuesStatus(),
    enabled: isSignedIn,
  });
  const inbox = useQuery({
    queryKey: ["guestbook-inbox"],
    queryFn: () => getGuestbookInbox(),
    enabled: isSignedIn,
  });
  const canPost = Boolean(dues.data?.paid);
  const isTableHost = Boolean(inbox.data?.isTableHost);
  const waiting = inbox.data?.waiting ?? [];
  const [body, setBody] = useState("");

  const sign = useMutation({
    mutationFn: () =>
      signGuestbook({
        data: {
          body,
          displayName: user?.displayName ?? undefined,
        },
      }),
    onSuccess: (res) => {
      setBody("");
      toast.success(
        res.status === "pieczec"
          ? "Pieczęć stołu. Podpis w księdze."
          : "Podpis czeka na Panią Bozię.",
      );
      void queryClient.invalidateQueries({ queryKey: ["domain"] });
      void queryClient.invalidateQueries({ queryKey: ["guestbook-inbox"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const shown = compact ? entries.slice(0, 4) : entries;

  return (
    <section>
      {hideIntro ? null : (
        <>
          <p className="font-mono text-xs tracking-[0.18em] text-subtle">Księga</p>
          <h2 className="mt-2 font-display text-3xl tracking-tight">
            Złóż podpis
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Imię z konta jest Twoim podpisem. {TABLE_LINE}
          </p>
        </>
      )}

      {isSignedIn ? (
        canPost ? (
          <form
            className="mt-5 rounded-xl bg-surface p-3 shadow-[var(--shadow-border)]"
            onSubmit={(e) => {
              e.preventDefault();
              sign.mutate();
            }}
          >
            <p className="px-1 font-display text-xl italic tracking-tight">
              {user?.displayName || "Wyznawca"}
            </p>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={280}
              placeholder="Opcjonalnie: jedno zdanie pod podpisem."
              className="mt-2 min-h-24 bg-transparent shadow-none"
            />
            <div className="mt-2 flex items-center justify-between gap-3 px-1">
              <span className="font-mono text-xs tabular-nums text-subtle">
                {body.length}/280
              </span>
              <Button type="submit" size="sm" disabled={sign.isPending}>
                <PenLine className="size-3.5" />
                {isTableHost ? "Pieczętuj podpis" : "Złóż do pieczęci"}
              </Button>
            </div>
          </form>
        ) : (
          <Paywall action="złożyć podpis" />
        )
      ) : (
        <p className="mt-4 text-sm text-muted">
          <Link to="/login" className="underline underline-offset-4">
            Wejdź
          </Link>
          , żeby złożyć podpis. Członkostwo: 10 Twoich pieniążków.
        </p>
      )}

      {waiting.length > 0 ? (
        <ul className="mt-6 space-y-4">
          {waiting.map((entry) => (
            <li
              key={entry.id}
              className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]"
            >
              <p className="font-mono text-xs tracking-[0.18em] text-subtle">
                Czeka na {TABLE_HOST_NAME}
              </p>
              <p className="mt-1 font-display text-2xl italic tracking-tight">
                {entry.displayName}
              </p>
              <p className="mt-1 text-sm text-fg">{entry.body}</p>
              {isTableHost ? <SealActions id={entry.id} /> : null}
            </li>
          ))}
        </ul>
      ) : null}

      {shown.length === 0 ? (
        <p className="mt-6 text-sm text-muted">Księga czeka na pierwszy podpis.</p>
      ) : (
        <ul className="mt-8 space-y-6">
          {shown.map((entry) => (
            <li key={entry.id} className="border-t border-border pt-4">
              <p className="font-display text-2xl italic tracking-tight">
                {entry.displayName}
              </p>
              <p className="mt-1 text-sm text-fg">{entry.body}</p>
              <p className="mt-1 text-xs text-subtle">
                {entry.createdAt ? formatPlDate(entry.createdAt) : ""}
              </p>
            </li>
          ))}
        </ul>
      )}

      {compact && entries.length > 4 ? (
        <Button asChild variant="ghost" className="mt-4">
          <Link to="/ksiega">Cała księga</Link>
        </Button>
      ) : null}
    </section>
  );
}

function SealActions({ id }: { id: number }) {
  const queryClient = useQueryClient();
  const act = useMutation({
    mutationFn: (decision: "pieczec" | "odmowa") =>
      sealGuestbook({ data: { id, decision } }),
    onSuccess: (res) => {
      toast.success(
        res.decision === "pieczec" ? "Pieczęć stołu." : "Stół odmówił.",
      );
      void queryClient.invalidateQueries({ queryKey: ["domain"] });
      void queryClient.invalidateQueries({ queryKey: ["guestbook-inbox"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
  return (
    <div className="mt-3 flex flex-wrap gap-1">
      <Button
        type="button"
        size="sm"
        onClick={() => act.mutate("pieczec")}
        disabled={act.isPending}
      >
        {TABLE_HOST_NAME} pieczętuje
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => act.mutate("odmowa")}
        disabled={act.isPending}
      >
        Stół zamknięty
      </Button>
    </div>
  );
}