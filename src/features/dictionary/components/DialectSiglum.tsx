"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { MicroTooltip } from "@/components/MicroTooltip";
import { getDialectLabelKey } from "@/features/dictionary/config";

type DialectSiglumProps = {
  siglum?: string;
};

export default function DialectSiglum({ siglum }: DialectSiglumProps) {
  const { t } = useLanguage();

  if (!siglum) {
    return null;
  }

  const labelKey = getDialectLabelKey(siglum);
  const fullName = labelKey ? t(labelKey) : siglum;
  const tooltip = fullName === siglum ? siglum : `${fullName} (${siglum})`;
  const className = "leading-none whitespace-nowrap";

  if (siglum.length === 2 && /^[A-Z][abfl]$/.test(siglum)) {
    return (
      <MicroTooltip alignItems="center" className={className} label={tooltip}>
        {siglum[0]}
        <sup className="ml-0.5 align-super text-[0.7em] italic font-normal">
          {siglum[1]}
        </sup>
      </MicroTooltip>
    );
  }

  return (
    <MicroTooltip alignItems="center" className={className} label={tooltip}>
      {siglum}
    </MicroTooltip>
  );
}
