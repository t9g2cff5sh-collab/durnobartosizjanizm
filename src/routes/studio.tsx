import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { CredoBox } from "@/components/credo-box";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useResolvedAuth } from "@/lib/use-resolved-auth";
import {
  addLink,
  addNote,
  getDomainSnapshot,
  removeLink,
  removeNote,
  updateFounderProfile,
} from "@/lib/domain";
import { getBudget, updateFirmAccount } from "@/lib/budget";
import { formatPieniazki, getDuesStatus } from "@/lib/dues";

export const Route = createFileRoute("/studio")({
  loader: () => getDomainSnapshot(),
  component: Studio,
});

function Studio() {
  const { user, isSignedIn } = useResolvedAuth();
  const initial = Route.useLoaderData();
  const domain = useQuery({
    queryKey: ["domain"],
    queryFn: () => getDomainSnapshot(),
    initialData: initial,
  });

  if (!isSignedIn || !user) return <RedirectToSignIn />;

  const isFounder = domain.data?.founder?.userId === user.id;

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      {isFounder ? (
        <FounderStudio />
      ) : (
        <MemberStudio displayName={user.displayName ?? "Gość"} />
      )}
    </div>
  );
}

function MemberStudio({ displayName }: { displayName: string }) {
  const dues = useQuery({
    queryKey: ["dues"],
    queryFn: () => getDuesStatus(),
  });
  const paid = Boolean(dues.data?.paid);

  return (
    <main className="mx-auto max-w-lg px-5 py-16">
      <p className="font-mono text-xs tracking-[0.18em] text-subtle">Konto</p>
      <h1 className="mt-3 font-display text-4xl tracking-tight">Wyznawca</h1>
      <p className="mt-4 text-muted">
        Cześć, {displayName}. Każdy należący posiada własne kredo. Tu je pieczętujesz.
      </p>
      <CredoBox />
      <div className="mt-8 flex flex-wrap gap-3">
        {paid ? (
          <Button asChild>
            <Link to="/tot">Tablica ToT</Link>
          </Button>
        ) : (
          <Button asChild>
            <Link to="/skladka">Złóż składkę</Link>
          </Button>
        )}
        <Button asChild variant="outline">
          <Link to="/">Wróć do świata</Link>
        </Button>
      </div>
    </main>
  );
}

function FounderStudio() {
  const domain = useQuery({
    queryKey: ["domain"],
    queryFn: () => getDomainSnapshot(),
  });
  const founder = domain.data?.founder;
  const queryClient = useQueryClient();

  const [displayName, setDisplayName] = useState(founder?.displayName ?? "");
  const [handle, setHandle] = useState(founder?.handle ?? "");
  const [title, setTitle] = useState(founder?.title ?? "");
  const [location, setLocation] = useState(founder?.location ?? "");
  const [manifesto, setManifesto] = useState(founder?.manifesto ?? "");
  const [linkLabel, setLinkLabel] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");

  useEffect(() => {
    if (!founder) return;
    setDisplayName(founder.displayName);
    setHandle(founder.handle);
    setTitle(founder.title);
    setLocation(founder.location);
    setManifesto(founder.manifesto);
  }, [founder?.userId, founder?.displayName, founder?.handle, founder?.title, founder?.location, founder?.manifesto]);

  const saveProfile = useMutation({
    mutationFn: () =>
      updateFounderProfile({
        data: { displayName, handle, title, manifesto, location },
      }),
    onSuccess: () => {
      toast.success("Profil zapisany.");
      void queryClient.invalidateQueries({ queryKey: ["domain"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const createLink = useMutation({
    mutationFn: () => addLink({ data: { label: linkLabel, url: linkUrl } }),
    onSuccess: () => {
      setLinkLabel("");
      setLinkUrl("");
      toast.success("Łącze dodane.");
      void queryClient.invalidateQueries({ queryKey: ["domain"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteLink = useMutation({
    mutationFn: (id: number) => removeLink({ data: { id } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["domain"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const createNote = useMutation({
    mutationFn: () => addNote({ data: { title: noteTitle, body: noteBody } }),
    onSuccess: () => {
      setNoteTitle("");
      setNoteBody("");
      toast.success("Notatka opublikowana.");
      void queryClient.invalidateQueries({ queryKey: ["domain"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteNote = useMutation({
    mutationFn: (id: number) => removeNote({ data: { id } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["domain"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <main className="mx-auto max-w-3xl px-5 pb-24 pt-6 md:px-10">
      <p className="font-mono text-xs tracking-[0.18em] text-subtle">
        Kuria · pieczęć 01
      </p>
      <h1 className="mt-3 font-display text-4xl tracking-tight md:text-5xl">
        Jesteś prorokiem tego świata
      </h1>
      <p className="mt-3 max-w-xl text-muted">
        Imię, manifest, łącza i kazania. To widać na DurnoBartosizjanizm.world.
      </p>
      <section className="mt-10 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] md:p-5">
        <h2 className="font-display text-2xl tracking-tight">Twoje kredo</h2>
        <CredoBox />
      </section>
      <Treasury />
      <FirmCardForm />

      <form
        className="mt-10 space-y-5 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] md:p-5"
        onSubmit={(e) => {
          e.preventDefault();
          saveProfile.mutate();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Imię proroka" htmlFor="displayName">
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </Field>
          <Field label="Handle" htmlFor="handle">
            <Input
              id="handle"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="anna"
            />
          </Field>
          <Field label="Tytuł" htmlFor="title">
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Prorok DurnoBartosizjanizmu"
            />
          </Field>
          <Field label="Miejsce" htmlFor="location">
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Warszawa"
            />
          </Field>
        </div>
        <Field label="Manifest" htmlFor="manifesto">
          <Textarea
            id="manifesto"
            value={manifesto}
            onChange={(e) => setManifesto(e.target.value)}
            maxLength={2000}
            placeholder="Krótko: po co ten świat istnieje."
            className="min-h-36"
          />
        </Field>
        <div className="flex justify-end">
          <Button type="submit" disabled={saveProfile.isPending}>
            {saveProfile.isPending ? "Zapisuję…" : "Zapisz profil"}
          </Button>
        </div>
      </form>

      <section className="mt-12">
        <h2 className="font-display text-2xl tracking-tight">Łącza</h2>
        <form
          className="mt-4 flex flex-col gap-3 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            createLink.mutate();
          }}
        >
          <Input
            value={linkLabel}
            onChange={(e) => setLinkLabel(e.target.value)}
            placeholder="Etykieta"
            className="sm:w-40"
          />
          <Input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="adres.pl"
            className="flex-1"
          />
          <Button type="submit" variant="outline" disabled={createLink.isPending}>
            Dodaj
          </Button>
        </form>
        <ul className="mt-4">
          {(domain.data?.links ?? []).map((link) => (
            <li
              key={link.id}
              className="flex items-center justify-between gap-3 border-b border-border py-3 text-sm"
            >
              <span>
                {link.label}
                <span className="ml-2 text-subtle">{link.url}</span>
              </span>
              <button
                type="button"
                className="grid size-11 place-items-center text-muted hover:text-danger"
                onClick={() => deleteLink.mutate(link.id)}
                aria-label="Usuń łącze"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl tracking-tight">Kazania</h2>
        <form
          className="mt-4 space-y-3 rounded-xl bg-surface p-3 shadow-[var(--shadow-border)]"
          onSubmit={(e) => {
            e.preventDefault();
            createNote.mutate();
          }}
        >
          <Input
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            placeholder="Tytuł notatki"
          />
          <Textarea
            value={noteBody}
            onChange={(e) => setNoteBody(e.target.value)}
            placeholder="Treść — krótka, konkretna."
          />
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={createNote.isPending}>
              Opublikuj
            </Button>
          </div>
        </form>
        <ul className="mt-6 space-y-4">
          {(domain.data?.notes ?? []).map((note) => (
            <li
              key={note.id}
              className="flex items-start justify-between gap-3 border-b border-border pb-4"
            >
              <div>
                <p className="font-display text-lg tracking-tight">{note.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-muted">{note.body}</p>
              </div>
              <button
                type="button"
                className="grid size-11 place-items-center text-muted hover:text-danger"
                onClick={() => deleteNote.mutate(note.id)}
                aria-label="Usuń notatkę"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function Treasury() {
  const budget = useQuery({
    queryKey: ["budget"],
    queryFn: () => getBudget(),
  });
  if (!budget.data) return null;
  return (
    <div className="mt-8 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
      <p className="font-mono text-xs tracking-[0.18em] text-subtle">
        Konto firmowe
      </p>
      <p className="mt-2 font-display text-3xl tracking-tight">
        {formatPieniazki(budget.data.firmBalance)}
      </p>
      <p className="mt-1 text-sm text-muted">
        {budget.data.firmLast4
          ? `Karta •••• ${budget.data.firmLast4}. `
          : "Bez pełnego numeru karty. "}
        {formatPieniazki(budget.data.causePot)} czeka na wspólny cel (5%).
      </p>
      <Button asChild className="mt-4" size="sm">
        <Link to="/budzet">Budżet</Link>
      </Button>
    </div>
  );
}

function FirmCardForm() {
  const budget = useQuery({
    queryKey: ["budget"],
    queryFn: () => getBudget(),
  });
  const queryClient = useQueryClient();
  const [holder, setHolder] = useState("");
  const [last4, setLast4] = useState("");
  const [iban, setIban] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!budget.data || ready) return;
    setHolder(budget.data.firmHolder);
    setLast4(budget.data.firmLast4);
    setIban(budget.data.firmIban);
    setReady(true);
  }, [budget.data, ready]);

  const save = useMutation({
    mutationFn: () => updateFirmAccount({ data: { holder, last4, iban } }),
    onSuccess: () => {
      toast.success("Konto firmowe zapisane. Bez pełnego numeru karty.");
      void queryClient.invalidateQueries({ queryKey: ["budget"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <form
      className="mt-6 space-y-4 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] md:p-5"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
    >
      <p className="font-mono text-xs tracking-[0.18em] text-subtle">
        Karta / przelew
      </p>
      <p className="text-sm text-muted">
        Nie wpisuj pełnego numeru karty. IBAN konta firmowego albo ostatnie 4
        cyfry.
      </p>
      <Field label="Właściciel konta" htmlFor="holder">
        <Input
          id="holder"
          value={holder}
          onChange={(e) => setHolder(e.target.value)}
          placeholder="Bartosz Nowak"
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Ostatnie 4 cyfry karty" htmlFor="last4">
          <Input
            id="last4"
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            value={last4}
            onChange={(e) => setLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="0000"
          />
        </Field>
        <Field label="IBAN" htmlFor="iban">
          <Input
            id="iban"
            autoComplete="off"
            value={iban}
            onChange={(e) => setIban(e.target.value.toUpperCase())}
            placeholder="PL00 0000 0000 0000 0000 0000 0000"
          />
        </Field>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={save.isPending}>
          Zapisz konto
        </Button>
      </div>
    </form>
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
