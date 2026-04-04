import type { ButtonHTMLAttributes } from "react";
import { cx } from "@/lib/classes";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "social"
  | "link";
export type ButtonSize = "sm" | "md" | "lg";

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
  sm: "h-10 rounded-lg px-3 text-sm",
  md: "h-11 rounded-xl px-4 text-sm",
  lg: "h-12 rounded-xl px-5 text-sm",
};

const LINK_SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-sm",
};

const BUTTON_VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-sky-600 text-white shadow-sm hover:-translate-y-px hover:bg-sky-500 hover:shadow-md focus-visible:ring-sky-500/35 dark:bg-sky-500 dark:hover:bg-sky-400",
  secondary:
    "border border-stone-200 bg-white/70 text-stone-700 shadow-sm backdrop-blur-md hover:-translate-y-px hover:bg-white hover:shadow-md focus-visible:ring-sky-500/25 dark:border-stone-800 dark:bg-stone-900/50 dark:text-stone-300 dark:hover:bg-stone-800/70",
  ghost:
    "text-stone-600 hover:-translate-y-px hover:bg-stone-100 hover:text-stone-900 focus-visible:ring-sky-500/25 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200",
  social:
    "border border-stone-200 bg-white text-stone-700 shadow-sm hover:-translate-y-px hover:bg-stone-50 hover:shadow-md focus-visible:ring-sky-500/25 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800",
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
