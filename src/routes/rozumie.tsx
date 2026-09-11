import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Paywall } from "@/components/paywall";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { askRozumie, getRozumie } from "@/lib/choir";
import { getDuesStatus } from "@/lib/dues";
import { useResolvedAuth } from "@/lib/use-resolved-auth";

export const Route = createFileRoute("/rozumie")({
  loader: () => getRozumie(),
  component: RozumiePage,
});

function RozumiePage() {
  const initial = Route.useLoaderData();
  const { isSignedIn } = useResolvedAuth();
  const list = useQuery({
    queryKey: ["rozumie"],
    queryFn: () => getRozumie(),
    initialData: initial,
  });
  const dues = useQuery({
    queryKey: ["dues"],
    queryFn: () => getDuesStatus(),
    enabled: isSignedIn,
  });
  const canPost = Boolean(dues.data?.paid);
  const hits = list.data?.hits ?? [];

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-5 pb-20 md:px-10">
        <p className="font-mono text-xs tracking-[0.18em] text-subtle">
          Strefa bez brawo
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight md:text-5xl">
          Rozumie
        </h1>
        <p className="mt-3 max-w-xl text-muted">
          Jedno zdanie. Dostajesz konkret z powrotem, nie salwę. Tylko obecność.
        </p>

        {isSignedIn ? (
          canPost ? (
            <RozumieForm />
          ) : (
            <Paywall action="wejść do pokoju" />
          )
        ) : (
          <p className="mt-6 text-sm text-muted">
            <Link to="/login" className="underline underline-offset-4">
              Wejdź
            </Link>
            . Potem jedno zdanie.
          </p>
        )}

        <ul className="mt-10 space-y-6">
          {hits.length === 0 ? (
            <li className="rounded-xl bg-surface px-4 py-10 text-center text-sm text-subtle shadow-[var(--shadow-border)]">
              Cisza. To dobrze.
            </li>
          ) : (
            hits.map((hit) => (
              <li key={hit.id} className="border-t border-border pt-6">
                <p className="font-display text-xl tracking-tight">{hit.sentence}</p>
                <p className="mt-2 text-sm text-muted">{hit.reply}</p>
              </li>
            ))
          )}
        </ul>
      </main>
    </div>
  );
}

function RozumieForm() {
  const [sentence, setSentence] = useState("");
  const [last, setLast] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const ask = useMutation({
    mutationFn: () => askRozumie({ data: { sentence } }),
    onSuccess: (res) => {
      setLast(res.reply);
      setSentence("");
      void queryClient.invalidateQueries({ queryKey: ["rozumie"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    ask.mutate();
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-3">
      <Textarea
        value={sentence}
        onChange={(e) => setSentence(e.target.value)}
        placeholder="Jedno zdanie. Nie brawo."
        rows={3}
        required
      />
      <Button type="submit" disabled={ask.isPending}>
        Konkret
      </Button>
      {last ? (
        <p className="rounded-xl bg-surface p-4 text-sm text-fg shadow-[var(--shadow-border)]">
          {last}
        </p>
      ) : null}
    </form>
  );
}
