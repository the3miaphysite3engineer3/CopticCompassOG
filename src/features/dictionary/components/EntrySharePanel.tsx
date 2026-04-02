"use client";

import { Copy, Facebook, Link2, Linkedin, Share2 } from "lucide-react";
import { FaXTwitter } from "react-icons/fa6";
import { useLanguage } from "@/components/LanguageProvider";
import { StatusNotice } from "@/components/StatusNotice";
import {
  buildEntryShareLinks,
  type EntrySharePayload,
} from "../lib/entryShare";
import type { EntryActionNotice } from "../lib/entryActionBar";

type EntrySharePanelProps = {
  canUseNativeShare: boolean;
  notice: EntryActionNotice;
  onCopyLink: () => void;
  onCopyText: () => void;
  onNativeShare: () => void;
  shareLinks: ReturnType<typeof buildEntryShareLinks>;
  sharePayload: EntrySharePayload;
};

export function EntrySharePanel({
  canUseNativeShare,
  notice,
  onCopyLink,
  onCopyText,
  onNativeShare,
  shareLinks,
  sharePayload,
}: EntrySharePanelProps) {
  const { t } = useLanguage();

  return (
    <div className="rounded-2xl border border-sky-200 bg-sky-50/75 p-5 shadow-sm backdrop-blur-md dark:border-sky-900/40 dark:bg-sky-950/20">
      <div className="mb-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-stone-800 dark:text-stone-200">
          <Share2 className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          {t("entry.actions.shareTitle")}
        </h3>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600 dark:text-stone-400">
          {t("entry.actions.shareDescription")}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm dark:border-stone-800/70 dark:bg-stone-950/40">
          <p className="text-xs font-semibold uppercase tracking-widest text-sky-700 dark:text-sky-300">
            {t("entry.actions.sharePreviewLabel")}
          </p>
          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-stone-700 dark:text-stone-300">
            {sharePayload.text}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {canUseNativeShare ? (
            <button
              type="button"
              className="btn-secondary justify-center gap-2 px-4"
              onClick={onNativeShare}
            >
              <Share2 className="h-4 w-4" />
              {t("entry.actions.shareNative")}
            </button>
          ) : null}

          <button
            type="button"
            className="btn-secondary justify-center gap-2 px-4"
            onClick={onCopyText}
          >
            <Copy className="h-4 w-4" />
            {t("entry.actions.shareCopyText")}
          </button>

          <button
            type="button"
            className="btn-secondary justify-center gap-2 px-4"
            onClick={onCopyLink}
          >
            <Link2 className="h-4 w-4" />
            {t("entry.actions.shareCopyLink")}
          </button>

          <a
            href={shareLinks.x}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary justify-center gap-2 px-4"
          >
            <FaXTwitter className="h-4 w-4" />
            {t("entry.actions.sharePlatformX")}
          </a>

          <a
            href={shareLinks.facebook}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary justify-center gap-2 px-4"
          >
            <Facebook className="h-4 w-4" />
            {t("entry.actions.sharePlatformFacebook")}
          </a>

          <a
            href={shareLinks.linkedin}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary justify-center gap-2 px-4"
          >
            <Linkedin className="h-4 w-4" />
            {t("entry.actions.sharePlatformLinkedIn")}
          </a>
        </div>
      </div>

      {notice ? (
        <div className="mt-4">
          <StatusNotice tone={notice.tone} align="left">
            {notice.message}
          </StatusNotice>
        </div>
      ) : null}
    </div>
  );
}
