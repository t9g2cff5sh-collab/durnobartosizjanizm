import type { LoyalMark } from "@/lib/loyalty";

export function HonorMark({
  mark,
  size = "md",
}: {
  mark: Pick<LoyalMark, "seal" | "honorLabel" | "displayName" | "title" | "credo">;
  size?: "sm" | "md";
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        aria-hidden
        className={
          size === "sm"
            ? "grid size-10 shrink-0 place-items-center rounded-full bg-surface-2 font-display text-lg text-accent shadow-[var(--shadow-border)]"
            : "grid size-12 shrink-0 place-items-center rounded-full bg-surface-2 font-display text-xl text-accent shadow-[var(--shadow-border)]"
        }
      >
        {mark.seal}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-mono text-xs tracking-[0.18em] text-subtle">
          {mark.honorLabel}
          {mark.title ? ` · ${mark.title}` : ""}
        </p>
        <p
          className={
            size === "sm"
              ? "mt-1 font-display text-lg tracking-tight"
              : "mt-1 font-display text-xl tracking-tight md:text-2xl"
          }
        >
          {mark.displayName}
        </p>
        {mark.credo ? (
          <p className="mt-1 text-sm text-muted">{mark.credo}</p>
        ) : null}
      </div>
    </div>
  );
}
