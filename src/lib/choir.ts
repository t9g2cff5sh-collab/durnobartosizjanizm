import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { requirePaid } from "@/lib/dues";
import { CHANNELS, HOST_NAME, PIERWOKUP_KINDS, SURPRISE_CARDS, TABLE_HOST_NAME, isBoziaName, isMonitorName, type PierwokupKind } from "@/lib/world";


export type DayItem = {
  id: number;
  userId: string;
  authorName: string;
  body: string;
  status: "plan" | "zrobione" | "otwarte";
  createdAt: string;
};

export type Guest = {
  id: number;
  nick: string;
  channel: string;
  status: "czeka" | "wpuszczony" | "odmowa";
  createdAt: string;
};

export type Letter = {
  id: number;
  userId: string;
  authorName: string;
  body: string;
  status: "draft" | "sent";
  createdAt: string;
};

export type RozumieHit = {
  id: number;
  sentence: string;
  reply: string;
  createdAt: string;
};

export type Surprise = {
  id: number;
  authorName: string;
  card: string;
  createdAt: string;
};

export type SharedSong = {
  id: number;
  userId: string;
  authorName: string;
  lyrics: string;
  bit: string;
  status: "draft" | "swiat";
  createdAt: string;
};

export type Preemption = {
  id: number;
  authorName: string;
  kind: PierwokupKind;
  title: string;
  songId: number | null;
  status: "czeka" | "wzial" | "oddane";
  createdAt: string;
};

export type HostSeat = {
  name: string;
  isHost: boolean;
};

export type TableSeat = {
  name: string;
  isTableHost: boolean;
};

function asIso(value: string | Date): string {
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toISOString();
}

function forbid(message: string): never {
  const error = new Error(message) as Error & { status: number };
  error.status = 403;
  throw error;
}

type Sql = Awaited<ReturnType<typeof import("@/lib/db").getSql>>;

async function nameOf(sql: Sql, userId: string) {
  const [profile] = await sql<{ display_name: string }>`
    select display_name from profiles where user_id = ${userId}
  `;
  return profile?.display_name || "Wyznawca";
}

function namedMonitor(name: string | null | undefined) {
  return isMonitorName(name);
}

export async function isHost(sql: Sql, userId: string) {
  const [profile] = await sql<{ display_name: string }>`
    select display_name from profiles where user_id = ${userId}
  `;
  if (namedMonitor(profile?.display_name)) return true;
  const [user] = await sql<{ name: string }>`
    select name from "user" where id = ${userId}
  `;
  if (namedMonitor(user?.name)) return true;
  const [seated] = await sql<{ n: number }>`
    select count(*)::int as n from profiles
    where lower(btrim(display_name)) = lower(${HOST_NAME})
  `;
  if (Number(seated?.n ?? 0) > 0) return false;
  const [claim] = await sql<{ founder_user_id: string }>`
    select founder_user_id from domain_claim where id = 1
  `;
  return claim?.founder_user_id === userId;
}

export async function isTableHost(sql: Sql, userId: string) {
  const [profile] = await sql<{ display_name: string }>`
    select display_name from profiles where user_id = ${userId}
  `;
  if (isBoziaName(profile?.display_name)) return true;
  const [user] = await sql<{ name: string }>`
    select name from "user" where id = ${userId}
  `;
  if (isBoziaName(user?.name)) return true;
  const names = await sql<{ display_name: string }>`
    select display_name from profiles
  `;
  if (names.some((row) => isBoziaName(row.display_name))) return false;
  const [claim] = await sql<{ founder_user_id: string }>`
    select founder_user_id from domain_claim where id = 1
  `;
  return claim?.founder_user_id === userId;
}

async function requireHost(sql: Sql, userId: string) {
  if (await isHost(sql, userId)) return;
  forbid(`Tylko ${HOST_NAME} wpuszcza i bierze pierwokup.`);
}

export async function requireTableHost(sql: Sql, userId: string) {
  if (await isTableHost(sql, userId)) return;
  forbid(`Tylko ${TABLE_HOST_NAME} pieczętuje stół.`);
}


export function concretize(sentence: string): string {
  const t = sentence.trim().replace(/\s+/g, " ").slice(0, 280);
  if (!t) return "Jedno zdanie. Potem konkret.";
  const s = t.toLowerCase();
  if (/brawo|super|extra|piękn|kocham|wow/.test(s)) {
    return "Bez brawo. Co jest do zrobienia — jedno zdanie.";
  }
  if (/heha/.test(s)) {
    return "Nie ma Heha. Zamiana i powrót czasowy to lore, nie magia.";
  }
  if (/wpuśc|meet|host|monitor/.test(s)) {
    return `Hostem zostaje ${HOST_NAME}. Do tego czasu: puk. Nie dzwonek.`;
  }
  if (/kredo|credo|wyznan/.test(s)) {
    return "Każdy należący posiada własne kredo. Cudze nie obowiązuje.";
  }
  if (/bozi|bozie|stoł|księg/.test(s)) {
    return `${TABLE_HOST_NAME} pieczętuje stół. Podpis czeka. Herbata parzy się sama.`;
  }
  if (/hurtem|nierazem/.test(s)) {
    return "Nie hurtem. Jedne drzwi, jedna osoba. Monitor wpuszcza. Bozia sadza.";
  }

  if (/pienią|kas[ayę]|przelew|blik|złot/.test(s)) {
    return "Zero kasy przy gościach. Składka jest w świecie, nie przy drzwiach.";
  }
  if (/hasł|bit|beat|kawał/.test(s)) {
    return "Bit na hasło. Generator stoi w studio. Zero kazania.";
  }
  if (/ociosow|domofon|puk|dzwon/.test(s)) {
    return "Ociosowa 44/14. Domofon martwy = pukaj. Nierazem.";
  }
  if (/\?/.test(t)) {
    return "Pytanie przyjęte. Odpowiedź: spójrz w kodeks, potem jeden krok.";
  }
  return `Przyjęte: „${t}”. Następny krok — jeden, konkretny, bez salwy.`;
}

export const getDayLog = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ items: DayItem[] }> => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<{
      id: number;
      user_id: string;
      author_name: string;
      body: string;
      status: DayItem["status"];
      created_at: string | Date;
    }>`
      select id, user_id, author_name, body, status, created_at
      from day_log
      order by created_at desc, id desc
      limit 80
    `;
    return {
      items: rows.map((r) => ({
        id: r.id,
        userId: r.user_id,
        authorName: r.author_name,
        body: r.body,
        status: r.status,
        createdAt: asIso(r.created_at),
      })),
    };
  },
);

export const addDayItem = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { body?: string }) => ({
    body: (input.body ?? "").trim().slice(0, 200),
  }))
  .handler(async ({ context, data }) => {
    if (!data.body) throw new Error("Wpisz plan. Bez kazania.");
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await requirePaid(sql, context.userId);
    const author = await nameOf(sql, context.userId);
    await sql`
      insert into day_log (user_id, author_name, body, status)
      values (${context.userId}, ${author}, ${data.body}, 'plan')
    `;
    return { ok: true as const };
  });

export const moveDayItem = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id?: number; status?: string }) => ({
    id: Number(input.id),
    status: input.status === "zrobione" || input.status === "otwarte" || input.status === "plan"
      ? input.status
      : null,
  }))
  .handler(async ({ context, data }) => {
    if (!data.id || !data.status) throw new Error("Zły ruch.");
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await requirePaid(sql, context.userId);
    const [row] = await sql<{ user_id: string }>`
      select user_id from day_log where id = ${data.id}
    `;
    if (!row) throw new Error("Nie ma takiego wpisu.");
    const [claim] = await sql<{ founder_user_id: string }>`
      select founder_user_id from domain_claim where id = 1
    `;
    if (row.user_id !== context.userId && claim?.founder_user_id !== context.userId) {
      forbid("Tylko swój dziennik, albo prorok.");
    }
    await sql`update day_log set status = ${data.status} where id = ${data.id}`;
    return { ok: true as const };
  });

export const getGuests = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ guests: Guest[] }> => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<{
      id: number;
      nick: string;
      channel: string;
      status: Guest["status"];
      created_at: string | Date;
    }>`
      select id, nick, channel, status, created_at
      from guests
      order by created_at desc, id desc
      limit 60
    `;
    return {
      guests: rows.map((r) => ({
        id: r.id,
        nick: r.nick,
        channel: r.channel,
        status: r.status,
        createdAt: asIso(r.created_at),
      })),
    };
  },
);

export const addGuest = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { nick?: string; channel?: string }) => ({
    nick: (input.nick ?? "").trim().slice(0, 40),
    channel: CHANNELS.includes(input.channel as (typeof CHANNELS)[number])
      ? (input.channel as (typeof CHANNELS)[number])
      : "irl",
  }))
  .handler(async ({ context, data }) => {
    if (!data.nick) throw new Error("Nick. Bez maila.");
    if (/@/.test(data.nick)) throw new Error("Bez maili znikąd.");
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await requirePaid(sql, context.userId);
    const [waiting] = await sql<{ n: number }>`
      select count(*)::int as n from guests where status = 'czeka'
    `;
    if (Number(waiting?.n ?? 0) > 0) {
      throw new Error("Ktoś już stoi przy progu. Nierazem. Monitor najpierw kiwnie.");
    }
    await sql`
      insert into guests (user_id, nick, channel, status)
      values (${context.userId}, ${data.nick}, ${data.channel}, 'czeka')
    `;
    return { ok: true as const };
  });

export const setGuestStatus = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id?: number; status?: string }) => ({
    id: Number(input.id),
    status:
      input.status === "czeka" || input.status === "wpuszczony" || input.status === "odmowa"
        ? input.status
        : null,
  }))
  .handler(async ({ context, data }) => {
    if (!data.id || !data.status) throw new Error("Zły status.");
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await requirePaid(sql, context.userId);
    await requireHost(sql, context.userId);
    await sql`update guests set status = ${data.status} where id = ${data.id}`;
    return { ok: true as const };
  });

export const getLetters = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<{ letters: Letter[] }> => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<{
      id: number;
      user_id: string;
      author_name: string;
      body: string;
      status: Letter["status"];
      created_at: string | Date;
    }>`
      select id, user_id, author_name, body, status, created_at
      from letters
      where status = 'sent' or user_id = ${context.userId}
      order by created_at desc, id desc
      limit 40
    `;
    return {
      letters: rows.map((r) => ({
        id: r.id,
        userId: r.user_id,
        authorName: r.author_name,
        body: r.body,
        status: r.status,
        createdAt: asIso(r.created_at),
      })),
    };
  });

export const getPublicLetters = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ letters: Letter[] }> => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<{
      id: number;
      user_id: string;
      author_name: string;
      body: string;
      status: Letter["status"];
      created_at: string | Date;
    }>`
      select id, user_id, author_name, body, status, created_at
      from letters
      where status = 'sent'
      order by created_at desc, id desc
      limit 30
    `;
    return {
      letters: rows.map((r) => ({
        id: r.id,
        userId: r.user_id,
        authorName: r.author_name,
        body: r.body,
        status: r.status,
        createdAt: asIso(r.created_at),
      })),
    };
  },
);

export const draftLetter = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { body?: string }) => ({
    body: (input.body ?? "").trim().slice(0, 800),
  }))
  .handler(async ({ context, data }) => {
    if (!data.body) throw new Error("Najpierw draft.");
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await requirePaid(sql, context.userId);
    const author = await nameOf(sql, context.userId);
    const [row] = await sql<{ id: number }>`
      insert into letters (user_id, author_name, body, status)
      values (${context.userId}, ${author}, ${data.body}, 'draft')
      returning id
    `;
    return { id: row.id };
  });

export const sendLetter = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id?: number }) => ({ id: Number(input.id) }))
  .handler(async ({ context, data }) => {
    if (!data.id) throw new Error("Nie ma draftu.");
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await requirePaid(sql, context.userId);
    const [row] = await sql<{ user_id: string; status: string }>`
      select user_id, status from letters where id = ${data.id}
    `;
    if (!row || row.user_id !== context.userId) forbid("To nie Twój draft.");
    if (row.status !== "draft") throw new Error("Już poszło.");
    await sql`update letters set status = 'sent' where id = ${data.id}`;
    return { ok: true as const };
  });

export const getRozumie = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ hits: RozumieHit[] }> => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<{
      id: number;
      sentence: string;
      reply: string;
      created_at: string | Date;
    }>`
      select id, sentence, reply, created_at
      from rozumie
      order by created_at desc, id desc
      limit 24
    `;
    return {
      hits: rows.map((r) => ({
        id: r.id,
        sentence: r.sentence,
        reply: r.reply,
        createdAt: asIso(r.created_at),
      })),
    };
  },
);

export const askRozumie = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { sentence?: string }) => ({
    sentence: (input.sentence ?? "").trim().slice(0, 280),
  }))
  .handler(async ({ context, data }) => {
    if (!data.sentence) throw new Error("Jedno zdanie.");
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await requirePaid(sql, context.userId);
    const reply = concretize(data.sentence);
    await sql`
      insert into rozumie (user_id, sentence, reply)
      values (${context.userId}, ${data.sentence}, ${reply})
    `;
    return { reply };
  });

export const getSurprise = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ current: Surprise | null }> => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const [row] = await sql<{
      id: number;
      author_name: string;
      card: string;
      created_at: string | Date;
    }>`
      select id, author_name, card, created_at
      from surprise_draws
      order by created_at desc, id desc
      limit 1
    `;
    if (!row) return { current: null };
    const age = Date.now() - new Date(asIso(row.created_at)).getTime();
    if (age > 1000 * 60 * 60 * 6) return { current: null };
    return {
      current: {
        id: row.id,
        authorName: row.author_name,
        card: row.card,
        createdAt: asIso(row.created_at),
      },
    };
  },
);

export const drawSurprise = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await requirePaid(sql, context.userId);
    const [last] = await sql<{ user_id: string; created_at: string | Date }>`
      select user_id, created_at from surprise_draws
      order by created_at desc, id desc
      limit 1
    `;
    if (last) {
      const age = Date.now() - new Date(asIso(last.created_at)).getTime();
      if (age < 1000 * 60 * 60 * 6) {
        throw new Error("Karta już jest w czyjejś ręce. Nierazem. Nigdy razem.");
      }
    }
    const card = SURPRISE_CARDS[Math.floor(Math.random() * SURPRISE_CARDS.length)];
    const author = await nameOf(sql, context.userId);
    await sql`
      insert into surprise_draws (user_id, author_name, card)
      values (${context.userId}, ${author}, ${card})
    `;
    return { card };
  });

export const getSongs = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ songs: SharedSong[] }> => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<{
      id: number;
      user_id: string;
      author_name: string;
      lyrics: string;
      bit: string;
      status: SharedSong["status"];
      created_at: string | Date;
    }>`
      select id, user_id, author_name, lyrics, bit, status, created_at
      from shared_songs
      order by created_at desc, id desc
      limit 30
    `;
    return {
      songs: rows.map((r) => ({
        id: r.id,
        userId: r.user_id,
        authorName: r.author_name,
        lyrics: r.lyrics,
        bit: r.bit,
        status: r.status,
        createdAt: asIso(r.created_at),
      })),
    };
  },
);

export const addSong = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { lyrics?: string; bit?: string }) => ({
    lyrics: (input.lyrics ?? "").trim().slice(0, 800),
    bit: (input.bit ?? "").trim().slice(0, 80),
  }))
  .handler(async ({ context, data }) => {
    if (!data.lyrics) throw new Error("Najpierw tekst.");
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await requirePaid(sql, context.userId);
    const author = await nameOf(sql, context.userId);
    const [song] = await sql<{ id: number }>`
      insert into shared_songs (user_id, author_name, lyrics, bit, status)
      values (${context.userId}, ${author}, ${data.lyrics}, ${data.bit || "bit na hasło"}, 'draft')
      returning id
    `;
    if (!song) throw new Error("Szafka nie przyjęła.");
    await sql`
      insert into preemptions (user_id, author_name, kind, title, song_id, status)
      values (
        ${context.userId},
        ${author},
        'kawalek',
        ${`wspólny kawałek: ${data.lyrics.slice(0, 48)}`},
        ${song.id},
        'czeka'
      )
    `;
    return { ok: true as const };
  });

export const getHostSeat = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ name: string; title: string }> => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const [row] = await sql<{ name: string }>`
      select name from host_seat where id = 1
    `;
    return { name: row?.name || HOST_NAME, title: "Host progu" };
  },
);

export const getHostPower = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<HostSeat> => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    return { name: HOST_NAME, isHost: await isHost(sql, context.userId) };
  });

export const getTableSeat = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ name: string; title: string }> => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const [row] = await sql<{ name: string }>`
      select name from table_seat where id = 1
    `;
    return { name: row?.name || TABLE_HOST_NAME, title: "Pieczęć stołu" };
  },
);

export const getTablePower = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<TableSeat> => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    return {
      name: TABLE_HOST_NAME,
      isTableHost: await isTableHost(sql, context.userId),
    };
  });

function asKind(value: string | undefined): PierwokupKind {
  return PIERWOKUP_KINDS.some((k) => k.id === value)
    ? (value as PierwokupKind)
    : "inne";
}

export const getPreemptions = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ claims: Preemption[] }> => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<{
      id: number;
      author_name: string;
      kind: string;
      title: string;
      song_id: number | null;
      status: Preemption["status"];
      created_at: string | Date;
    }>`
      select id, author_name, kind, title, song_id, status, created_at
      from preemptions
      order by created_at desc, id desc
      limit 40
    `;
    return {
      claims: rows.map((r) => ({
        id: r.id,
        authorName: r.author_name,
        kind: asKind(r.kind),
        title: r.title,
        songId: r.song_id,
        status: r.status,
        createdAt: asIso(r.created_at),
      })),
    };
  },
);

export const filePreemption = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { kind?: string; title?: string }) => ({
    kind: asKind(input.kind),
    title: (input.title ?? "").trim().slice(0, 80),
  }))
  .handler(async ({ context, data }) => {
    if (!data.title) throw new Error("Co wystawiasz?");
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await requirePaid(sql, context.userId);
    const author = await nameOf(sql, context.userId);
    await sql`
      insert into preemptions (user_id, author_name, kind, title, status)
      values (${context.userId}, ${author}, ${data.kind}, ${data.title}, 'czeka')
    `;
    return { ok: true as const };
  });

export const resolvePreemption = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id?: number; decision?: string }) => ({
    id: Number(input.id),
    decision: input.decision === "wzial" || input.decision === "oddane" ? input.decision : null,
  }))
  .handler(async ({ context, data }) => {
    if (!data.id || !data.decision) throw new Error("Zła decyzja.");
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await requirePaid(sql, context.userId);
    await requireHost(sql, context.userId);
    const [row] = await sql<{ status: string; song_id: number | null }>`
      select status, song_id from preemptions where id = ${data.id}
    `;
    if (!row) throw new Error("Nie ma takiej rzeczy.");
    if (row.status !== "czeka") throw new Error("Już rozstrzygnięte.");
    await sql`
      update preemptions
      set status = ${data.decision}, decided_at = now()
      where id = ${data.id}
    `;
    if (row.song_id && data.decision === "oddane") {
      await sql`update shared_songs set status = 'swiat' where id = ${row.song_id}`;
    }
    return { ok: true as const, decision: data.decision };
  });
