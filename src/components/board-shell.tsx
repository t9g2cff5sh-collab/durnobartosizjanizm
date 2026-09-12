import type { ReactNode } from "react";
import { BOARDS, type BoardPath } from "@/lib/world";

export function BoardShell({
  current,
  children,
}: {
  current: BoardPath;
  children: ReactNode;
}) {
  const board = BOARDS.find((item) => item.to === current)!;
  return (
    <main className="mx-auto max-w-5xl px-5 pb-20 md:px-10">
      <p className="font-mono text-xs tracking-[0.18em] text-subtle">
        {board.n} · {board.kicker}
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-tight md:text-5xl">
        {board.label}
      </h1>
      <p className="mt-3 max-w-xl text-muted">{board.lede}</p>
      <div className="mt-8">{children}</div>

    </main>
  );
}
