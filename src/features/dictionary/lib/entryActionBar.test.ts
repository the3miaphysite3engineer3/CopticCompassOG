import { describe, expect, it } from "vitest";

import {
  createEntryActionBarInitialState,
  entryActionBarReducer,
} from "./entryActionBar";

describe("entry action bar reducer", () => {
  it("toggles the share panel while clearing notices and closing the report panel", () => {
    const nextState = entryActionBarReducer(
      {
        activeLockedAction: "report",
        isReportOpen: true,
        isShareOpen: false,
        reportNotice: {
          message: "Report saved",
          tone: "success",
        },
        shareNotice: {
          message: "Copied",
          tone: "success",
        },
      },
      { type: "toggleSharePanel" },
    );

    expect(nextState).toEqual({
      activeLockedAction: null,
      isReportOpen: false,
      isShareOpen: true,
      reportNotice: null,
      shareNotice: null,
    });
  });

  it("keeps the current panels in place when the favorite button is used", () => {
    const nextState = entryActionBarReducer(
      {
        activeLockedAction: "favorite",
        isReportOpen: false,
        isShareOpen: true,
        reportNotice: {
          message: "Report saved",
          tone: "success",
        },
        shareNotice: {
          message: "Copied",
          tone: "success",
        },
      },
      { type: "favoriteClicked" },
    );

    expect(nextState).toEqual({
      activeLockedAction: null,
      isReportOpen: false,
      isShareOpen: true,
      reportNotice: null,
      shareNotice: null,
    });
  });

  it("stores a submitted report notice and closes the report panel", () => {
    const nextState = entryActionBarReducer(
      {
        ...createEntryActionBarInitialState(),
        isReportOpen: true,
      },
      {
        notice: {
          message: "Thanks for the report",
          tone: "success",
        },
        type: "reportSubmitted",
      },
    );

    expect(nextState).toEqual({
      activeLockedAction: null,
      isReportOpen: false,
      isShareOpen: false,
      reportNotice: {
        message: "Thanks for the report",
        tone: "success",
      },
      shareNotice: null,
    });
  });

  it("only clears the matching locked action when a tooltip closes", () => {
    const nextState = entryActionBarReducer(
      {
        ...createEntryActionBarInitialState(),
        activeLockedAction: "favorite",
      },
      {
        lockedAction: "report",
        type: "setLockedActionVisibility",
        visible: false,
      },
    );

    expect(nextState.activeLockedAction).toBe("favorite");
  });
});
