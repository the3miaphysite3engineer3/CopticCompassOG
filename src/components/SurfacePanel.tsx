import { cx } from "@/lib/classes";

import type { HTMLAttributes } from "react";

type SurfacePanelVariant = "default" | "subtle" | "elevated";
type SurfacePanelShadow = "soft" | "panel" | "float";
type SurfacePanelRounded = "2xl" | "3xl";
type SurfacePanelTag = "article" | "div" | "section";

type SurfacePanelClassNameOptions = {
  className?: string;
  interactive?: boolean;
  rounded?: SurfacePanelRounded;
  shadow?: SurfacePanelShadow;
  variant?: SurfacePanelVariant;
};

const VARIANT_CLASSES: Record<SurfacePanelVariant, string> = {
  default: "bg-surface/75",
  subtle: "bg-surface/60",
  elevated: "bg-surface/90",
};

const SHADOW_CLASSES: Record<SurfacePanelShadow, string> = {
  soft: "shadow-soft",
  panel: "shadow-panel",
  float: "shadow-lg shadow-stone-950/10 dark:shadow-black/25",
};

const ROUNDED_CLASSES: Record<SurfacePanelRounded, string> = {
  "2xl": "rounded-2xl",
  "3xl": "rounded-3xl",
};

export function surfacePanelClassName({
  className,
  interactive = false,
  rounded = "2xl",
  shadow = "panel",
  variant = "default",
}: SurfacePanelClassNameOptions = {}) {
  return cx(
    "border border-line/80 backdrop-blur-md",
    VARIANT_CLASSES[variant],
    SHADOW_CLASSES[shadow],
    ROUNDED_CLASSES[rounded],
    interactive &&
      "transition-all duration-300 hover:-translate-y-1 hover:border-accent/25 hover:bg-surface/95",
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
