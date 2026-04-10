import { cx } from "@/lib/classes";

import type { ReactNode } from "react";

type BadgeTone = "accent" | "coptic" | "flat" | "neutral" | "surface";
type BadgeSize = "xs" | "sm" | "md";

type BadgeProps = {
  caps?: boolean;
  children: ReactNode;
  className?: string;
  tone?: BadgeTone;
  size?: BadgeSize;
};

const TONE_CLASSES: Record<BadgeTone, string> = {
  accent:
    "border border-[rgb(var(--accent)/0.18)] bg-[rgb(var(--accent-soft)/0.78)] text-[rgb(var(--accent-strong))]",
  coptic:
    "border border-[rgb(var(--coptic)/0.18)] bg-[rgb(var(--coptic-soft)/0.78)] text-[rgb(var(--coptic))]",
  flat: "bg-[rgb(var(--line))] text-[rgb(var(--muted))]",
  neutral:
    "border border-[rgb(var(--line))] bg-[rgb(var(--elevated))] text-[rgb(var(--muted))]",
  surface:
    "border border-[rgb(var(--line))] bg-[rgb(var(--surface)/0.72)] text-[rgb(var(--muted))] shadow-sm backdrop-blur-md",
};

const SIZE_CLASSES: Record<BadgeSize, string> = {
  xs: "px-3 py-1 text-xs",
  sm: "px-3.5 py-2 text-sm",
  md: "px-4 py-2 text-sm",
};

export function Badge({
  caps = false,
  children,
  className,
  tone = "neutral",
  size = "xs",
}: BadgeProps) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full font-semibold",
        TONE_CLASSES[tone],
        SIZE_CLASSES[size],
        caps ? "uppercase tracking-widest" : "tracking-[0.02em]",
        className,
      )}
    >
      {children}
    </span>
  );
}
