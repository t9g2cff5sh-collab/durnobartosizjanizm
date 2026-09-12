import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Paywall } from "@/components/paywall";
import { BoardShell } from "@/components/board-shell";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getDomainSnapshot } from "@/lib/domain";
import { getDuesStatus } from "@/lib/dues";
import {
  NOTICE_KINDS,
  addNotice,
  deleteNotice,
  getNotices,
  updateNotice,
  type Notice,
  type NoticeKind,
} from "@/lib/life";
import { useResolvedAuth } from "@/lib/use-resolved-auth";
import { appleMapsUrl, formatPlDate } from "@/lib/utils";

export const Route = createFileRoute("/tablica")({
  loader: () => getNotices(),
  component: TablicaPage,
});

function TablicaPage() {
  const initial = Route.useLoaderData();
  const { user, isSignedIn } = useResolvedAuth();
  const board = useQuery({
    queryKey: ["notices"],
    queryFn: () => getNotices(),
    initialData: initial,
    refetchInterval: 8000,
  });
  const domain = useQuery({
    queryKey: ["domain"],
    queryFn: () => getDomainSnapshot(),
  });
  const dues = useQuery({
    queryKey: ["dues"],
    queryFn: () => getDuesStatus(),
    enabled: isSignedIn,
  });
  const notices = board.data?.notices ?? [];
  const isFounder = Boolean(user) && domain.data?.founder?.userId === user?.id;
  const canPost = Boolean(dues.data?.paid);

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <BoardShell current="/tablica">
        {isSignedIn ? (
          canPost ? (
            <NoticeComposer />
          ) : (
            <Paywall action="powiesić ogłoszenie" />
          )
        ) : (
          <p className="text-sm text-muted">
            <Link to="/login" className="underline underline-offset-4">
              Wejdź
            </Link>
            , żeby powiesić ogłoszenie. Członkostwo: 10 Twoich pieniążków.
          </p>
        )}

        <div className="mt-10 grid gap-8 md:grid-cols-2">
          {NOTICE_KINDS.map((kind) => (
            <section key={kind.id} className="board-wall p-5 md:p-6">
              <h2 className="font-display text-2xl tracking-tight">{kind.label}</h2>
              <p className="text-sm text-subtle">{kind.hint}</p>
              <ul className="mt-4 space-y-3">
                {notices.filter((n) => n.kind === kind.id).length === 0 ? (
                  <li className="rounded-lg bg-surface-2 px-4 py-8 text-sm text-subtle">
                    Pusto
                  </li>
                ) : (
                  notices
                    .filter((n) => n.kind === kind.id)
                    .map((notice) => (
                      <NoticeCard
                        key={notice.id}
                        notice={notice}
                        canEdit={notice.userId === user?.id || isFounder}
                      />
                    ))
                )}
              </ul>
            </section>
          ))}
        </div>
      </BoardShell>
    </div>
  );
}

function NoticeComposer() {
  const queryClient = useQueryClient();
  const [kind, setKind] = useState<NoticeKind>("wyjazd");
  const [title, setTitle] = useState("");
  const [whenText, setWhenText] = useState("");
  const [place, setPlace] = useState("");
  const [body, setBody] = useState("");

  const add = useMutation({
    mutationFn: () =>
      addNotice({ data: { kind, title, body, place, whenText } }),
    onSuccess: () => {
      setTitle("");
      setWhenText("");
      setPlace("");
      setBody("");
      toast.success("Wisi.");
      void queryClient.invalidateQueries({ queryKey: ["notices"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <form
      className="space-y-3 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]"
      onSubmit={(e) => {
        e.preventDefault();
        add.mutate();
      }}
    >
      <div className="flex gap-2">
        {NOTICE_KINDS.map((item) => (
          <Button
            key={item.id}
            type="button"
            size="sm"
            variant={kind === item.id ? "primary" : "outline"}
            onClick={() => setKind(item.id)}
          >
            {item.label}
          </Button>
        ))}
      </div>
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Tytuł"
        required
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          value={whenText}
          onChange={(e) => setWhenText(e.target.value)}
          placeholder="Kiedy"
        />
        <Input
          value={place}
          onChange={(e) => setPlace(e.target.value)}
          placeholder="Gdzie"
        />
      </div>
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Szczegóły — kto, po co, co zabrać."
        className="min-h-24"
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={add.isPending || !title.trim()}>
          Powieś
        </Button>
      </div>
    </form>
  );
}

function NoticeCard({
  notice,
  canEdit,
}: {
  notice: Notice;
  canEdit: boolean;
}) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [kind, setKind] = useState<NoticeKind>(notice.kind);
  const [title, setTitle] = useState(notice.title);
  const [whenText, setWhenText] = useState(notice.whenText);
  const [place, setPlace] = useState(notice.place);
  const [body, setBody] = useState(notice.body);

  const remove = useMutation({
    mutationFn: () => deleteNotice({ data: { id: notice.id } }),
    onSuccess: () => {
      toast.success("Zdjęte.");
      void queryClient.invalidateQueries({ queryKey: ["notices"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const save = useMutation({
    mutationFn: () =>
      updateNotice({
        data: { id: notice.id, kind, title, body, place, whenText },
      }),
    onSuccess: () => {
      toast.success("Wpis poprawiony.");
      setEditing(false);
      void queryClient.invalidateQueries({ queryKey: ["notices"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (editing) {
    return (
      <li className="rounded-lg bg-surface-2 p-4">
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <div className="flex gap-2">
            {NOTICE_KINDS.map((item) => (
              <Button
                key={item.id}
                type="button"
                size="sm"
                variant={kind === item.id ? "primary" : "outline"}
                onClick={() => setKind(item.id)}
              >
                {item.label}
              </Button>
            ))}
          </div>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              value={whenText}
              onChange={(e) => setWhenText(e.target.value)}
              placeholder="Kiedy"
            />
            <Input
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              placeholder="Gdzie"
            />
          </div>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="min-h-24"
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setEditing(false)}
            >
              Anuluj
            </Button>
            <Button type="submit" disabled={save.isPending || !title.trim()}>
              Zapisz
            </Button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="rounded-lg bg-surface-2 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl tracking-tight">{notice.title}</h3>
          <p className="mt-1 text-xs text-subtle">
            {notice.authorName}
            {notice.createdAt ? ` · ${formatPlDate(notice.createdAt)}` : ""}
            {notice.updatedAt ? " · poprawione" : ""}
          </p>
        </div>
        {canEdit ? (
          <div className="flex shrink-0">
            <button
              type="button"
              className="grid size-11 place-items-center text-muted hover:text-fg"
              onClick={() => {
                setKind(notice.kind);
                setTitle(notice.title);
                setWhenText(notice.whenText);
                setPlace(notice.place);
                setBody(notice.body);
                setEditing(true);
              }}
              aria-label="Popraw wpis"
            >
              <Pencil className="size-4" />
            </button>
            <button
              type="button"
              className="grid size-11 place-items-center text-muted hover:text-danger"
              onClick={() => remove.mutate()}
              aria-label="Usuń ogłoszenie"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ) : null}
      </div>
      {notice.whenText || notice.place ? (
        <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
          {notice.whenText ? <span>{notice.whenText}</span> : null}
          {notice.place ? (
            <a
              href={appleMapsUrl(notice.place)}
              className="inline-flex items-center gap-1.5 underline-offset-4 hover:underline"
            >
              <MapPin className="size-3.5" />
              {notice.place}
            </a>
          ) : null}
        </p>
      ) : null}
      {notice.body ? (
        <p className="mt-2 whitespace-pre-wrap text-sm text-fg">{notice.body}</p>
      ) : null}
    </li>
  );
}
