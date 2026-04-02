import type { TranslationKey } from "@/lib/i18n";
import type { EntryFavoriteErrorCode, EntryReportReason } from "./entryActions";

export type EntryActionNotice = {
  message: string;
  tone: "error" | "success";
} | null;

export type EntryLockedAction = "favorite" | "report" | null;
export type EntryLockedActionName = Exclude<EntryLockedAction, null>;

export type EntryActionBarState = {
  activeLockedAction: EntryLockedAction;
  isReportOpen: boolean;
  isShareOpen: boolean;
  reportNotice: EntryActionNotice;
  shareNotice: EntryActionNotice;
};

export type EntryActionBarAction =
  | { type: "closeReportPanel" }
  | { type: "favoriteClicked" }
  | {
      lockedAction: EntryLockedActionName;
      type: "setLockedActionVisibility";
      visible: boolean;
    }
  | { notice: EntryActionNotice; type: "setReportNotice" }
  | { notice: EntryActionNotice; type: "setShareNotice" }
  | { notice: NonNullable<EntryActionNotice>; type: "reportSubmitted" }
  | { type: "toggleReportPanel" }
  | { type: "toggleSharePanel" };

export const ENTRY_REPORT_REASON_LABEL_KEYS: Record<
  EntryReportReason,
  TranslationKey
> = {
  typo: "entry.actions.reason.typo",
  translation: "entry.actions.reason.translation",
  grammar: "entry.actions.reason.grammar",
  relation: "entry.actions.reason.relation",
  other: "entry.actions.reason.other",
};

export const ENTRY_FAVORITE_ERROR_LABEL_KEYS: Record<
  EntryFavoriteErrorCode,
  TranslationKey
> = {
  "load-failed": "entry.actions.favoriteError.loadFailed",
  "not-configured": "entry.actions.favoriteError.notConfigured",
  unavailable: "entry.actions.favoriteError.unavailable",
  "update-failed": "entry.actions.favoriteError.updateFailed",
};

export function createEntryActionBarInitialState(): EntryActionBarState {
  return {
    activeLockedAction: null,
    isReportOpen: false,
    isShareOpen: false,
    reportNotice: null,
    shareNotice: null,
  };
}

export function entryActionBarReducer(
  state: EntryActionBarState,
  action: EntryActionBarAction,
): EntryActionBarState {
  switch (action.type) {
    case "toggleSharePanel":
      return {
        ...state,
        activeLockedAction: null,
        isReportOpen: false,
        isShareOpen: !state.isShareOpen,
        reportNotice: null,
        shareNotice: null,
      };
    case "toggleReportPanel":
      return {
        ...state,
        activeLockedAction: null,
        isReportOpen: !state.isReportOpen,
        isShareOpen: false,
        reportNotice: null,
        shareNotice: null,
      };
    case "favoriteClicked":
      return {
        ...state,
        activeLockedAction: null,
        reportNotice: null,
        shareNotice: null,
      };
    case "setLockedActionVisibility":
      return {
        ...state,
        activeLockedAction: action.visible
          ? action.lockedAction
          : state.activeLockedAction === action.lockedAction
            ? null
            : state.activeLockedAction,
      };
    case "setShareNotice":
      return {
        ...state,
        shareNotice: action.notice,
      };
    case "setReportNotice":
      return {
        ...state,
        reportNotice: action.notice,
      };
    case "reportSubmitted":
      return {
        ...state,
        isReportOpen: false,
        reportNotice: action.notice,
      };
    case "closeReportPanel":
      return {
        ...state,
        isReportOpen: false,
      };
    default:
      return state;
  }
}
