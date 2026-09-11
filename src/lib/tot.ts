import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";

export const TOT_COLUMNS = [
  { id: "iskry", label: "Iskry", hint: "Nowe myśli" },
  { id: "tok", label: "W toku", hint: "Ktoś to ciągnie" },
  { id: "czeka", label: "Czeka", hint: "Zatrzymane" },
  { id: "gotowe", label: "Gotowe", hint: "Domknięte" },
] as const;

export type TotColumnId = (typeof TOT_COLUMNS)[number]["id"];

const COLUMN_IDS: readonly TotColumnId[] = TOT_COLUMNS.map((c) => c.id);

export type TotCard = {
  id: number;
  userId: string;
  authorName: string;
  title: string;
  body: string;
  columnId: TotColumnId;
  sortOrder: number;
  createdAt: string;
  updatedAt: string | null;
};

function asIso(value: string | Date): string {
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toISOString();
}

function parseColumn(value: string): TotColumnId {
  if ((COLUMN_IDS as readonly string[]).includes(value)) return value as TotColumnId;
  throw new Error("Nieznana kolumna tablicy.");
}

function forbid(message: string): never {
  const error = new Error(message) as Error & { status: number };
  error.status = 403;
  throw error;
}

type CardRow = {
  id: number;
  user_id: string;
  author_name: string;
  title: string;
  body: string;
  column_id: string;
  sort_order: number;
  created_at: string | Date;
  updated_at: string | Date | null;
};

function toCard(row: CardRow): TotCard {
  return {
    id: row.id,
    userId: row.user_id,
    authorName: row.author_name,
    title: row.title,
    body: row.body,
    columnId: parseColumn(row.column_id),
    sortOrder: Number(row.sort_order),
    createdAt: asIso(row.created_at),
    updatedAt: row.updated_at ? asIso(row.updated_at) : null,
  };
}

export const getTotBoard = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ cards: TotCard[] }> => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<CardRow>`
      select id, user_id, author_name, title, body, column_id, sort_order, created_at, updated_at
      from tot_cards
      order by sort_order asc, id asc
    `;
    return { cards: rows.map(toCard) };
  },
);

export const addTotCard = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { title: string; body?: string; columnId: string }) => ({
    title: input.title.trim().slice(0, 120),
    body: (input.body ?? "").trim().slice(0, 1000),
    columnId: parseColumn(input.columnId),
  }))
  .handler(async ({ context, data }) => {
    if (!data.title) throw new Error("Karta potrzebuje tytułu.");
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const { requirePaid } = await import("@/lib/dues");
    await requirePaid(sql, context.userId);
    const [profile] = await sql<{ display_name: string }>`
      select display_name from profiles where user_id = ${context.userId}
    `;
    const authorName = profile?.display_name || "Gość";
    const [row] = await sql<{ id: number }>`
      insert into tot_cards (user_id, author_name, title, body, column_id, sort_order)
      values (
        ${context.userId},
        ${authorName},
        ${data.title},
        ${data.body},
        ${data.columnId},
        (select coalesce(max(sort_order), 0) + 1 from tot_cards where column_id = ${data.columnId})
      )
      returning id
    `;
    return { id: row.id };
  });

export const updateTotCard = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: number; title: string; body?: string }) => ({
    id: Number(input.id),
    title: input.title.trim().slice(0, 120),
    body: (input.body ?? "").trim().slice(0, 1000),
  }))
  .handler(async ({ context, data }) => {
    if (!data.title) throw new Error("Karta potrzebuje tytułu.");
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const { requirePaid } = await import("@/lib/dues");
    await requirePaid(sql, context.userId);
    const [card] = await sql<{ id: number; user_id: string }>`
      select id, user_id from tot_cards where id = ${data.id}
    `;
    if (!card) throw new Error("Nie ma takiej karty.");
    const [claim] = await sql<{ founder_user_id: string }>`
      select founder_user_id from domain_claim where id = 1
    `;
    const isOwner = card.user_id === context.userId;
    const isFounder = claim?.founder_user_id === context.userId;
    if (!isOwner && !isFounder) forbid("Możesz poprawić tylko swoją kartę.");
    await sql`
      update tot_cards
      set title = ${data.title},
          body = ${data.body},
          updated_at = now()
      where id = ${data.id}
    `;
    return { ok: true as const };
  });

export const moveTotCard = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: number; columnId: string }) => ({
    id: Number(input.id),
    columnId: parseColumn(input.columnId),
  }))
  .handler(async ({ context, data }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const { requirePaid } = await import("@/lib/dues");
    await requirePaid(sql, context.userId);
    const [card] = await sql<{ id: number }>`
      select id from tot_cards where id = ${data.id}
    `;
    if (!card) throw new Error("Nie ma takiej karty.");
    const [profile] = await sql<{ user_id: string }>`
      select user_id from profiles where user_id = ${context.userId}
    `;
    if (!profile) forbid("Najpierw załóż konto na domenie.");
    const [tail] = await sql<{ n: number }>`
      select coalesce(max(sort_order), 0)::int as n
      from tot_cards
      where column_id = ${data.columnId} and id <> ${data.id}
    `;
    const nextOrder = Number(tail?.n ?? 0) + 1;
    await sql`
      update tot_cards
      set column_id = ${data.columnId},
          sort_order = ${nextOrder}
      where id = ${data.id}
    `;
    return { ok: true as const };
  });

export const deleteTotCard = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: number }) => ({ id: Number(input.id) }))
  .handler(async ({ context, data }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const [card] = await sql<{ id: number; user_id: string }>`
      select id, user_id from tot_cards where id = ${data.id}
    `;
    if (!card) return { ok: true as const };
    const [claim] = await sql<{ founder_user_id: string }>`
      select founder_user_id from domain_claim where id = 1
    `;
    const isOwner = card.user_id === context.userId;
    const isFounder = claim?.founder_user_id === context.userId;
    if (!isOwner && !isFounder) forbid("Możesz usunąć tylko swoją kartę.");
    await sql`delete from tot_cards where id = ${data.id}`;
    return { ok: true as const };
  });
