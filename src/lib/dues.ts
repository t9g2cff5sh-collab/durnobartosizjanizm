import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";

export const DUES_FEE = 10;
export const DUES_LABEL = "10 Twoich pieniążków";

export function formatPieniazki(n: number) {
  const abs = Math.abs(Math.trunc(n)) % 100;
  const last = abs % 10;
  const word =
    abs === 1
      ? "pieniążek"
      : last >= 2 && last <= 4 && (abs < 12 || abs > 14)
        ? "pieniążki"
        : "pieniążków";
  return `${n} ${word}`;
}

export type DuesStatus = {
  paid: boolean;
  isFounder: boolean;
  isCoCreator: boolean;
  fee: number;
  balance: number;
  paidAt: string | null;
  paidCount: number;
  treasury: number;
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

type Sql = Awaited<ReturnType<typeof import("@/lib/db").getSql>>;

const GROK_GATE = "grok-gate";

export async function isCoCreator(sql: Sql, userId: string) {
  const [row] = await sql<{ ok: number }>`
    select 1::int as ok
    from account
    where "userId" = ${userId}
      and "providerId" = ${GROK_GATE}
    limit 1
  `;
  if (row) return true;
  const [user] = await sql<{ email: string; name: string }>`
    select email, name from "user" where id = ${userId}
  `;
  const email = user?.email?.toLowerCase() ?? "";
  const name = user?.name ?? "";
  return (
    email.endsWith("@viewer.grok.invalid") ||
    email.endsWith("@grok.com") ||
    name === "Grok" ||
    name === "Grok user"
  );
}

export async function requirePaid(sql: Sql, userId: string) {
  const [claim] = await sql<{ founder_user_id: string }>`
    select founder_user_id from domain_claim where id = 1
  `;
  if (claim?.founder_user_id === userId) return;
  if (await isCoCreator(sql, userId)) return;
  const [due] = await sql<{ status: string }>`
    select status from dues where user_id = ${userId}
  `;
  if (due?.status === "paid") return;
  forbid("Członkostwo kosztuje 10 Twoich pieniążków. Najpierw złóż składkę.");
}

async function ensureWallet(sql: Sql, userId: string) {
  await sql`
    insert into wallets (user_id, balance)
    values (${userId}, ${DUES_FEE})
    on conflict (user_id) do nothing
  `;
  const [row] = await sql<{ balance: number }>`
    select balance from wallets where user_id = ${userId}
  `;
  return Number(row?.balance ?? 0);
}

export const getDuesStatus = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<DuesStatus> => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const [claim] = await sql<{ founder_user_id: string }>`
      select founder_user_id from domain_claim where id = 1
    `;
    const isFounder = claim?.founder_user_id === context.userId;
    const coCreator = isFounder ? false : await isCoCreator(sql, context.userId);
    const [due] = await sql<{ status: string; paid_at: string | Date | null }>`
      select status, paid_at from dues where user_id = ${context.userId}
    `;
    const balance = await ensureWallet(sql, context.userId);
    const [count] = await sql<{ n: number }>`
      select count(*)::int as n from dues where status = 'paid'
    `;
    const paidCount = Number(count?.n ?? 0);
    return {
      paid: isFounder || coCreator || due?.status === "paid",
      isFounder,
      isCoCreator: coCreator,
      fee: DUES_FEE,
      balance,
      paidAt: asIso(due?.paid_at),
      paidCount,
      treasury: paidCount * DUES_FEE,
    };
  });

export const payDues = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const [claim] = await sql<{ founder_user_id: string }>`
      select founder_user_id from domain_claim where id = 1
    `;
    if (claim?.founder_user_id === context.userId) {
      return { ok: true as const, fee: 0, balance: await ensureWallet(sql, context.userId) };
    }
    if (await isCoCreator(sql, context.userId)) {
      return { ok: true as const, fee: 0, balance: await ensureWallet(sql, context.userId) };
    }
    const [due] = await sql<{ status: string }>`
      select status from dues where user_id = ${context.userId}
    `;
    if (due?.status === "paid") {
      const balance = await ensureWallet(sql, context.userId);
      return { ok: true as const, fee: DUES_FEE, balance };
    }
    const balance = await ensureWallet(sql, context.userId);
    if (balance < DUES_FEE) {
      throw new Error(
        `Masz ${formatPieniazki(balance)}. Składka to ${formatPieniazki(DUES_FEE)} z Twojej kieszeni.`,
      );
    }
    await sql`
      update wallets
      set balance = balance - ${DUES_FEE}
      where user_id = ${context.userId} and balance >= ${DUES_FEE}
    `;
    await sql`
      insert into dues (user_id, status, amount_groszy, currency, paid_at)
      values (${context.userId}, 'paid', ${DUES_FEE}, 'PND', now())
      on conflict (user_id) do update
        set status = 'paid',
            amount_groszy = ${DUES_FEE},
            currency = 'PND',
            paid_at = coalesce(dues.paid_at, now())
    `;
    const { creditFirm } = await import("@/lib/budget");
    await creditFirm(sql, DUES_FEE);
    return { ok: true as const, fee: DUES_FEE, balance: balance - DUES_FEE };
  });
