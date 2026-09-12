import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { HonorMark } from "@/components/honor-mark";
import { Button } from "@/components/ui/button";
import type { BudgetSnapshot } from "@/lib/budget";
import { formatPieniazki } from "@/lib/dues";
import { NOTICE_KINDS, type Notice } from "@/lib/life";
import type { LoyalMark } from "@/lib/loyalty";
import { BOARD_LINE, BOARDS, GROK_LINE } from "@/lib/world";
import type { HouseWord } from "@/lib/domain";

export function HouseBoard({
  notices,
  budget,
  loyal,
  word,
}: {
  notices: Notice[];
  budget: BudgetSnapshot | null | undefined;
  loyal: LoyalMark[];
  word?: HouseWord | null;
}) {
  const latest = notices.slice(0, 3);
  const honors = loyal.slice(0, 6);
  const tablica = BOARDS[0];
  const pieniazki = BOARDS[1];
  const slawa = BOARDS[2];

  return (
    <section className="mt-10">
      <p className="font-mono text-xs tracking-[0.18em] text-subtle">
        Tablica informacyjna domu
      </p>
      <p className="mt-2 max-w-xl text-sm text-muted">{BOARD_LINE}</p>
      {word?.line ? (
        <p className="mt-4 max-w-xl font-display text-xl tracking-tight">
          <span className="font-mono text-xs tracking-[0.18em] text-subtle">
            {GROK_LINE}
          </span>
          <span className="mt-2 block">{word.line}</span>
        </p>
      ) : null}
      <div className="board-wall mt-5">
        <div className="grid lg:grid-cols-3 lg:divide-x lg:divide-border">
          <BoardColumn board={tablica}>
            {latest.length === 0 ? (
              <p className="text-sm text-muted">Cicho. Kto lojalny, wiesza.</p>
            ) : (
              <ul className="space-y-4">
                {latest.map((item) => (
                  <li key={item.id}>
                    <p className="font-mono text-xs uppercase tracking-[0.16em] text-subtle">
                      {NOTICE_KINDS.find((kind) => kind.id === item.kind)?.label ??
                        item.kind}
                    </p>
                    <p className="mt-1 font-display text-lg tracking-tight">
                      {item.title}
                    </p>
                    {item.whenText ? (
                      <p className="mt-1 text-sm text-muted">{item.whenText}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </BoardColumn>

          <BoardColumn board={pieniazki}>
            <p className="font-display text-4xl tracking-tight tabular-nums">
              {formatPieniazki(budget?.firmBalance ?? 0)}
            </p>
            <p className="mt-2 text-sm text-muted">
              Konto firmowe proroka. {budget?.tithePercent ?? 5}% z projektu — na
              cel chóru.
            </p>
            <p className="mt-4 font-mono text-xs tracking-[0.16em] text-subtle">
              Przygoda {formatPieniazki(budget?.causePot ?? 0)}
            </p>
          </BoardColumn>

          <BoardColumn board={slawa}>
            {honors.length === 0 ? (
              <p className="text-sm text-muted">
                Jeszcze nikt nie stanął. Składka otwiera próg. Kredo pieczętuje
                imię.
              </p>
            ) : (
              <ul className="space-y-4">
                {honors.map((item) => (
                  <li key={item.userId}>
                    <HonorMark mark={item} size="sm" />
                  </li>
                ))}
              </ul>
            )}
          </BoardColumn>
        </div>
      </div>
    </section>
  );
}

function BoardColumn({
  board,
  children,
}: {
  board: (typeof BOARDS)[number];
  children: ReactNode;
}) {
  return (
    <article className="flex flex-col border-b border-border p-5 last:border-b-0 lg:border-b-0 md:p-6">
      <p className="font-mono text-xs tracking-[0.18em] text-subtle">
        {board.n} · {board.kicker}
      </p>
      <h2 className="mt-2 font-display text-2xl tracking-tight">{board.label}</h2>
      <div className="mt-5 flex-1">{children}</div>
      <Button asChild size="sm" className="mt-6 self-start">
        <Link to={board.to}>{board.action}</Link>
      </Button>
    </article>
  );
}
