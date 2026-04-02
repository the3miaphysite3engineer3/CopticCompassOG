"use client";

import { useLanguage } from "@/components/LanguageProvider";
import type { Language } from "@/types/i18n";
import type { LexicalEntry } from "../types";
import type { EntryActionNotice } from "./entryActionBar";
import {
  buildEntryShareLinks,
  buildEntrySharePayload,
  resolveEntryShareUrl,
} from "./entryShare";

type UseEntryShareActionsOptions = {
  entry: LexicalEntry;
  language: Language;
  onNoticeChange: (notice: EntryActionNotice) => void;
  parentEntry: LexicalEntry | null;
  relatedEntries: readonly LexicalEntry[];
};

export function useEntryShareActions({
  entry,
  language,
  onNoticeChange,
  parentEntry,
  relatedEntries,
}: UseEntryShareActionsOptions) {
  const { t } = useLanguage();
  const sharePayload = buildEntrySharePayload({
    entry,
    language,
    parentEntry,
    relatedEntries,
    url: resolveEntryShareUrl(
      entry.id,
      language,
      typeof window !== "undefined" ? window.location.href : undefined,
    ),
  });
  const shareLinks = buildEntryShareLinks(sharePayload);
  const canUseNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  async function writeToClipboard(value: string, successMessage: string) {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      onNoticeChange({
        message: t("entry.actions.shareCopyFailed"),
        tone: "error",
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      onNoticeChange({
        message: successMessage,
        tone: "success",
      });
    } catch {
      onNoticeChange({
        message: t("entry.actions.shareCopyFailed"),
        tone: "error",
      });
    }
  }

  async function copyLink() {
    await writeToClipboard(
      sharePayload.url,
      t("entry.actions.shareLinkCopied"),
    );
  }

  async function copyText() {
    await writeToClipboard(
      sharePayload.copyText,
      t("entry.actions.shareTextCopied"),
    );
  }

  async function nativeShare() {
    if (
      typeof navigator === "undefined" ||
      typeof navigator.share !== "function"
    ) {
      return;
    }

    try {
      await navigator.share({
        text: sharePayload.text,
        title: sharePayload.title,
        url: sharePayload.url,
      });
      onNoticeChange(null);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      onNoticeChange({
        message: t("entry.actions.shareNativeFailed"),
        tone: "error",
      });
    }
  }

  return {
    canUseNativeShare,
    copyLink,
    copyText,
    nativeShare,
    shareLinks,
    sharePayload,
  };
}
