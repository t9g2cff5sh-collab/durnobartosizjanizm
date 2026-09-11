import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PenLine } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { signGuestbook, type GuestItem } from "@/lib/domain";
import { getDuesStatus } from "@/lib/dues";
import { Paywall } from "@/components/paywall";
import { useResolvedAuth } from "@/lib/use-resolved-auth";
import { formatPlDate } from "@/lib/utils";

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
  const canPost = Boolean(dues.data?.paid);
  const [body, setBody] = useState("");

  const sign = useMutation({
    mutationFn: () =>
      signGuestbook({
        data: {
          body,
          displayName: user?.displayName ?? undefined,
        },
      }),
    onSuccess: () => {
      setBody("");
      toast.success("Podpis w księdze.");
      void queryClient.invalidateQueries({ queryKey: ["domain"] });
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
            Imię z konta jest Twoim podpisem. Dopisz zdanie, jeśli chcesz zostawić
            ślad.
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
                Podpisz księgę
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
