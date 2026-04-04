"use client";

import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/Badge";
import { surfacePanelClassName } from "@/components/SurfacePanel";
import { usePersistentDisclosureState } from "@/features/admin/lib/uiState";

export function AdminPersistentSection({
  defaultOpen = false,
  children,
  description,
  headerBadges,
  id,
  summary,
  title,
}: {
  defaultOpen?: boolean;
  children: React.ReactNode;
  description: string;
  headerBadges?: React.ReactNode;
  id: string;
  summary: string;
  title: string;
}) {
  const [isOpen, setIsOpen] = usePersistentDisclosureState(
    `admin-section:${id}`,
    defaultOpen,
  );

  return (
    <details
      id={id}
      className={surfacePanelClassName({
        rounded: "4xl",
        variant: "elevated",
        className: "group app-anchor-section overflow-hidden",
      })}
      open={isOpen}
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
    >
      <summary className="flex cursor-pointer list-none items-start justify-between gap-5 p-6 [&::-webkit-details-marker]:hidden md:p-8">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
              {title}
            </h2>
            <Badge tone="surface" size="xs">
              {summary}
            </Badge>
          </div>

          <p className="mt-2 max-w-3xl text-stone-600 dark:text-stone-400">
            {description}
          </p>

          {headerBadges ? (
            <div className="mt-4 flex flex-wrap gap-2">{headerBadges}</div>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-3 text-sm font-medium text-stone-500 dark:text-stone-400">
          <span className="group-open:hidden">Open</span>
          <span className="hidden group-open:inline">Collapse</span>
          <ChevronDown className="h-5 w-5 transition-transform duration-200 group-open:rotate-180" />
        </div>
      </summary>

      <div className="border-t border-stone-200/80 p-6 dark:border-stone-800 md:p-8">
        {children}
      </div>
    </details>
  );
}
