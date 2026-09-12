import { Link, useRouterState } from "@tanstack/react-router";
import { UserButton } from "@/lib/auth/gates";
import { useQuery } from "@tanstack/react-query";
import { getDomainSnapshot } from "@/lib/domain";
import { getDuesStatus } from "@/lib/dues";
import { useResolvedAuth } from "@/lib/use-resolved-auth";
import { SealMark } from "@/components/seal-mark";
import { Button } from "@/components/ui/button";
import { BOARDS } from "@/lib/world";

const MORE = [
  { to: "/kawalki", label: "Kawałki" },
  { to: "/ksiega", label: "Księga" },
  { to: "/kodeks", label: "Kodeks" },
  { to: "/zbor", label: "Zbór" },
] as const;

export function SiteHeader() {
  const { user, isSignedIn } = useResolvedAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const domain = useQuery({
    queryKey: ["domain"],
    queryFn: () => getDomainSnapshot(),
  });
  const dues = useQuery({
    queryKey: ["dues"],
    queryFn: () => getDuesStatus(),
    enabled: isSignedIn,
  });
  const isFounder =
    Boolean(user) && domain.data?.founder?.userId === user?.id;
  const needsDues = isSignedIn && dues.data && !dues.data.paid;

  return (
    <header className="relative z-10 px-5 py-5 md:px-10">
      <div className="flex items-center justify-between gap-3">
        <Link to="/" className="flex min-w-0 items-center gap-3 text-fg">
          <SealMark size={36} />
          <span className="flex min-w-0 flex-col leading-none">
            <span className="truncate font-display text-base tracking-tight sm:text-lg">
              DurnoBartosizjanizm
            </span>
            <span className="mt-1 font-mono text-xs tracking-[0.18em] text-subtle">
              tablica domu
            </span>
          </span>
        </Link>
        {isSignedIn ? (
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {needsDues ? (
              <Button asChild size="sm">
                <Link to="/skladka">Składka</Link>
              </Button>
            ) : null}
            <Button asChild variant="ghost" size="sm">
              <Link to="/studio">
                {isFounder
                  ? "Kuria"
                  : dues.data?.isCoCreator
                    ? "Współtwórca"
                    : "Konto"}
              </Link>
            </Button>
            <UserButton />
          </div>
        ) : (
          <Button asChild variant="outline" size="sm">
            <Link to="/login">
              {domain.data?.claimed === false ? "Pierwszy" : "Wejdź"}
            </Link>
          </Button>
        )}
      </div>
      <nav
        aria-label="Tablice domu"
        className="mt-4 grid grid-cols-3 gap-1 rounded-lg bg-surface p-1 shadow-[var(--shadow-border)]"
      >
        {BOARDS.map((item) => {
          const active = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={active ? "page" : undefined}
              className={
                active
                  ? "grid min-h-11 place-items-center rounded-md bg-accent px-2 text-center font-mono text-[11px] tracking-[0.14em] text-accent-fg sm:text-xs"
                  : "grid min-h-11 place-items-center rounded-md px-2 text-center font-mono text-[11px] tracking-[0.14em] text-subtle hover:text-fg sm:text-xs"
              }
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <nav className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
        {MORE.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="min-h-11 inline-flex items-center font-mono text-xs tracking-[0.14em] text-subtle hover:text-fg"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
