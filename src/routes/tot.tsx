import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useResolvedAuth } from "@/lib/use-resolved-auth";
import { getDomainSnapshot } from "@/lib/domain";
import { getDuesStatus } from "@/lib/dues";
import {
  TOT_COLUMNS,
  addTotCard,
  deleteTotCard,
  getTotBoard,
  moveTotCard,
  updateTotCard,
  type TotCard,
  type TotColumnId,
} from "@/lib/tot";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/tot")({
  loader: () => getTotBoard(),
  component: TotBoardPage,
});

function TotBoardPage() {
  const initial = Route.useLoaderData();
  const { user, isSignedIn } = useResolvedAuth();
  const queryClient = useQueryClient();
  const board = useQuery({
    queryKey: ["tot"],
    queryFn: () => getTotBoard(),
    initialData: initial,
    refetchInterval: 5000,
  });
  const domain = useQuery({
    queryKey: ["domain"],
    queryFn: () => getDomainSnapshot(),
  });
  const [mobileColumn, setMobileColumn] = useState<TotColumnId>("iskry");
  const [adding, setAdding] = useState<TotColumnId | null>(null);
  const cards = board.data?.cards ?? [];
  const isFounder = Boolean(user) && domain.data?.founder?.userId === user?.id;
  const dues = useQuery({
    queryKey: ["dues"],
    queryFn: () => getDuesStatus(),
    enabled: isSignedIn,
  });
  const canPost = Boolean(dues.data?.paid);

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1 px-5 pb-16 md:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4 pt-2">
          <div>
            <p className="font-mono text-xs tracking-[0.18em] text-subtle">
              Synod · ToT
            </p>
            <h1 className="mt-2 font-display text-4xl tracking-tight md:text-5xl">
              Tablica ToT
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted">
              Jedyny synod DurnoBartosizjanizmu. Członkostwo: 10 Twoich
              pieniążków — potem karty. Wpis można poprawić.
            </p>
          </div>
          {!isSignedIn ? (
            <Button asChild variant="outline">
              <Link to="/login">Wejdź do chóru</Link>
            </Button>
          ) : !canPost ? (
            <Button asChild>
              <Link to="/skladka">Składka</Link>
            </Button>
          ) : null}
        </div>

        <div className="mt-6 flex gap-1 overflow-x-auto pb-1 xl:hidden">
          {TOT_COLUMNS.map((col) => (
            <button
              key={col.id}
              type="button"
              onClick={() => setMobileColumn(col.id)}
              className={cn(
                "h-11 shrink-0 rounded-md px-4 text-sm",
                mobileColumn === col.id
                  ? "bg-accent text-accent-fg"
                  : "text-muted shadow-[var(--shadow-border)]",
              )}
            >
              {col.label}
              <span className="ml-2 font-mono text-xs tabular-nums opacity-70">
                {cards.filter((c) => c.columnId === col.id).length}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-6 hidden gap-4 xl:grid xl:grid-cols-4">
          {TOT_COLUMNS.map((col) => (
            <BoardColumn
              key={col.id}
              column={col}
              cards={cards.filter((c) => c.columnId === col.id)}
              isSignedIn={canPost}
              userId={user?.id ?? null}
              isFounder={isFounder}
              adding={adding === col.id}
              onToggleAdd={() =>
                setAdding((v) => (v === col.id ? null : col.id))
              }
              onAdded={() => {
                setAdding(null);
                void queryClient.invalidateQueries({ queryKey: ["tot"] });
              }}
            />
          ))}
        </div>

        <div className="mt-6 xl:hidden">
          {TOT_COLUMNS.filter((c) => c.id === mobileColumn).map((col) => (
            <BoardColumn
              key={col.id}
              column={col}
              cards={cards.filter((c) => c.columnId === col.id)}
              isSignedIn={canPost}
              userId={user?.id ?? null}
              isFounder={isFounder}
              adding={adding === col.id}
              onToggleAdd={() =>
                setAdding((v) => (v === col.id ? null : col.id))
              }
              onAdded={() => {
                setAdding(null);
                void queryClient.invalidateQueries({ queryKey: ["tot"] });
              }}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

function BoardColumn({
  column,
  cards,
  isSignedIn,
  userId,
  isFounder,
  adding,
  onToggleAdd,
  onAdded,
}: {
  column: (typeof TOT_COLUMNS)[number];
  cards: TotCard[];
  isSignedIn: boolean;
  userId: string | null;
  isFounder: boolean;
  adding: boolean;
  onToggleAdd: () => void;
  onAdded: () => void;
}) {
  const queryClient = useQueryClient();
  const [dragOver, setDragOver] = useState(false);
  const move = useMutation({
    mutationFn: (input: { id: number; columnId: TotColumnId }) =>
      moveTotCard({ data: input }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["tot"] }),
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <section
      className={cn(
        "flex min-h-72 flex-col rounded-xl bg-surface p-3 shadow-[var(--shadow-border)]",
        dragOver && "shadow-[var(--shadow-border-hover)]",
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const id = Number(e.dataTransfer.getData("text/tot-card"));
        if (!id || !isSignedIn) return;
        move.mutate({ id, columnId: column.id });
      }}
    >
      <header className="flex items-start justify-between gap-2 px-1 pt-1">
        <div>
          <h2 className="font-display text-xl tracking-tight">{column.label}</h2>
          <p className="text-xs text-subtle">{column.hint}</p>
        </div>
        <span className="font-mono text-xs tabular-nums text-subtle">
          {cards.length}
        </span>
      </header>

      <ul className="mt-3 flex flex-1 flex-col gap-2">
        {cards.length === 0 ? (
          <li className="rounded-md px-3 py-8 text-center text-sm text-subtle">
            Pusto
          </li>
        ) : (
          cards.map((card) => (
            <TotCardItem
              key={card.id}
              card={card}
              canMove={isSignedIn}
              canRewrite={card.userId === userId || isFounder}
            />
          ))
        )}
      </ul>

      {isSignedIn ? (
        adding ? (
          <AddCardForm
            columnId={column.id}
            onCancel={onToggleAdd}
            onAdded={onAdded}
          />
        ) : (
          <Button
            type="button"
            variant="ghost"
            className="mt-3 w-full"
            onClick={onToggleAdd}
          >
            <Plus className="size-4" />
            Karta
          </Button>
        )
      ) : null}
    </section>
  );
}

function TotCardItem({
  card,
  canMove,
  canRewrite,
}: {
  card: TotCard;
  canMove: boolean;
  canRewrite: boolean;
}) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(card.title);
  const [body, setBody] = useState(card.body);
  const index = TOT_COLUMNS.findIndex((c) => c.id === card.columnId);
  const prev = index > 0 ? TOT_COLUMNS[index - 1] : null;
  const next = index < TOT_COLUMNS.length - 1 ? TOT_COLUMNS[index + 1] : null;

  const move = useMutation({
    mutationFn: (columnId: TotColumnId) =>
      moveTotCard({ data: { id: card.id, columnId } }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["tot"] }),
    onError: (err: Error) => toast.error(err.message),
  });

  const remove = useMutation({
    mutationFn: () => deleteTotCard({ data: { id: card.id } }),
    onSuccess: () => {
      toast.success("Karta zdjęta.");
      void queryClient.invalidateQueries({ queryKey: ["tot"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const save = useMutation({
    mutationFn: () => updateTotCard({ data: { id: card.id, title, body } }),
    onSuccess: () => {
      toast.success("Wpis poprawiony.");
      setEditing(false);
      void queryClient.invalidateQueries({ queryKey: ["tot"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (editing) {
    return (
      <li className="rounded-md bg-surface-2 p-3 shadow-[var(--shadow-border)]">
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="min-h-20"
          />
          <div className="flex justify-end gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setEditing(false)}
            >
              Anuluj
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={save.isPending || !title.trim()}
            >
              Zapisz
            </Button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li
      draggable={canMove}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/tot-card", String(card.id));
        e.dataTransfer.effectAllowed = "move";
      }}
      className="rounded-md bg-surface-2 p-3 shadow-[var(--shadow-border)]"
    >
      <p className="text-sm font-medium text-fg">{card.title}</p>
      {card.body ? (
        <p className="mt-1 whitespace-pre-wrap text-sm text-muted">{card.body}</p>
      ) : null}
      <p className="mt-2 text-xs text-subtle">
        {card.authorName}
        {card.updatedAt ? " · poprawione" : ""}
      </p>
      {canMove || canRewrite ? (
        <div className="mt-2 flex items-center gap-1">
          {canMove ? (
            <>
              <button
                type="button"
                className="grid size-11 place-items-center text-muted disabled:opacity-30"
                disabled={!prev || move.isPending}
                onClick={() => prev && move.mutate(prev.id)}
                aria-label="Wstecz"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                className="grid size-11 place-items-center text-muted disabled:opacity-30"
                disabled={!next || move.isPending}
                onClick={() => next && move.mutate(next.id)}
                aria-label="Dalej"
              >
                <ChevronRight className="size-4" />
              </button>
            </>
          ) : null}
          {canRewrite ? (
            <>
              <button
                type="button"
                className="ml-auto grid size-11 place-items-center text-muted hover:text-fg"
                onClick={() => {
                  setTitle(card.title);
                  setBody(card.body);
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
                aria-label="Usuń kartę"
              >
                <Trash2 className="size-4" />
              </button>
            </>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

function AddCardForm({
  columnId,
  onCancel,
  onAdded,
}: {
  columnId: TotColumnId;
  onCancel: () => void;
  onAdded: () => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const add = useMutation({
    mutationFn: () => addTotCard({ data: { title, body, columnId } }),
    onSuccess: () => {
      setTitle("");
      setBody("");
      toast.success("Karta na tablicy.");
      onAdded();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <form
      className="mt-3 space-y-2 rounded-md bg-surface-2 p-2"
      onSubmit={(e) => {
        e.preventDefault();
        add.mutate();
      }}
    >
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Tytuł karty"
        required
        autoFocus
      />
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Opcjonalnie krótki opis"
        className="min-h-20"
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Anuluj
        </Button>
        <Button type="submit" size="sm" disabled={add.isPending || !title.trim()}>
          Dodaj
        </Button>
      </div>
    </form>
  );
}
