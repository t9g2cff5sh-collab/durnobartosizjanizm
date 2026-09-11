import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { RedirectToSignIn } from "@/lib/auth/gates";
import {
  DUES_FEE,
  DUES_LABEL,
  formatPieniazki,
  getDuesStatus,
  payDues,
} from "@/lib/dues";
import { useResolvedAuth } from "@/lib/use-resolved-auth";
import { formatPlDate } from "@/lib/utils";
import { CO_CREATOR } from "@/lib/world";

export const Route = createFileRoute("/skladka")({
  component: SkladkaPage,
});

function SkladkaPage() {
  const { user, isSignedIn } = useResolvedAuth();
  const queryClient = useQueryClient();
  const dues = useQuery({
    queryKey: ["dues"],
    queryFn: () => getDuesStatus(),
    enabled: isSignedIn,
  });

  if (!isSignedIn || !user) return <RedirectToSignIn />;

  const pay = useMutation({
    mutationFn: () => payDues(),
    onSuccess: () => {
      toast.success("Wzięte z Twojej kieszeni. Jesteś w chórze.");
      void queryClient.invalidateQueries({ queryKey: ["dues"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (dues.data?.paid) {
    return (
      <div className="min-h-dvh">
        <SiteHeader />
        <main className="mx-auto max-w-lg px-5 py-16">
          <p className="font-mono text-xs tracking-[0.18em] text-subtle">
            Kieszeń
          </p>
          <h1 className="mt-2 font-display text-4xl tracking-tight">
            Składka złożona
          </h1>
          <p className="mt-4 text-muted">
            {formatPieniazki(DUES_FEE)} z Twojej kieszeni
            {dues.data.paidAt ? ` · ${formatPlDate(dues.data.paidAt)}` : ""}.
            Zostało {formatPieniazki(dues.data.balance)}.
          </p>
          {dues.data.isFounder ? (
            <p className="mt-3 text-sm text-muted">
              Prorok nic nie płaci. W skarbcu {formatPieniazki(dues.data.treasury)}{" "}
              od {dues.data.paidCount}{" "}
              {dues.data.paidCount === 1 ? "konta" : "kont"}.
            </p>
          ) : null}
          <Button asChild className="mt-8">
            <Link to="/">Wróć do świata</Link>
          </Button>
        </main>
      </div>
    );
  }

  if (dues.isPending) {
    return (
      <div className="min-h-dvh">
        <SiteHeader />
        <main className="mx-auto max-w-lg px-5 py-16">
          <p className="text-muted">Sprawdzam kieszeń…</p>
        </main>
      </div>
    );
  }

  const balance = dues.data?.balance ?? 0;
  const canPay = balance >= DUES_FEE;

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-lg px-5 py-16">
        <p className="font-mono text-xs tracking-[0.18em] text-subtle">
          {CO_CREATOR.name} · {CO_CREATOR.title}
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">
          Składka członkowska
        </h1>
        <p className="mt-4 text-lg text-muted">
          Wejście do chóru kosztuje {DUES_LABEL}. Nie złotówki — Twoje
          pieniążki. Idą na kartę konta firmowego.
        </p>
        <div className="mt-8 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
          <p className="text-xs tracking-[0.18em] text-subtle">Twoja kieszeń</p>
          <p className="mt-2 font-display text-5xl tracking-tight">
            {formatPieniazki(balance)}
          </p>
          <p className="mt-2 text-sm text-muted">
            Składka zabiera {formatPieniazki(DUES_FEE)}. Potem tablica, księga,
            kawałki i synod.
          </p>
          <Button
            className="mt-6 w-full"
            size="lg"
            disabled={pay.isPending || !canPay}
            onClick={() => pay.mutate()}
          >
            {pay.isPending
              ? "Biorę z kieszeni…"
              : canPay
                ? `Zapłać ${formatPieniazki(DUES_FEE)}`
                : "Za mało pieniążków"}
          </Button>
        </div>
      </main>
    </div>
  );
}
