import { cx } from "@/lib/classes";

import type { HTMLAttributes } from "react";

type SurfacePanelVariant = "default" | "subtle" | "elevated";
type SurfacePanelShadow = "soft" | "panel" | "float";
type SurfacePanelRounded = "2xl" | "3xl" | "4xl";
type SurfacePanelTag = "article" | "div" | "section";

type SurfacePanelClassNameOptions = {
  className?: string;
  interactive?: boolean;
  rounded?: SurfacePanelRounded;
  shadow?: SurfacePanelShadow;
  variant?: SurfacePanelVariant;
};

const VARIANT_CLASSES: Record<SurfacePanelVariant, string> = {
  default: "bg-white/70 dark:bg-stone-900/50",
  subtle: "bg-white/60 dark:bg-stone-900/60",
  elevated: "bg-white/75 dark:bg-stone-900/55",
};

const SHADOW_CLASSES: Record<SurfacePanelShadow, string> = {
  soft: "shadow-sm dark:shadow-lg",
  panel: "shadow-md dark:shadow-xl dark:shadow-black/20",
  float: "shadow-lg dark:shadow-2xl dark:shadow-black/25",
};

const ROUNDED_CLASSES: Record<SurfacePanelRounded, string> = {
  "2xl": "rounded-2xl",
  "3xl": "rounded-3xl",
  "4xl": "rounded-[2rem]",
};

export function surfacePanelClassName({
  className,
  interactive = false,
  rounded = "2xl",
  shadow = "panel",
  variant = "default",
}: SurfacePanelClassNameOptions = {}) {
  return cx(
    "border border-stone-200 backdrop-blur-md dark:border-stone-800",
    VARIANT_CLASSES[variant],
    SHADOW_CLASSES[shadow],
    ROUNDED_CLASSES[rounded],
    interactive &&
      "transition-all duration-300 hover:-translate-y-1 hover:bg-white dark:hover:bg-stone-800/55",
    className,
  );
}

type SurfacePanelProps = HTMLAttributes<HTMLElement> & {
  as?: SurfacePanelTag;
  interactive?: boolean;
  rounded?: SurfacePanelRounded;
  shadow?: SurfacePanelShadow;
  variant?: SurfacePanelVariant;
};

export function SurfacePanel({
  as = "div",
  className,
  interactive = false,
  rounded = "2xl",
  shadow = "panel",
  variant = "default",
  ...props
}: SurfacePanelProps) {
  const Component = as;

  return (
    <Component
      className={surfacePanelClassName({
        className,
        interactive,
        rounded,
        shadow,
        variant,
      })}
      {...props}
    />
  );
}
