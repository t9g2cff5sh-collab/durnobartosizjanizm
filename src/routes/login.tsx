import { createFileRoute, Link, Navigate, useRouteContext } from "@tanstack/react-router";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";

import {
  GROK_PROVIDERS,
  authClient,
  authEnabled,
  signIn,
} from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { ensureMembership, getDomainSnapshot } from "@/lib/domain";
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

function polishAuthError(raw: string) {
  const text = raw.toLowerCase();
  if (text.includes("already exists") || text.includes("already registered")) {
    return "To konto już stoi. Zaloguj się.";
  }
  if (text.includes("invalid email or password") || text.includes("invalid password")) {
    return "E-mail albo hasło nie zgadza się.";
  }
  if (text.includes("invalid email")) {
    return "Ten e-mail nie przejdzie.";
  }
  if (text.includes("too short") || text.includes("password")) {
    return "Hasło: minimum 8 znaków.";
  }
  if (text.includes("popup") || text.includes("pop-up")) {
    return "Safari zablokowało okno. Zezwól na wyskakujące okna i spróbuj jeszcze raz.";
  }
  if (text.includes("cancelled") || text.includes("canceled") || text.includes("access_denied")) {
    return "Przerwane. Nic nie pieczętujemy na siłę.";
  }
  if (
    text.includes("idp") ||
    text.includes("apple") ||
    text.includes("oauth") ||
    text.includes("provider") ||
    text.includes("unauthorized") ||
    text.includes("unsupported") ||
    text.includes("invalid_request")
  ) {
    return "Apple nie otworzyło drzwi. Z iPhone'a wejdź jeszcze raz — albo e-mailem.";
  }
  if (/[_=&]|error|token|callback/i.test(raw) || raw.length > 90) {
    return "Nie udało się wejść. Spróbuj jeszcze raz albo wejdź e-mailem.";
  }
  return raw || "Nie udało się wejść.";
}

function Login() {
  const { user, isPending } = useCurrentUserState();
  const { isSignedIn } = useResolvedAuth();
  const { sessionUser } = useRouteContext({ from: "__root__" });
  const queryClient = useQueryClient();
  const initial = Route.useLoaderData();
  const domain = useQuery({
    queryKey: ["domain"],
    queryFn: () => getDomainSnapshot(),
    initialData: initial,
  });
  const claimed = Boolean(domain.data?.claimed);
  const [gate, setGate] = useState<"wait" | "studio" | "skladka" | "home" | null>(
    null,
  );

  useEffect(() => {
    if (isPending && !isSignedIn) return;
    if (!isSignedIn || !user) {
      setGate(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const membership = await ensureMembership({
          data: { displayName: user.displayName?.trim() || undefined },
        });
        queryClient.setQueryData(["me"], membership);
        await queryClient.invalidateQueries({ queryKey: ["domain"] });
        await queryClient.invalidateQueries({ queryKey: ["dues"] });
        if (cancelled) return;
        setGate(
          membership.isFounder ? "studio" : membership.paid ? "home" : "skladka",
        );
      } catch {
        if (!cancelled) setGate("home");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isPending, isSignedIn, user, queryClient]);

  if (isPending && sessionUser && !isSignedIn) {
    return <GateWait label="Sprawdzam próg…" />;
  }

  if (isSignedIn) {
    if (gate === "studio") return <Navigate to="/studio" />;
    if (gate === "skladka") return <Navigate to="/skladka" />;
    if (gate === "home") return <Navigate to="/" />;
    return <GateWait label="Pieczętuję konto…" />;
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
            {claimed ? "Świat zajęty · próg" : "Protokół 01 · pierwsze konto"}
          </p>
          <h1 className="mt-4 font-display text-4xl leading-tight tracking-tight">
            {claimed
              ? "Wejdź do chóru. Imię zostaje na tablicy."
              : "Pierwsze konto pieczętuje świat."}
          </h1>
          <p className="mt-4 max-w-sm text-muted">
            {claimed
              ? "Apple, Google albo e-mail. Potem 10 Twoich pieniążków — i jesteś na tablicy lojalnych."
              : "Imię, które wpiszesz, stanie na pieczęci. Kto zrobi to pierwszy, zostaje prorokiem na stałe."}
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

function GateWait({ label }: { label: string }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center px-5 text-center">
      <SealMark size={48} />
      <p className="mt-6 text-sm text-muted">{label}</p>
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
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const raw = [
      params.get("error"),
      params.get("error_description"),
      params.get("errorDescription"),
    ]
      .filter(Boolean)
      .join(" ");
    if (!raw) return;
    setError(polishAuthError(raw));
    window.history.replaceState(null, "", "/login");
  }, []);

  async function onSocial(providerId: string) {
    setError(null);
    setBusy(true);
    try {
      await signIn(providerId, {
        callbackURL: "/login",
        errorCallbackURL: "/login",
      });
    } catch (err) {
      setError(
        polishAuthError(err instanceof Error ? err.message : "Nie udało się wejść."),
      );
      setBusy(false);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const trimmedName = name.trim();
    if (mode === "signup") {
      if (trimmedName.length < 2) {
        setError("Imię: minimum dwa znaki. To wejdzie na tablicę.");
        return;
      }
      if (password !== confirm) {
        setError("Hasła nie są takie same.");
        return;
      }
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error: signUpError } = await authClient.signUp.email({
          email: email.trim(),
          password,
          name: trimmedName,
        });
        if (signUpError) {
          throw new Error(signUpError.message ?? "Nie udało się założyć konta.");
        }
      } else {
        const { error: signInError } = await authClient.signIn.email({
          email: email.trim(),
          password,
        });
        if (signInError) {
          throw new Error(signInError.message ?? "Nie udało się zalogować.");
        }
      }

      const membership = await ensureMembership({
        data: { displayName: trimmedName || undefined },
      });
      queryClient.setQueryData(["me"], membership);
      await queryClient.invalidateQueries({ queryKey: ["domain"] });
      window.location.href = membership.isFounder
        ? "/studio"
        : membership.paid
          ? "/"
          : "/skladka";
    } catch (err) {
      setError(
        polishAuthError(err instanceof Error ? err.message : "Coś poszło nie tak."),
      );
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <h2 className="font-display text-3xl tracking-tight">
        {mode === "signup"
          ? claimed
            ? "Nowe konto"
            : "Konto proroka"
          : "Wejście"}
      </h2>
      <p className="mt-2 text-sm text-muted">
        {mode === "signup" && !claimed
          ? "To będzie pierwsze — i jedyne — konto proroka tego świata."
          : mode === "signup"
            ? "Imię na tablicę, potem 10 pieniążków. Apple z iPhone'a działa od razu."
            : "Z iPhone'a: Apple. Albo e-mail i hasło."}
      </p>

      {authEnabled ? (
        <div className="mt-8 flex flex-col gap-2">
          {GROK_PROVIDERS.map((provider) => (
            <Button
              key={provider.providerId}
              type="button"
              variant={provider.idp === "apple" ? "primary" : "outline"}
              disabled={busy}
              onClick={() => void onSocial(provider.providerId)}
            >
              {provider.idp === "apple"
                ? "Wejdź przez Apple"
                : `Kontynuuj przez ${provider.label}`}
            </Button>
          ))}
        </div>
      ) : null}

      {authEnabled ? (
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs uppercase tracking-[0.16em] text-subtle">
              albo e-mail
            </span>
            <Separator className="flex-1" />
          </div>
          {mode === "signup" ? (
            <Field label="Imię na tablicy" htmlFor="name">
              <Input
                id="name"
                autoComplete="name"
                autoCapitalize="words"
                autoCorrect="off"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="jak Cię wołać"
                minLength={2}
                maxLength={80}
                required
              />
            </Field>
          ) : null}
          <Field label="E-mail" htmlFor="email">
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
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
          {mode === "signup" ? (
            <Field label="Powtórz hasło" htmlFor="confirm">
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="jeszcze raz"
                minLength={8}
                required
              />
            </Field>
          ) : null}
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button type="submit" className="w-full" size="lg" disabled={busy}>
            {busy
              ? "Chwila…"
              : mode === "signup"
                ? claimed
                  ? "Załóż konto"
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
              onClick={() => {
                setMode("signin");
                setError(null);
              }}
            >
              Zaloguj się
            </button>
          </>
        ) : (
          <>
            {claimed ? "Nie masz jeszcze konta?" : "Świat wciąż czeka na pierwsze konto."}{" "}
            <button
              type="button"
              className="text-fg underline underline-offset-4"
              onClick={() => {
                setMode("signup");
                setError(null);
              }}
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
