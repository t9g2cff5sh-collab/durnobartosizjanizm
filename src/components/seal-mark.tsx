import { cn } from "@/lib/utils";

export function SealMark({
  className,
  size = 56,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={cn("text-accent", className)}
    >
      <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="1" opacity="0.45" />
      <circle cx="32" cy="32" r="24" stroke="currentColor" strokeWidth="1" />
      <text
        x="32"
        y="38"
        textAnchor="middle"
        fill="currentColor"
        fontFamily="Newsreader, Palatino Linotype, serif"
        fontSize="22"
        fontWeight="500"
      >
        B
      </text>
    </svg>
  );
}
