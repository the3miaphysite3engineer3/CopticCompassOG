"use client";

import { useLanguage } from "@/components/LanguageProvider";
import type { Language } from "@/types/i18n";

import {
  buildEntryShareLinks,
  buildEntrySharePayload,
  resolveEntryShareUrl,
} from "./entryShare";

import type { LexicalEntry } from "../types";
import type { EntryActionNotice } from "./entryActionBar";

type UseEntryShareActionsOptions = {
  entry: LexicalEntry;
  language: Language;
  onNoticeChange: (notice: EntryActionNotice) => void;
  parentEntry: LexicalEntry | null;
  relatedEntries: readonly LexicalEntry[];
};

/**
 * Builds the localized share payload and exposes clipboard/native-share
 * handlers for a dictionary entry.
 */
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

  /**
   * Copies share content to the clipboard and reports the result through the
   * action-bar notice channel.
   */
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

  /**
   * Copies the canonical entry URL only.
   */
  async function copyLink() {
    await writeToClipboard(
      sharePayload.url,
      t("entry.actions.shareLinkCopied"),
    );
  }

  /**
   * Copies the full share text plus URL.
   */
  async function copyText() {
    await writeToClipboard(
      sharePayload.copyText,
      t("entry.actions.shareTextCopied"),
    );
  }

  /**
   * Invokes the browser native share sheet when available.
   */
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
