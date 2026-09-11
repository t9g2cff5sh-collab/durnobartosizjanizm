import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";

export const NOTICE_KINDS = [
  { id: "wyjazd", label: "Wyjazd", hint: "Dokąd i kiedy ruszamy" },
  { id: "zaproszenie", label: "Zaproszenie", hint: "Kogo wołamy i po co" },
] as const;

export type NoticeKind = (typeof NOTICE_KINDS)[number]["id"];

export type Notice = {
  id: number;
  userId: string;
  authorName: string;
  kind: NoticeKind;
  title: string;
  body: string;
  place: string;
  whenText: string;
  createdAt: string;
  updatedAt: string | null;
};

export type TrackMeta = {
  id: number;
  userId: string;
  authorName: string;
  title: string;
  mime: string;
  durationMs: number;
  createdAt: string;
  updatedAt: string | null;
};

function asIso(value: string | Date): string {
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toISOString();
}

function asIsoOrNull(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  return asIso(value);
}

function forbid(message: string): never {
  const error = new Error(message) as Error & { status: number };
  error.status = 403;
  throw error;
}

function parseKind(value: string): NoticeKind {
  if (value === "wyjazd" || value === "zaproszenie") return value;
  throw new Error("Nieznany rodzaj ogłoszenia.");
}

async function authorName(sql: Awaited<ReturnType<typeof import("@/lib/db").getSql>>, userId: string) {
  const [profile] = await sql<{ display_name: string }>`
    select display_name from profiles where user_id = ${userId}
  `;
  return profile?.display_name || "Wyznawca";
}

async function canModerate(
  sql: Awaited<ReturnType<typeof import("@/lib/db").getSql>>,
  userId: string,
  ownerId: string,
) {
  if (ownerId === userId) return true;
  const [claim] = await sql<{ founder_user_id: string }>`
    select founder_user_id from domain_claim where id = 1
  `;
  return claim?.founder_user_id === userId;
}

export const getNotices = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ notices: Notice[] }> => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<{
      id: number;
      user_id: string;
      author_name: string;
      kind: string;
      title: string;
      body: string;
      place: string;
      when_text: string;
      created_at: string | Date;
      updated_at: string | Date | null;
    }>`
      select id, user_id, author_name, kind, title, body, place, when_text, created_at, updated_at
      from notices
      order by created_at desc, id desc
      limit 80
    `;
    return {
      notices: rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        authorName: row.author_name,
        kind: parseKind(row.kind),
        title: row.title,
        body: row.body,
        place: row.place,
        whenText: row.when_text,
        createdAt: asIso(row.created_at),
        updatedAt: asIsoOrNull(row.updated_at),
      })),
    };
  },
);

export const addNotice = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: {
    kind: string;
    title: string;
    body?: string;
    place?: string;
    whenText?: string;
  }) => ({
    kind: parseKind(input.kind),
    title: input.title.trim().slice(0, 120),
    body: (input.body ?? "").trim().slice(0, 800),
    place: (input.place ?? "").trim().slice(0, 80),
    whenText: (input.whenText ?? "").trim().slice(0, 80),
  }))
  .handler(async ({ context, data }) => {
    if (!data.title) throw new Error("Ogłoszenie potrzebuje tytułu.");
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const { requirePaid } = await import("@/lib/dues");
    await requirePaid(sql, context.userId);
    const name = await authorName(sql, context.userId);
    const [row] = await sql<{ id: number }>`
      insert into notices (user_id, author_name, kind, title, body, place, when_text)
      values (
        ${context.userId},
        ${name},
        ${data.kind},
        ${data.title},
        ${data.body},
        ${data.place},
        ${data.whenText}
      )
      returning id
    `;
    return { id: row.id };
  });

export const updateNotice = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: {
    id: number;
    kind: string;
    title: string;
    body?: string;
    place?: string;
    whenText?: string;
  }) => ({
    id: Number(input.id),
    kind: parseKind(input.kind),
    title: input.title.trim().slice(0, 120),
    body: (input.body ?? "").trim().slice(0, 800),
    place: (input.place ?? "").trim().slice(0, 80),
    whenText: (input.whenText ?? "").trim().slice(0, 80),
  }))
  .handler(async ({ context, data }) => {
    if (!data.title) throw new Error("Ogłoszenie potrzebuje tytułu.");
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const { requirePaid } = await import("@/lib/dues");
    await requirePaid(sql, context.userId);
    const [row] = await sql<{ id: number; user_id: string }>`
      select id, user_id from notices where id = ${data.id}
    `;
    if (!row) throw new Error("Nie ma takiego ogłoszenia.");
    if (!(await canModerate(sql, context.userId, row.user_id))) {
      forbid("Możesz poprawić tylko swój wpis.");
    }
    await sql`
      update notices
      set kind = ${data.kind},
          title = ${data.title},
          body = ${data.body},
          place = ${data.place},
          when_text = ${data.whenText},
          updated_at = now()
      where id = ${data.id}
    `;
    return { ok: true as const };
  });

export const deleteNotice = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: number }) => ({ id: Number(input.id) }))
  .handler(async ({ context, data }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const [row] = await sql<{ id: number; user_id: string }>`
      select id, user_id from notices where id = ${data.id}
    `;
    if (!row) return { ok: true as const };
    if (!(await canModerate(sql, context.userId, row.user_id))) {
      forbid("Możesz zdjąć tylko swoje ogłoszenie.");
    }
    await sql`delete from notices where id = ${data.id}`;
    return { ok: true as const };
  });

export const getTracks = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ tracks: TrackMeta[] }> => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<{
      id: number;
      user_id: string;
      author_name: string;
      title: string;
      mime: string;
      duration_ms: number;
      created_at: string | Date;
      updated_at: string | Date | null;
    }>`
      select id, user_id, author_name, title, mime, duration_ms, created_at, updated_at
      from tracks
      order by created_at desc, id desc
      limit 40
    `;
    return {
      tracks: rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        authorName: row.author_name,
        title: row.title,
        mime: row.mime,
        durationMs: Number(row.duration_ms),
        createdAt: asIso(row.created_at),
        updatedAt: asIsoOrNull(row.updated_at),
      })),
    };
  },
);

export const getTrackAudio = createServerFn({ method: "GET" })
  .validator((input: { id: number }) => ({ id: Number(input.id) }))
  .handler(async ({ data }): Promise<{ mime: string; audioB64: string }> => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const [row] = await sql<{ mime: string; audio_b64: string }>`
      select mime, audio_b64 from tracks where id = ${data.id}
    `;
    if (!row) throw new Error("Nie ma takiego kawałka.");
    return { mime: row.mime, audioB64: row.audio_b64 };
  });

const ALLOWED_MIME = ["audio/webm", "audio/mp4", "audio/ogg", "audio/mpeg", "audio/wav"];

export const addTrack = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: {
    title: string;
    mime: string;
    durationMs: number;
    audioB64: string;
  }) => {
    const mime = input.mime.split(";")[0]?.trim() || "";
    if (!ALLOWED_MIME.includes(mime)) throw new Error("Ten format dźwięku nie wejdzie.");
    const audioB64 = input.audioB64.replace(/\s/g, "");
    if (audioB64.length < 80) throw new Error("Nagranie jest puste.");
    if (audioB64.length > 700_000) throw new Error("Kawałek za długi — max ok. 45 sekund.");
    const durationMs = Math.round(Number(input.durationMs));
    if (durationMs < 400 || durationMs > 50_000) {
      throw new Error("Kawałek ma trwać od chwili do 45 sekund.");
    }
    return {
      title: input.title.trim().slice(0, 80) || "Bez tytułu",
      mime,
      durationMs,
      audioB64,
    };
  })
  .handler(async ({ context, data }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const { requirePaid } = await import("@/lib/dues");
    await requirePaid(sql, context.userId);
    const name = await authorName(sql, context.userId);
    const [row] = await sql<{ id: number }>`
      insert into tracks (user_id, author_name, title, mime, duration_ms, audio_b64)
      values (
        ${context.userId},
        ${name},
        ${data.title},
        ${data.mime},
        ${data.durationMs},
        ${data.audioB64}
      )
      returning id
    `;
    return { id: row.id };
  });

export const updateTrack = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: number; title: string }) => ({
    id: Number(input.id),
    title: input.title.trim().slice(0, 80) || "Bez tytułu",
  }))
  .handler(async ({ context, data }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const { requirePaid } = await import("@/lib/dues");
    await requirePaid(sql, context.userId);
    const [row] = await sql<{ id: number; user_id: string }>`
      select id, user_id from tracks where id = ${data.id}
    `;
    if (!row) throw new Error("Nie ma takiego kawałka.");
    if (!(await canModerate(sql, context.userId, row.user_id))) {
      forbid("Możesz poprawić tylko swój kawałek.");
    }
    await sql`
      update tracks
      set title = ${data.title},
          updated_at = now()
      where id = ${data.id}
    `;
    return { ok: true as const };
  });

export const deleteTrack = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: number }) => ({ id: Number(input.id) }))
  .handler(async ({ context, data }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const [row] = await sql<{ id: number; user_id: string }>`
      select id, user_id from tracks where id = ${data.id}
    `;
    if (!row) return { ok: true as const };
    if (!(await canModerate(sql, context.userId, row.user_id))) {
      forbid("Możesz zdjąć tylko swój kawałek.");
    }
    await sql`delete from tracks where id = ${data.id}`;
    return { ok: true as const };
  });
