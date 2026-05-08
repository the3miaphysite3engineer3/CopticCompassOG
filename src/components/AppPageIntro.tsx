import {
  BreadcrumbTrail,
  type BreadcrumbTrailItem,
} from "@/components/BreadcrumbTrail";
import { PageHeader, type PageHeaderTone } from "@/components/PageHeader";
import { cx } from "@/lib/classes";

import type { ReactNode } from "react";

type AppPageIntroSpacing = "standard" | "compact";
type AppPageIntroAlign = "left" | "center";
type AppPageIntroActionsPlacement = "inline" | "below";

type AppPageIntroProps = {
  actions?: ReactNode;
  actionsClassName?: string;
  actionsPlacement?: AppPageIntroActionsPlacement;
  align?: AppPageIntroAlign;
  breadcrumbs: readonly BreadcrumbTrailItem[];
  className?: string;
  description?: ReactNode;
  spacing?: AppPageIntroSpacing;
  title: ReactNode;
  tone?: PageHeaderTone;
};

const BOTTOM_SPACING_CLASSES: Record<AppPageIntroSpacing, string> = {
  standard: "mb-8 md:mb-10",
  compact: "mb-5 md:mb-6",
};

export function AppPageIntro({
  actions,
  actionsClassName,
  actionsPlacement = "inline",
  align = "left",
  breadcrumbs,
  className,
  description,
  spacing = "standard",
  title,
  tone = "brand",
}: AppPageIntroProps) {
  const centered = align === "center";
  const actionsBelow = actionsPlacement === "below";
  let contentLayoutClass = "md:flex-row md:items-start md:justify-between";
  let actionsLayoutClass = "md:pt-1";

  if (centered) {
    contentLayoutClass = "items-center";
    actionsLayoutClass = "justify-center";
  } else if (actionsBelow) {
    contentLayoutClass = "items-start";
    actionsLayoutClass = "w-full justify-start";
  }

  return (
    <header
      className={cx(
        "space-y-4 md:space-y-5",
        BOTTOM_SPACING_CLASSES[spacing],
        className,
      )}
    >
      <BreadcrumbTrail items={breadcrumbs} />

      <div className={cx("flex flex-col gap-4", contentLayoutClass)}>
        <PageHeader
          align={align}
          className={cx("min-w-0 max-w-3xl", centered ? "mx-auto" : "flex-1")}
          description={description}
          size="workspace"
          title={title}
          tone={tone}
        />

        {actions ? (
          <div
            className={cx(
              "flex shrink-0 flex-wrap items-center gap-3",
              actionsLayoutClass,
              actionsClassName,
            )}
          >
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}
