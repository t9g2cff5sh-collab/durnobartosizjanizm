import { createServerFn } from "@tanstack/react-start";
import { BOZIE_CREDO, GROK_CREDO, OPAL_CREDO } from "@/lib/world";

export type HonorKind = "prorok" | "zarezerwowane" | "kredo" | "skladka";

export type LoyalMark = {
  userId: string;
  displayName: string;
  title: string;
  honor: HonorKind;
  honorLabel: string;
  credo: string;
  seal: string;
};

const HONOR_LABEL: Record<HonorKind, string> = {
  prorok: "Prorok",
  zarezerwowane: "Zarezerwowane",
  kredo: "Wierny",
  skladka: "Próg",
};

function sealOf(name: string) {
  const trimmed = name.trim();
  return trimmed ? trimmed[0]!.toLocaleUpperCase("pl-PL") : "·";
}

export const GROK_MARK: LoyalMark = {
  userId: "reserved-grok",
  displayName: "Grok",
  title: "Współtwórca",
  honor: "zarezerwowane",
  honorLabel: HONOR_LABEL.zarezerwowane,
  credo: GROK_CREDO,
  seal: "G",
};

export const LUKASZ_MARK: LoyalMark = {
  userId: "reserved-opal",
  displayName: "Łukasz Opiłka",
  title: "Opał · Bit",
  honor: "zarezerwowane",
  honorLabel: HONOR_LABEL.zarezerwowane,
  credo: OPAL_CREDO,
  seal: "Ł",
};

export const BOZIE_MARK: LoyalMark = {
  userId: "reserved-bozie",
  displayName: "Pani Bozia",
  title: "Bozie 02 · Gościna",
  honor: "zarezerwowane",
  honorLabel: HONOR_LABEL.zarezerwowane,
  credo: BOZIE_CREDO,
  seal: "Ż",
};

export const getLoyaltyBoard = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ loyal: LoyalMark[] }> => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<{
      user_id: string;
      display_name: string;
      title: string;
      role: string;
      credo: string | null;
    }>`
      select p.user_id, p.display_name, p.title, p.role, p.credo
      from profiles p
      left join dues d on d.user_id = p.user_id
      where p.role = 'founder' or d.status = 'paid'
      order by
        case when p.role = 'founder' then 0 else 1 end,
        case when btrim(coalesce(p.credo, '')) <> '' then 0 else 1 end,
        p.updated_at desc
    `;
    const loyal: LoyalMark[] = rows.map((row) => {
      const credo = (row.credo ?? "").trim();
      const honor: HonorKind =
        row.role === "founder" ? "prorok" : credo ? "kredo" : "skladka";
      return {
        userId: row.user_id,
        displayName: row.display_name,
        title:
          row.title ||
          (row.role === "founder" ? "Prorok" : "należący"),
        honor,
        honorLabel: HONOR_LABEL[honor],
        credo,
        seal: sealOf(row.display_name),
      };
    });
    const hasGrok = loyal.some((item) => item.displayName.trim().toLowerCase() === "grok");
    const hasLukasz = loyal.some((item) =>
      item.displayName.toLowerCase().includes("opiłka"),
    );
    const hasBozie = loyal.some((item) => {
      const n = item.displayName.toLowerCase();
      return n.includes("bozia") || n.includes("bozie") || n.includes("bożen");
    });
    const reserved = [
      ...(!hasGrok ? [GROK_MARK] : []),
      ...(!hasLukasz ? [LUKASZ_MARK] : []),
      ...(!hasBozie ? [BOZIE_MARK] : []),
    ];
    if (reserved.length) loyal.splice(loyal.length ? 1 : 0, 0, ...reserved);
    return { loyal };
  },
);
