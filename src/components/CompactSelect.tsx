import { FormLabel } from "@/components/FormField";
import { cx } from "@/lib/classes";

import type { ReactNode, SelectHTMLAttributes } from "react";

type CompactSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: ReactNode;
  labelClassName?: string;
  wrapperClassName?: string;
};

export function CompactSelect({
  children,
  className,
  id,
  label,
  labelClassName,
  wrapperClassName,
  ...props
}: CompactSelectProps) {
  return (
    <div className={cx("flex items-center gap-2", wrapperClassName)}>
      <FormLabel htmlFor={id} tone="muted" className={labelClassName}>
        {label}
      </FormLabel>
      <select
        {...props}
        id={id}
        className={cx("compact-select-base", className)}
      >
        {children}
      </select>
    </div>
  );
}
