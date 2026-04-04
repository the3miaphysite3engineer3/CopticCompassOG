import type { ReactNode } from "react";
import { cx } from "@/lib/classes";

type StatusNoticeTone = "default" | "error" | "info" | "success";
type StatusNoticeSize = "compact" | "comfortable";
type StatusNoticeAlign = "left" | "center";

type StatusNoticeProps = {
  actions?: ReactNode;
  align?: StatusNoticeAlign;
  children?: ReactNode;
  className?: string;
  dashed?: boolean;
  size?: StatusNoticeSize;
  title?: ReactNode;
  tone?: StatusNoticeTone;
};

const TONE_CLASSES: Record<StatusNoticeTone, string> = {
  default:
    "border-[rgb(var(--line))] bg-[rgb(var(--surface)/0.6)] text-[rgb(var(--muted))] shadow-sm backdrop-blur-md",
  error:
    "border-[rgb(var(--danger)/0.18)] bg-[rgb(var(--danger)/0.08)] text-[rgb(var(--danger))]",
  info: "border-[rgb(var(--accent)/0.18)] bg-[rgb(var(--accent-soft)/0.72)] text-[rgb(var(--accent-strong))]",
  success:
    "border-[rgb(var(--success)/0.18)] bg-[rgb(var(--success)/0.08)] text-[rgb(var(--success))]",
};

const SIZE_CLASSES: Record<StatusNoticeSize, string> = {
  compact: "px-4 py-3 text-sm",
  comfortable: "p-6",
};

export function StatusNotice({
  actions,
  align = "center",
  children,
  className,
  dashed = false,
  size = "compact",
  title,
  tone = "default",
}: StatusNoticeProps) {
  const hasBody = Boolean(children);

  return (
    <div
      className={cx(
        "rounded-2xl border font-medium",
        TONE_CLASSES[tone],
        SIZE_CLASSES[size],
        dashed && "border-dashed",
        align === "center" ? "text-center" : "text-left",
        className,
      )}
    >
      {title && (
        <h3 className={cx("font-bold", hasBody ? "mb-2 text-xl" : "text-base")}>
          {title}
        </h3>
      )}

      {hasBody && <div className="leading-relaxed">{children}</div>}

      {actions && (
        <div className={cx(hasBody || title ? "mt-4" : undefined)}>
          {actions}
        </div>
      )}
    </div>
  );
}
