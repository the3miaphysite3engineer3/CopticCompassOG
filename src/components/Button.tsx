import { cx } from "@/lib/classes";

import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "social" | "link";
type ButtonSize = "sm" | "md" | "lg";

type ButtonClassNameOptions = {
  className?: string;
  fullWidth?: boolean;
  size?: ButtonSize;
  variant?: ButtonVariant;
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  ButtonClassNameOptions;

const BUTTON_BASE_CLASS =
  "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-55";

const BUTTON_SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-10 rounded-xl px-3 text-sm",
  md: "h-11 rounded-2xl px-4 text-sm",
  lg: "h-12 rounded-2xl px-5 text-sm",
};

const LINK_SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-sm",
};

const BUTTON_VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-sky-600 text-white shadow-sm hover:-translate-y-px hover:bg-sky-500 hover:shadow-soft focus-visible:ring-accent/35 dark:bg-sky-500 dark:hover:bg-sky-400",
  secondary:
    "border border-line/80 bg-surface/75 text-ink shadow-sm backdrop-blur-md hover:-translate-y-px hover:bg-surface hover:shadow-soft focus-visible:ring-accent/25",
  ghost:
    "text-muted hover:-translate-y-px hover:bg-elevated hover:text-ink focus-visible:ring-accent/25",
  social:
    "border border-line/80 bg-surface text-ink shadow-sm hover:-translate-y-px hover:bg-elevated hover:shadow-soft focus-visible:ring-accent/25",
  link: "text-sky-600 hover:text-sky-700 hover:underline focus-visible:ring-sky-500/25 dark:text-sky-400 dark:hover:text-sky-300",
};

export function buttonClassName({
  className,
  fullWidth = false,
  size = "md",
  variant = "primary",
}: ButtonClassNameOptions = {}) {
  return cx(
    BUTTON_BASE_CLASS,
    variant === "link" ? LINK_SIZE_CLASSES[size] : BUTTON_SIZE_CLASSES[size],
    BUTTON_VARIANT_CLASSES[variant],
    fullWidth && "w-full",
    className,
  );
}

export function Button({
  className,
  fullWidth = false,
  size = "md",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonClassName({ className, fullWidth, size, variant })}
      {...props}
    />
  );
}
