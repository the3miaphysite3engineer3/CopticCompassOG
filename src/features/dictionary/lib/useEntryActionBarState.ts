"use client";

import { useReducer } from "react";

import {
  createEntryActionBarInitialState,
  entryActionBarReducer,
  type EntryActionNotice,
  type EntryLockedActionName,
} from "./entryActionBar";

/**
 * Wraps the entry action-bar reducer with stable event handlers for the share,
 * report, and auth-locked interactions used by the entry UI.
 */
export function useEntryActionBarState() {
  const [state, dispatch] = useReducer(
    entryActionBarReducer,
    undefined,
    createEntryActionBarInitialState,
  );

  return {
    ...state,
    closeReportPanel() {
      dispatch({ type: "closeReportPanel" });
    },
    handleFavoriteClick() {
      dispatch({ type: "favoriteClicked" });
    },
    handleLockedActionOpenChange(
      lockedAction: EntryLockedActionName,
      visible: boolean,
    ) {
      dispatch({
        lockedAction,
        type: "setLockedActionVisibility",
        visible,
      });
    },
    handleReportSubmitted(notice: NonNullable<EntryActionNotice>) {
      dispatch({
        notice,
        type: "reportSubmitted",
      });
    },
    setReportNotice(notice: EntryActionNotice) {
      dispatch({
        notice,
        type: "setReportNotice",
      });
    },
    setShareNotice(notice: EntryActionNotice) {
      dispatch({
        notice,
        type: "setShareNotice",
      });
    },
    toggleReportPanel() {
      dispatch({ type: "toggleReportPanel" });
    },
    toggleSharePanel() {
      dispatch({ type: "toggleSharePanel" });
    },
  };
}
