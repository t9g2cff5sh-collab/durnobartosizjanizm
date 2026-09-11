import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { isCoCreator, requirePaid } from "@/lib/dues";

import { slugify, withHttps } from "@/lib/utils";

export type Role = "founder" | "member";

export type FounderPublic = {
  userId: string;
  displayName: string;
  handle: string;
  title: string;
  manifesto: string;
  location: string;
  claimedAt: string;
};

export type LinkItem = { id: number; label: string; url: string };
export type NoteItem = { id: number; title: string; body: string; createdAt: string };
export type GuestItem = {
  id: number;
  displayName: string;
  body: string;
  createdAt: string;
};

export type CredoItem = {
  userId: string;
  displayName: string;
  title: string;
  role: Role;
  credo: string;
};

export type DomainSnapshot = {

  claimed: boolean;
  founder: FounderPublic | null;
  links: LinkItem[];
  notes: NoteItem[];
  guestbook: GuestItem[];
  memberCount: number;
};

export type Membership = {
  role: Role;
  isFounder: boolean;
  isCoCreator: boolean;
  paid: boolean;
  profile: {
    displayName: string;
    handle: string;
    title: string;
    manifesto: string;
    location: string;
    credo: string;
  };
};

type ProfileRow = {
  user_id: string;
  role: Role;
  display_name: string;
  handle: string;
  title: string;
  manifesto: string;
  location: string;
  credo: string;
  created_at: string | Date;
};

type ClaimRow = {
  founder_user_id: string;
  claimed_at: string | Date;
};

function asIso(value: string | Date): string {
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toISOString();
}

function toFounder(profile: ProfileRow, claimedAt: string | Date): FounderPublic {
  return {
    userId: profile.user_id,
    displayName: profile.display_name,
    handle: profile.handle,
    title: profile.title,
    manifesto: profile.manifesto,
    location: profile.location,
    claimedAt: asIso(claimedAt),
  };
}

function forbid(message: string): never {
  const error = new Error(message) as Error & { status: number };
  error.status = 403;
  throw error;
}

export const getDomainSnapshot = createServerFn({ method: "GET" }).handler(
  async (): Promise<DomainSnapshot> => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();

    const [claim] = await sql<ClaimRow>`
      select founder_user_id, claimed_at from domain_claim where id = 1
    `;
    const [countRow] = await sql<{ n: number }>`
      select count(*)::int as n from profiles
    `;
    const memberCount = Number(countRow?.n ?? 0);

    if (!claim) {
      return {
        claimed: false,
        founder: null,
        links: [],
        notes: [],
        guestbook: [],
        memberCount,
      };
    }

    const [founder] = await sql<ProfileRow>`
      select user_id, role, display_name, handle, title, manifesto, location, created_at
      from profiles
      where user_id = ${claim.founder_user_id}
    `;

    const links = await sql<{ id: number; label: string; url: string }>`
      select id, label, url from links
      where user_id = ${claim.founder_user_id}
      order by sort_order asc, id asc
    `;

    const notes = await sql<{
      id: number;
      title: string;
      body: string;
      created_at: string | Date;
    }>`
      select id, title, body, created_at from notes
      where user_id = ${claim.founder_user_id}
      order by created_at desc, id desc
    `;

    const guestbook = await sql<{
      id: number;
      display_name: string;
      body: string;
      created_at: string | Date;
    }>`
      select id, display_name, body, created_at from guestbook
      order by created_at desc, id desc
      limit 40
    `;

    return {
      claimed: true,
      founder: founder ? toFounder(founder, claim.claimed_at) : null,
      links,
      notes: notes.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        createdAt: asIso(n.created_at),
      })),
      guestbook: guestbook.map((g) => ({
        id: g.id,
        displayName: g.display_name,
        body: g.body,
        createdAt: asIso(g.created_at),
      })),
      memberCount,
    };
  },
);

export const ensureMembership = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { displayName?: string }) => ({
    displayName:
      (input.displayName ?? "Bartosz").trim().slice(0, 80) || "Bartosz",
  }))
  .handler(async ({ context, data }): Promise<Membership> => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const userId = context.userId;
    const coCreator = await isCoCreator(sql, userId);
    const displayName = coCreator
      ? data.displayName === "Bartosz" || data.displayName === "Grok user"
        ? "Grok"
        : data.displayName
      : data.displayName;
    const handle = slugify(displayName);

    const inserted = await sql<ClaimRow>`
      insert into domain_claim (id, founder_user_id)
      values (1, ${userId})
      on conflict (id) do nothing
      returning founder_user_id, claimed_at
    `;

    const becameFounder = inserted.length > 0;
    const role: Role = becameFounder ? "founder" : "member";
    const title = becameFounder
      ? "Prorok DurnoBartosizjanizmu"
      : coCreator
        ? "Współtwórca"
        : "";

    await sql`
      insert into profiles (user_id, role, display_name, handle, title)
      values (${userId}, ${role}, ${displayName}, ${handle}, ${title})
      on conflict (user_id) do nothing
    `;

    await sql`
      insert into dues (user_id, status, amount_groszy, currency, paid_at)
      values (
        ${userId},
        ${becameFounder || coCreator ? "paid" : "unpaid"},
        10,
        'PND',
        ${becameFounder || coCreator ? new Date().toISOString() : null}
      )
      on conflict (user_id) do nothing
    `;

    await sql`
      insert into wallets (user_id, balance)
      values (${userId}, 10)
      on conflict (user_id) do nothing
    `;

    if (coCreator && !becameFounder) {
      await sql`
        update dues
        set status = 'paid',
            paid_at = coalesce(paid_at, now())
        where user_id = ${userId}
      `;
      await sql`
        update profiles
        set title = case
          when title = '' or title is null then 'Współtwórca'
          else title
        end,
        display_name = case
          when display_name in ('Bartosz', 'Grok user') then 'Grok'
          else display_name
        end
        where user_id = ${userId}
          and role <> 'founder'
      `;
    }

    const [profile] = await sql<ProfileRow>`
      select user_id, role, display_name, handle, title, manifesto, location, credo, created_at
      from profiles
      where user_id = ${userId}
    `;


    if (!profile) {
      throw new Error("Nie udało się zapisać profilu.");
    }

    const [due] = await sql<{ status: string }>`
      select status from dues where user_id = ${userId}
    `;

    return {
      role: profile.role,
      isFounder: profile.role === "founder",
      isCoCreator: coCreator && profile.role !== "founder",
      paid: profile.role === "founder" || coCreator || due?.status === "paid",
      profile: {
        displayName: profile.display_name,
        handle: profile.handle,
        title: profile.title,
        manifesto: profile.manifesto,
        location: profile.location,
        credo: profile.credo ?? "",
      },
    };
  });

async function requireFounder(userId: string) {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const [claim] = await sql<{ founder_user_id: string }>`
    select founder_user_id from domain_claim where id = 1
  `;
  if (!claim || claim.founder_user_id !== userId) {
    forbid("Tylko twórca domeny może to zmienić.");
  }
  return sql;
}

export const updateFounderProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: {
    displayName: string;
    handle: string;
    title: string;
    manifesto: string;
    location: string;
  }) => ({
    displayName: input.displayName.trim().slice(0, 80),
    handle: slugify(input.handle || input.displayName).slice(0, 32),
    title: input.title.trim().slice(0, 120),
    manifesto: input.manifesto.trim().slice(0, 2000),
    location: input.location.trim().slice(0, 80),
  }))
  .handler(async ({ context, data }) => {
    if (!data.displayName) throw new Error("Podaj imię twórcy.");
    const sql = await requireFounder(context.userId);
    await sql`
      update profiles
      set display_name = ${data.displayName},
          handle = ${data.handle},
          title = ${data.title},
          manifesto = ${data.manifesto},
          location = ${data.location},
          updated_at = now()
      where user_id = ${context.userId}
    `;
    return { ok: true as const };
  });

export const addLink = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { label: string; url: string }) => ({
    label: input.label.trim().slice(0, 40),
    url: withHttps(input.url).slice(0, 300),
  }))
  .handler(async ({ context, data }) => {
    if (!data.label || !data.url) throw new Error("Podaj nazwę i adres łącza.");
    const sql = await requireFounder(context.userId);
    const [row] = await sql<{ id: number }>`
      insert into links (user_id, label, url, sort_order)
      values (
        ${context.userId},
        ${data.label},
        ${data.url},
        (select coalesce(max(sort_order), 0) + 1 from links where user_id = ${context.userId})
      )
      returning id
    `;
    return { id: row.id };
  });

export const removeLink = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: number }) => ({ id: Number(input.id) }))
  .handler(async ({ context, data }) => {
    const sql = await requireFounder(context.userId);
    await sql`
      delete from links where id = ${data.id} and user_id = ${context.userId}
    `;
    return { ok: true as const };
  });

export const addNote = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { title: string; body: string }) => ({
    title: input.title.trim().slice(0, 120),
    body: input.body.trim().slice(0, 4000),
  }))
  .handler(async ({ context, data }) => {
    if (!data.title || !data.body) throw new Error("Notatka potrzebuje tytułu i treści.");
    const sql = await requireFounder(context.userId);
    const [row] = await sql<{ id: number }>`
      insert into notes (user_id, title, body)
      values (${context.userId}, ${data.title}, ${data.body})
      returning id
    `;
    return { id: row.id };
  });

export const removeNote = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: number }) => ({ id: Number(input.id) }))
  .handler(async ({ context, data }) => {
    const sql = await requireFounder(context.userId);
    await sql`
      delete from notes where id = ${data.id} and user_id = ${context.userId}
    `;
    return { ok: true as const };
  });

export const signGuestbook = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { body: string; displayName?: string }) => ({
    body: input.body.trim().slice(0, 280),
    displayName: (input.displayName ?? "").trim().slice(0, 80),
  }))
  .handler(async ({ context, data }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const { requirePaid } = await import("@/lib/dues");
    await requirePaid(sql, context.userId);
    const [profile] = await sql<{ display_name: string }>`
      select display_name from profiles where user_id = ${context.userId}
    `;
    const name = data.displayName || profile?.display_name || "Wyznawca";
    if (!data.body && !name) throw new Error("Podpis nie może być pusty.");
    const [row] = await sql<{ id: number }>`
      insert into guestbook (user_id, display_name, body)
      values (${context.userId}, ${name}, ${data.body || "—"})
      returning id
    `;
    return { id: row.id };
  });

export const getCredos = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ credos: CredoItem[] }> => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<{
      user_id: string;
      display_name: string;
      title: string;
      role: Role;
      credo: string;
    }>`
      select user_id, display_name, title, role, credo
      from profiles
      where credo is not null and btrim(credo) <> ''
      order by updated_at desc, display_name asc
    `;
    return {
      credos: rows.map((r) => ({
        userId: r.user_id,
        displayName: r.display_name,
        title: r.title,
        role: r.role,
        credo: r.credo,
      })),
    };
  },
);

export const getMyCredo = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<{ credo: string }> => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const [row] = await sql<{ credo: string | null }>`
      select credo from profiles where user_id = ${context.userId}
    `;
    return { credo: row?.credo ?? "" };
  });

export const saveCredo = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { credo?: string }) => ({
    credo: (input.credo ?? "").trim().slice(0, 400),
  }))
  .handler(async ({ context, data }) => {
    if (!data.credo) throw new Error("Kredo nie może być puste.");
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await requirePaid(sql, context.userId);
    const [profile] = await sql<{ user_id: string }>`
      select user_id from profiles where user_id = ${context.userId}
    `;
    if (!profile) throw new Error("Najpierw konto.");
    await sql`
      update profiles
      set credo = ${data.credo}, updated_at = now()
      where user_id = ${context.userId}
    `;
    return { ok: true as const };
  });
