import { createFileRoute } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { ATLAS_PAS, OCIOSOWA } from "@/lib/world";

export const Route = createFileRoute("/mapa")({
  component: MapaPage,
});

function MapaPage() {
  const [host, setHost] = useState<"czeka" | "puk" | "wpuszcza">("czeka");
  const [phone, setPhone] = useState<"demo" | "czeka" | "prawdziwy">("demo");

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 pb-20 md:px-10">
        <p className="font-mono text-xs tracking-[0.18em] text-subtle">
          Nierazem
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight md:text-5xl">
          Mapa wejścia
        </h1>
        <p className="mt-3 max-w-xl text-muted">
          Osobno, nie hurtem. Jedne drzwi. Jedna osoba.
        </p>

        <ol className="mt-10 divide-y divide-border rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
          {[
            { n: "01", t: "Zostaw hurtem na korytarzu", d: "Zbór nie wchodzi kupą. Każdy swoje drzwi." },
            { n: "02", t: "Pukaj", d: OCIOSOWA.rule },
            { n: "03", t: "Host musi wpuścić", d: "Meet tego nie zrobi. Lore drzwi jest twardsze niż link." },
          ].map((step) => (
            <li key={step.n} className="flex gap-5 px-3 py-5">
              <span className="font-mono text-xs tracking-[0.18em] text-subtle">
                {step.n}
              </span>
              <div>
                <p className="font-display text-xl tracking-tight">{step.t}</p>
                <p className="mt-1 text-sm text-muted">{step.d}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-8 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
          <p className="font-mono text-xs tracking-[0.18em] text-subtle">
            Adres
          </p>
          <p className="mt-2 font-display text-2xl tracking-tight">
            {OCIOSOWA.address}
          </p>
          <p className="mt-2 text-sm text-muted">{OCIOSOWA.rule}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild size="sm">
              <a href={OCIOSOWA.maps}>Mapy · puk, nie dzwonek</a>
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setHost(host === "wpuszcza" ? "czeka" : "puk")}
            >
              Domofon martwy = pukaj
            </Button>
          </div>
          <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted">
            <MapPin className="size-3.5" />
            {host === "puk"
              ? "Pukasz. Host jeszcze nie otworzył."
              : host === "wpuszcza"
                ? "Host kiwnął. Wchodzisz sam."
                : "Stoisz pod drzwiami. Nierazem."}
          </p>
        </div>

        <div className="mt-4 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
          <p className="font-display text-xl tracking-tight">Host musi wpuścić</p>
          <p className="mt-2 text-sm text-muted">
            Przycisk nie otwiera Meeta. Otwiera lore. Czekasz, aż gospodarz kiwnie.
          </p>
          <Button
            type="button"
            className="mt-4"
            size="sm"
            onClick={() =>
              setHost((h) => (h === "wpuszcza" ? "czeka" : h === "puk" ? "wpuszcza" : "puk"))
            }
          >
            {host === "wpuszcza" ? "Jesteś w środku" : "Host musi wpuścić"}
          </Button>
        </div>

        <div className="mt-4 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
          <p className="font-display text-xl tracking-tight">Telefon demo → prawdziwy</p>
          <p className="mt-2 text-sm text-muted">
            Mit o czekaniu na dostawę. Najpierw atrapa. Potem aparat. Potem pukasz i tak.
          </p>
          <Button
            type="button"
            className="mt-4"
            size="sm"
            variant="outline"
            onClick={() =>
              setPhone((p) =>
                p === "demo" ? "czeka" : p === "czeka" ? "prawdziwy" : "demo",
              )
            }
          >
            {phone === "demo"
              ? "Telefon demo"
              : phone === "czeka"
                ? "Czekasz na dostawę…"
                : "Prawdziwy. Pukaj mimo to."}
          </Button>
        </div>

        <h2 className="mt-12 font-display text-2xl tracking-tight">Atlas nazw na Pasie</h2>
        <ul className="mt-4 space-y-3">
          {ATLAS_PAS.map((place) => (
            <li
              key={place.t}
              className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]"
            >
              <p className="font-display text-xl tracking-tight">{place.t}</p>
              <p className="mt-2 text-sm text-muted">{place.d}</p>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
