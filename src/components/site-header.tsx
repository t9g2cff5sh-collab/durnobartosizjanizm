import { Link } from "@tanstack/react-router";
import { UserButton } from "@/lib/auth/gates";
import { useQuery } from "@tanstack/react-query";
import { getDomainSnapshot } from "@/lib/domain";
import { getDuesStatus } from "@/lib/dues";
import { useResolvedAuth } from "@/lib/use-resolved-auth";
import { SealMark } from "@/components/seal-mark";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/tablica", label: "Tablica" },
  { to: "/kawalki", label: "Kawałki" },
  { to: "/ksiega", label: "Księga" },
  { to: "/tot", label: "ToT" },
  { to: "/budzet", label: "Budżet" },
  { to: "/kodeks", label: "Kodeks" },
  { to: "/kredo", label: "Kredo" },

  { to: "/mapa", label: "Mapa" },
  { to: "/kronika", label: "Kronika" },
  { to: "/rozumie", label: "Rozumie" },
  { to: "/zbor", label: "Zbór" },
  { to: "/sztab", label: "Sztab" },
  { to: "/slawa", label: "Sława" },
] as const;


export function SiteHeader() {
  const { user, isSignedIn } = useResolvedAuth();
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
              .world
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
      <nav className="mt-3 flex flex-wrap gap-1">
        {NAV.map((item) => (
          <Button key={item.to} asChild variant="ghost" size="sm">
            <Link to={item.to}>{item.label}</Link>
          </Button>
        ))}
      </nav>
    </header>
  );
}
