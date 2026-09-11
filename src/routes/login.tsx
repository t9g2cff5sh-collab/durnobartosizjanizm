import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent, type ReactNode } from "react";
import {
  GROK_PROVIDERS,
  authClient,
  authEnabled,
  signIn,
} from "@/lib/auth/client";
import { ensureMembership, getDomainSnapshot } from "@/lib/domain";
import { getDuesStatus } from "@/lib/dues";
import { useResolvedAuth } from "@/lib/use-resolved-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SealMark } from "@/components/seal-mark";
import { Separator } from "@/components/ui/separator";
import { WORLD_HOST } from "@/lib/world";

export const Route = createFileRoute("/login")({
  loader: () => getDomainSnapshot(),
  component: Login,
});

function Login() {
  const { user, isSignedIn } = useResolvedAuth();
  const initial = Route.useLoaderData();
  const domain = useQuery({
    queryKey: ["domain"],
    queryFn: () => getDomainSnapshot(),
    initialData: initial,
  });
  const claimed = Boolean(domain.data?.claimed);
  const dues = useQuery({
    queryKey: ["dues"],
    queryFn: () => getDuesStatus(),
    enabled: isSignedIn,
  });

  if (isSignedIn && user) {
    if (domain.data?.founder?.userId === user.id) {
      return <Navigate to="/studio" />;
    }
    if (dues.data && !dues.data.paid) {
      return <Navigate to="/skladka" />;
    }
    if (dues.data?.paid || !claimed) {
      return <Navigate to="/" />;
    }
  }

  return (
    <main className="mx-auto grid min-h-dvh max-w-5xl md:grid-cols-2">
      <section className="hidden flex-col justify-between border-r border-border px-10 py-10 md:flex">
        <Link to="/" className="flex items-center gap-3 text-fg">
          <SealMark size={40} />
          <span className="font-display text-lg">DurnoBartosizjanizm</span>
        </Link>
        <div>
          <p className="font-mono text-xs tracking-[0.18em] text-subtle">
            {claimed ? "Świat zajęty" : "Protokół 01"}
          </p>
          <h1 className="mt-4 font-display text-4xl leading-tight tracking-tight">
            {claimed
              ? "Dołącz do chóru tego świata."
              : "Pierwsze konto pieczętuje świat."}
          </h1>
          <p className="mt-4 max-w-sm text-muted">
            {claimed
              ? "Prorok już tu jest. Wejście do chóru kosztuje 10 Twoich pieniążków."
              : "Wpisz imię, e-mail i hasło. Kto zrobi to pierwszy, zostaje prorokiem na stałe."}
          </p>
        </div>
        <p className="text-xs text-subtle">{WORLD_HOST}</p>
      </section>

      <section className="flex flex-col justify-center px-5 py-12 md:px-12">
        <div className="mb-8 md:hidden">
          <Link to="/" className="flex items-center gap-3 text-fg">
            <SealMark size={36} />
            <span className="font-display text-lg">DurnoBartosizjanizm</span>
          </Link>
        </div>
        <AccountForm claimed={claimed} />
      </section>
    </main>
  );
}

function AccountForm({ claimed }: { claimed: boolean }) {
  const [mode, setMode] = useState<"signup" | "signin">(
    claimed ? "signin" : "signup",
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const queryClient = useQueryClient();

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error: signUpError } = await authClient.signUp.email({
          email,
          password,
          name: name.trim() || email.split("@")[0] || "Bartosz",
        });
        if (signUpError) throw new Error(signUpError.message ?? "Nie udało się założyć konta.");
      } else {
        const { error: signInError } = await authClient.signIn.email({
          email,
          password,
        });
        if (signInError) throw new Error(signInError.message ?? "Nie udało się zalogować.");
      }

      const membership = await ensureMembership({
        data: { displayName: name.trim() || email.split("@")[0] || "Bartosz" },
      });
      queryClient.setQueryData(["me"], membership);
      await queryClient.invalidateQueries({ queryKey: ["domain"] });
      window.location.href = membership.isFounder
        ? "/studio"
        : membership.paid
          ? "/"
          : "/skladka";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Coś poszło nie tak.");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <h2 className="font-display text-3xl tracking-tight">
        {mode === "signup"
          ? claimed
            ? "Nowe konto wyznawcy"
            : "Konto proroka"
          : "Logowanie"}
      </h2>
      <p className="mt-2 text-sm text-muted">
        {mode === "signup" && !claimed
          ? "To będzie pierwsze — i jedyne — konto proroka tego świata."
          : "Z iPhone'a: Apple. Albo e-mail i hasło."}
      </p>

      {authEnabled ? (
        <div className="mt-8 flex flex-col gap-2">
          {GROK_PROVIDERS.map((provider) => (
            <Button
              key={provider.providerId}
              type="button"
              variant={provider.idp === "apple" ? "primary" : "outline"}
              onClick={() =>
                signIn(provider.providerId, { callbackURL: "/skladka" })
              }
            >
              Kontynuuj przez {provider.label}
            </Button>
          ))}
        </div>
      ) : null}

      {authEnabled ? (
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs uppercase tracking-[0.16em] text-subtle">
              albo
            </span>
            <Separator className="flex-1" />
          </div>
          {mode === "signup" ? (
            <Field label="Imię" htmlFor="name">
              <Input
                id="name"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="np. Bartosz"
                required
              />
            </Field>
          ) : null}
          <Field label="E-mail" htmlFor="email">
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ty@domena.pl"
              required
            />
          </Field>
          <Field label="Hasło" htmlFor="password">
            <Input
              id="password"
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="min. 8 znaków"
              minLength={8}
              required
            />
          </Field>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button type="submit" className="w-full" size="lg" disabled={busy}>
            {busy
              ? "Chwila…"
              : mode === "signup"
                ? claimed
                  ? "Załóż konto wyznawcy"
                  : "Załóż pierwsze konto"
                : "Zaloguj się"}
          </Button>
        </form>
      ) : (
        <p className="mt-6 text-sm text-muted">Logowanie jest wyłączone.</p>
      )}

      <p className="mt-8 text-sm text-muted">
        {mode === "signup" ? (
          <>
            Masz już konto?{" "}
            <button
              type="button"
              className="text-fg underline underline-offset-4"
              onClick={() => setMode("signin")}
            >
              Zaloguj się
            </button>
          </>
        ) : (
          <>
            {claimed ? "Nowe konto wyznawcy?" : "Pierwsze konto?"}{" "}
            <button
              type="button"
              className="text-fg underline underline-offset-4"
              onClick={() => setMode("signup")}
            >
              Załóż je
            </button>
          </>
        )}
      </p>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
