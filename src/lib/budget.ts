import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { formatPieniazki, requirePaid } from "@/lib/dues";

export const TITHE_PERCENT = 5;

export type Cause = {
  id: number;
  userId: string;
  authorName: string;
  title: string;
  body: string;
  votes: number;
  createdAt: string;
};

export type Project = {
  id: number;
  userId: string;
  authorName: string;
  title: string;
  body: string;
  earned: number;
  status: "tok" | "gotowe";
  tithe: number;
  net: number;
  causeTitle: string;
  completedAt: string | null;
  createdAt: string;
};

export type BudgetSnapshot = {
  firmLabel: string;
  firmBalance: number;
  firmHolder: string;
  firmLast4: string;
  firmIban: string;
  causePot: number;
  tithePercent: number;
  winningCause: Cause | null;
  myVoteId: number | null;
  causes: Cause[];
  projects: Project[];
};

function asIso(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toISOString();
}

function forbid(message: string): never {
  const error = new Error(message) as Error & { status: number };
  error.status = 403;
  throw error;
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function looksLikePan(value: string) {
  const digits = digitsOnly(value);
  const hasLetter = /[A-Za-z]/.test(value);
  return !hasLetter && digits.length >= 12 && digits.length <= 19;
}

function cleanLast4(value: string) {
  const digits = digitsOnly(value).slice(-4);
  if (value.trim() && digits.length !== 4) {
    throw new Error("Ostatnie 4 cyfry karty — tylko cztery.");
  }
  return digits;
}

function cleanIban(value: string) {
  const iban = value.replace(/\s+/g, "").toUpperCase();
  if (!iban) return "";
  if (looksLikePan(iban)) {
    throw new Error("Nie numer karty. Podaj IBAN konta firmowego.");
  }
  if (iban.length > 34) {
    throw new Error("IBAN jest za długi.");
  }
  if (!/^[A-Z]{2}[0-9A-Z]+$/.test(iban)) {
    throw new Error("IBAN zaczyna się od kodu kraju, np. PL.");
  }
  return iban;
}

export function formatIban(iban: string) {
  return iban.replace(/(.{4})/g, "$1 ").trim();
}

type Sql = Awaited<ReturnType<typeof import("@/lib/db").getSql>>;

export async function creditFirm(sql: Sql, amount: number) {
  if (amount <= 0) return;
  await sql`
    insert into company_account (id, label, balance)
    values (1, 'Konto firmowe', ${amount})
    on conflict (id) do update
      set balance = company_account.balance + ${amount}
  `;
}

async function creditCausePot(sql: Sql, amount: number) {
  if (amount <= 0) return;
  await sql`
    insert into cause_pot (id, balance)
    values (1, ${amount})
    on conflict (id) do update
      set balance = cause_pot.balance + ${amount}
  `;
}

async function authorName(sql: Sql, userId: string) {
  const [profile] = await sql<{ display_name: string }>`
    select display_name from profiles where user_id = ${userId}
  `;
  return profile?.display_name || "Wyznawca";
}

async function isFounder(sql: Sql, userId: string) {
  const [claim] = await sql<{ founder_user_id: string }>`
    select founder_user_id from domain_claim where id = 1
  `;
  return claim?.founder_user_id === userId;
}

function titheOf(earned: number) {
  return Math.round((earned * TITHE_PERCENT) / 100);
}

export const getBudget = createServerFn({ method: "GET" }).handler(
  async (): Promise<BudgetSnapshot> => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql`
      insert into company_account (id, label, balance)
      values (1, 'Konto firmowe', 0)
      on conflict (id) do nothing
    `;
    await sql`
      insert into cause_pot (id, balance) values (1, 0)
      on conflict (id) do nothing
    `;
    const [firm] = await sql<{
      label: string;
      balance: number;
      holder: string;
      last4: string;
      iban: string;
    }>`
      select label, balance, holder, last4, iban from company_account where id = 1
    `;
    const [pot] = await sql<{ balance: number }>`
      select balance from cause_pot where id = 1
    `;
    const causeRows = await sql<{
      id: number;
      user_id: string;
      author_name: string;
      title: string;
      body: string;
      votes: number;
      created_at: string | Date;
    }>`
      select
        c.id,
        c.user_id,
        c.author_name,
        c.title,
        c.body,
        count(v.user_id)::int as votes,
        c.created_at
      from causes c
      left join cause_votes v on v.cause_id = c.id
      group by c.id
      order by votes desc, c.id asc
    `;
    const causes: Cause[] = causeRows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      authorName: row.author_name,
      title: row.title,
      body: row.body,
      votes: Number(row.votes),
      createdAt: asIso(row.created_at) ?? "",
    }));
    const winningCause = causes[0] && causes[0].votes > 0 ? causes[0] : null;
    const projectRows = await sql<{
      id: number;
      user_id: string;
      author_name: string;
      title: string;
      body: string;
      earned: number;
      status: string;
      tithe: number;
      net: number;
      cause_title: string;
      completed_at: string | Date | null;
      created_at: string | Date;
    }>`
      select id, user_id, author_name, title, body, earned, status, tithe, net,
             cause_title, completed_at, created_at
      from projects
      order by created_at desc, id desc
      limit 40
    `;
    return {
      firmLabel: firm?.label || "Konto firmowe",
      firmBalance: Number(firm?.balance ?? 0),
      firmHolder: firm?.holder ?? "",
      firmLast4: firm?.last4 ?? "",
      firmIban: firm?.iban ?? "",
      causePot: Number(pot?.balance ?? 0),
      tithePercent: TITHE_PERCENT,
      winningCause,
      myVoteId: null,
      causes,
      projects: projectRows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        authorName: row.author_name,
        title: row.title,
        body: row.body,
        earned: Number(row.earned),
        status: row.status === "gotowe" ? "gotowe" : "tok",
        tithe: Number(row.tithe),
        net: Number(row.net),
        causeTitle: row.cause_title,
        completedAt: asIso(row.completed_at),
        createdAt: asIso(row.created_at) ?? "",
      })),
    };
  },
);

export const updateFirmAccount = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { holder?: string; last4?: string; iban?: string }) => ({
    holder: (input.holder ?? "").trim().slice(0, 80),
    last4: (input.last4 ?? "").trim(),
    iban: (input.iban ?? "").trim(),
  }))
  .handler(async ({ context, data }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    if (!(await isFounder(sql, context.userId))) {
      forbid("Tylko prorok ustawia konto firmowe.");
    }
    const last4 = cleanLast4(data.last4);
    const iban = cleanIban(data.iban);
    await sql`
      insert into company_account (id, label, balance, holder, last4, iban)
      values (1, 'Konto firmowe', 0, ${data.holder}, ${last4}, ${iban})
      on conflict (id) do update
        set holder = ${data.holder},
            last4 = ${last4},
            iban = ${iban}
    `;
    return { ok: true as const };
  });

export const getMyVote = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<{ causeId: number | null }> => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const [row] = await sql<{ cause_id: number }>`
      select cause_id from cause_votes where user_id = ${context.userId}
    `;
    return { causeId: row?.cause_id ?? null };
  });

export const proposeCause = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { title: string; body?: string }) => ({
    title: input.title.trim().slice(0, 120),
    body: (input.body ?? "").trim().slice(0, 400),
  }))
  .handler(async ({ context, data }) => {
    if (!data.title) throw new Error("Cel potrzebuje nazwy.");
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await requirePaid(sql, context.userId);
    const name = await authorName(sql, context.userId);
    const [row] = await sql<{ id: number }>`
      insert into causes (user_id, author_name, title, body)
      values (${context.userId}, ${name}, ${data.title}, ${data.body})
      returning id
    `;
    await sql`
      insert into cause_votes (user_id, cause_id)
      values (${context.userId}, ${row.id})
      on conflict (user_id) do update set cause_id = ${row.id}
    `;
    return { id: row.id };
  });

export const voteCause = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: number }) => ({ id: Number(input.id) }))
  .handler(async ({ context, data }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await requirePaid(sql, context.userId);
    const [cause] = await sql<{ id: number }>`
      select id from causes where id = ${data.id}
    `;
    if (!cause) throw new Error("Nie ma takiego celu.");
    await sql`
      insert into cause_votes (user_id, cause_id)
      values (${context.userId}, ${data.id})
      on conflict (user_id) do update set cause_id = ${data.id}
    `;
    return { ok: true as const };
  });

export const addProject = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { title: string; body?: string; earned: number }) => ({
    title: input.title.trim().slice(0, 120),
    body: (input.body ?? "").trim().slice(0, 800),
    earned: Math.max(0, Math.round(Number(input.earned))),
  }))
  .handler(async ({ context, data }) => {
    if (!data.title) throw new Error("Projekt potrzebuje nazwy.");
    if (data.earned < 1) throw new Error("Podaj ile projekt zarobił.");
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await requirePaid(sql, context.userId);
    const name = await authorName(sql, context.userId);
    const [row] = await sql<{ id: number }>`
      insert into projects (user_id, author_name, title, body, earned, status)
      values (${context.userId}, ${name}, ${data.title}, ${data.body}, ${data.earned}, 'tok')
      returning id
    `;
    return { id: row.id };
  });

export const completeProject = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: number }) => ({ id: Number(input.id) }))
  .handler(async ({ context, data }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    if (!(await isFounder(sql, context.userId))) {
      forbid("Tylko prorok zalicza projekt jako dobrze zrealizowany.");
    }
    const [project] = await sql<{
      id: number;
      status: string;
      earned: number;
    }>`
      select id, status, earned from projects where id = ${data.id}
    `;
    if (!project) throw new Error("Nie ma takiego projektu.");
    if (project.status === "gotowe") return { ok: true as const };
    const earned = Number(project.earned);
    const tithe = titheOf(earned);
    const net = earned - tithe;
    const [top] = await sql<{ title: string; votes: number }>`
      select c.title, count(v.user_id)::int as votes
      from causes c
      left join cause_votes v on v.cause_id = c.id
      group by c.id
      having count(v.user_id) > 0
      order by votes desc, c.id asc
      limit 1
    `;
    const causeTitle = top?.title || "Cel jeszcze nie wybrany";
    await creditFirm(sql, net);
    await creditCausePot(sql, tithe);
    await sql`
      update projects
      set status = 'gotowe',
          tithe = ${tithe},
          net = ${net},
          cause_title = ${causeTitle},
          completed_at = now()
      where id = ${data.id}
    `;
    return {
      ok: true as const,
      tithe,
      net,
      causeTitle,
      message: `${formatPieniazki(net)} na konto firmowe. ${formatPieniazki(tithe)} (${TITHE_PERCENT}%) na: ${causeTitle}.`,
    };
  });
