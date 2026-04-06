"use server";

import {
  buildContentReleaseEmailHtml,
  buildContentReleaseEmailText,
  deriveContentReleaseType,
  getContentReleaseCopyForLocale,
  isContentReleaseAudienceSegment,
  isContentReleaseDeletableStatus,
  isContentReleaseEditableStatus,
  isContentReleaseLocaleMode,
} from "@/features/communications/lib/releases";
import { getContentReleaseCandidateMap } from "@/features/communications/lib/releaseCandidates";
import { dispatchLoggedNotificationEmail } from "@/lib/notifications/events";
import { getNotificationEmailEnv } from "@/lib/notifications/config";
import { revalidateAdminPaths } from "@/lib/server/revalidation";
import { invokeSupabaseEdgeFunction } from "@/lib/supabase/functions";
import { getValidatedAdminContext } from "./shared";
import {
  createContentReleaseItemSnapshots,
  createContentReleaseRecord,
  deleteContentReleaseRecord,
  loadContentReleaseForDelivery,
  loadContentReleaseStatusRecord,
  queueContentReleaseDeliveryRecord,
  revertQueuedContentReleaseRecord,
  updateContentReleaseStatusRecord,
} from "./releasePersistence";
import {
  getFormString,
  hasLengthInRange,
  isUuid,
  normalizeMultiline,
  normalizeWhitespace,
} from "@/lib/validation";
import type { Language } from "@/types/i18n";
import type {
  ContentReleaseDraftState,
  DeleteContentReleaseState,
  SendContentReleaseState,
} from "./states";

export async function createContentReleaseDraft(
  _prevState: ContentReleaseDraftState | null,
  formData: FormData,
): Promise<ContentReleaseDraftState> {
  const adminContext = await getValidatedAdminContext();
  if (!adminContext) {
    return {
      success: false,
      error: "Release drafts are unavailable right now.",
    };
  }

  const { supabase } = adminContext;
  const audienceSegment = normalizeWhitespace(
    getFormString(formData, "audience_segment"),
  );
  const localeMode = normalizeWhitespace(
    getFormString(formData, "locale_mode"),
  );
  const subjectEn = normalizeWhitespace(getFormString(formData, "subject_en"));
  const subjectNl = normalizeWhitespace(getFormString(formData, "subject_nl"));
  const bodyEn = normalizeMultiline(getFormString(formData, "body_en"));
  const bodyNl = normalizeMultiline(getFormString(formData, "body_nl"));
  const selectedItems = formData
    .getAll("release_item")
    .filter((value): value is string => typeof value === "string")
    .map((value) => normalizeWhitespace(value))
    .filter((value) => value.length > 0);

  if (
    !isContentReleaseAudienceSegment(audienceSegment) ||
    !isContentReleaseLocaleMode(localeMode)
  ) {
    return {
      success: false,
      error: "Choose a valid audience segment and locale mode.",
    };
  }

  if (selectedItems.length === 0) {
    return {
      success: false,
      error: "Select at least one lesson or publication for this release.",
    };
  }

  const candidateMap = getContentReleaseCandidateMap();
  const resolvedItems = selectedItems
    .map((selectedItem) => candidateMap.get(selectedItem) ?? null)
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (resolvedItems.length !== selectedItems.length) {
    return {
      success: false,
      error: "One or more selected release items could not be found.",
    };
  }

  const releaseType = deriveContentReleaseType(
    resolvedItems.map((item) => item.itemType),
  );

  if (!releaseType) {
    return {
      success: false,
      error: "Could not determine the release type from the selected items.",
    };
  }

  const requiresEnglish =
    localeMode === "localized" || localeMode === "en_only";
  const requiresDutch = localeMode === "localized" || localeMode === "nl_only";

  if (
    (requiresEnglish &&
      (!hasLengthInRange(subjectEn, { min: 1, max: 160 }) ||
        !hasLengthInRange(bodyEn, { min: 1, max: 8000 }))) ||
    (requiresDutch &&
      (!hasLengthInRange(subjectNl, { min: 1, max: 160 }) ||
        !hasLengthInRange(bodyNl, { min: 1, max: 8000 })))
  ) {
    return {
      success: false,
      error:
        "Provide the required localized subject and message copy for this release.",
    };
  }

  const { data: release, error: releaseError } =
    await createContentReleaseRecord({
      audienceSegment,
      bodyEn: bodyEn || null,
      bodyNl: bodyNl || null,
      localeMode,
      releaseType,
      subjectEn: subjectEn || null,
      subjectNl: subjectNl || null,
      supabase,
    });

  if (releaseError || !release) {
    console.error("Error creating content release draft:", releaseError);
    return {
      success: false,
      error: "Could not create the content release draft.",
    };
  }

  const { error: itemsError } = await createContentReleaseItemSnapshots({
    releaseId: release.id,
    resolvedItems,
    supabase,
  });

  if (itemsError) {
    console.error("Error storing content release draft items:", itemsError);
    return {
      success: false,
      error:
        "The release draft was created, but its content items could not be stored cleanly.",
    };
  }

  revalidateAdminPaths();
  return { success: true };
}

export async function updateContentReleaseStatus(formData: FormData) {
  const adminContext = await getValidatedAdminContext();
  if (!adminContext) {
    console.warn(
      "Content release review skipped because Supabase is not configured.",
    );
    return;
  }

  const { supabase, user } = adminContext;
  const releaseId = normalizeWhitespace(getFormString(formData, "release_id"));
  const status = normalizeWhitespace(getFormString(formData, "status"));

  if (!isUuid(releaseId) || !isContentReleaseEditableStatus(status)) {
    console.warn("Rejected invalid content release review payload", {
      releaseId,
      status,
      userId: user.id,
    });
    return;
  }

  const { error } = await updateContentReleaseStatusRecord({
    releaseId,
    status,
    supabase,
  });

  if (error) {
    console.error("Error updating content release status:", error);
  }

  revalidateAdminPaths();
}

export async function deleteContentReleaseDraft(
  _prevState: DeleteContentReleaseState | null,
  formData: FormData,
): Promise<DeleteContentReleaseState> {
  const adminContext = await getValidatedAdminContext();
  if (!adminContext) {
    return {
      success: false,
      message: "Draft cleanup is unavailable right now.",
    };
  }

  const { supabase, user } = adminContext;
  const releaseId = normalizeWhitespace(getFormString(formData, "release_id"));

  if (!isUuid(releaseId)) {
    console.warn("Rejected invalid content release deletion payload", {
      releaseId,
      userId: user.id,
    });
    return {
      success: false,
      message: "Choose a valid draft before deleting it.",
    };
  }

  const { data: release, error: releaseError } =
    await loadContentReleaseStatusRecord({
      releaseId,
      supabase,
    });

  if (releaseError || !release) {
    console.error("Error loading content release draft for deletion:", {
      releaseError,
      releaseId,
      userId: user.id,
    });
    return {
      success: false,
      message: "Could not load that release draft.",
    };
  }

  if (!isContentReleaseDeletableStatus(release.status)) {
    return {
      success: false,
      message:
        "Only draft or cancelled releases can be deleted. Sent and in-flight releases stay in history.",
    };
  }

  const { data: deletedRelease, error: deleteError } =
    await deleteContentReleaseRecord({
      releaseId,
      supabase,
    });

  if (deleteError) {
    console.error("Error deleting content release draft:", {
      deleteError,
      releaseId,
      userId: user.id,
    });
    return {
      success: false,
      message: "Could not delete this release draft.",
    };
  }

  if (!deletedRelease) {
    console.error("No content release draft was deleted.", {
      releaseId,
      userId: user.id,
    });
    return {
      success: false,
      message:
        "This draft could not be deleted yet. Make sure the latest content release permissions migration has been applied.",
    };
  }

  revalidateAdminPaths();
  return {
    success: true,
    message: "Release draft deleted.",
  };
}

export async function sendContentRelease(
  _prevState: SendContentReleaseState | null,
  formData: FormData,
): Promise<SendContentReleaseState> {
  const adminContext = await getValidatedAdminContext();
  if (!adminContext) {
    return {
      success: false,
      message: "Release sending is unavailable right now.",
    };
  }

  const { supabase, user } = adminContext;
  const releaseId = normalizeWhitespace(getFormString(formData, "release_id"));

  if (!isUuid(releaseId)) {
    return {
      success: false,
      message: "Choose a valid release draft before sending.",
    };
  }

  const deliveryContext = await loadContentReleaseForDelivery(
    releaseId,
    supabase,
  );
  if (!deliveryContext) {
    return {
      success: false,
      message: "Could not load that release draft.",
    };
  }
  const { items: releaseItems, release } = deliveryContext;
  const isResumingQueuedRelease = release.status === "queued";

  if (isResumingQueuedRelease) {
    // Keep the current cursor/summary so stalled batch chains can be resumed safely.
  } else {
    if (release.status === "sending") {
      return {
        success: false,
        message: "This release is already being delivered in the background.",
      };
    }

    if (release.status === "sent") {
      return {
        success: false,
        message: "This release has already been delivered.",
      };
    }

    if (release.status !== "approved") {
      return {
        success: false,
        message: "Approve the release draft before sending it.",
      };
    }

    const { error: queueError } = await queueContentReleaseDeliveryRecord({
      itemCount: releaseItems.length,
      release,
      releaseId,
      requestedBy: user.id,
      supabase,
    });

    if (queueError) {
      console.error("Error queueing content release delivery:", queueError);
      return {
        success: false,
        message: "Could not queue this release for delivery.",
      };
    }
  }

  const invokeResult = await invokeSupabaseEdgeFunction(
    "process-content-release",
    {
      releaseId,
    },
  );

  if (!invokeResult.success) {
    const { error: revertError } = await revertQueuedContentReleaseRecord({
      isResumingQueuedRelease,
      releaseId,
      supabase,
    });

    if (revertError) {
      console.error(
        "Error reverting content release queue state:",
        revertError,
      );
    }

    revalidateAdminPaths();

    return {
      success: false,
      message: "The background release worker could not be started right now.",
    };
  }

  revalidateAdminPaths();

  return {
    success: true,
    message: isResumingQueuedRelease
      ? "Queued release resumed. Delivery will continue in the background."
      : "Release queued. Delivery will continue in the background.",
  };
}

export async function sendContentReleasePreview(
  _prevState: SendContentReleaseState | null,
  formData: FormData,
): Promise<SendContentReleaseState> {
  const adminContext = await getValidatedAdminContext();
  if (!adminContext) {
    return {
      success: false,
      message: "Release previews are unavailable right now.",
    };
  }

  const env = getNotificationEmailEnv();
  if (!env?.ownerAlertEmail) {
    return {
      success: false,
      message: "Release preview sending is not configured yet.",
    };
  }

  const { supabase } = adminContext;
  const releaseId = normalizeWhitespace(getFormString(formData, "release_id"));
  const previewLocaleRaw = normalizeWhitespace(
    getFormString(formData, "preview_locale"),
  );
  const previewLocale: Language = previewLocaleRaw === "nl" ? "nl" : "en";

  if (!isUuid(releaseId)) {
    return {
      success: false,
      message: "Choose a valid release draft before sending a preview.",
    };
  }

  const deliveryContext = await loadContentReleaseForDelivery(
    releaseId,
    supabase,
  );
  if (!deliveryContext) {
    return {
      success: false,
      message: "Could not load that release draft preview.",
    };
  }
  const { items: releaseItems, release } = deliveryContext;

  const copy = getContentReleaseCopyForLocale(release, previewLocale);
  if (!copy.subject || !copy.body) {
    return {
      success: false,
      message: "That locale does not have complete release copy yet.",
    };
  }

  const result = await dispatchLoggedNotificationEmail({
    aggregateId: releaseId,
    aggregateType: "content_release",
    eventType: "content_release_test_sent",
    payload: {
      audience_segment: release.audience_segment,
      item_count: releaseItems.length,
      locale: copy.language,
      locale_mode: release.locale_mode,
      preview: "true",
      release_type: release.release_type,
    },
    subject: `[Coptic Compass Preview] ${copy.subject}`,
    html: buildContentReleaseEmailHtml({
      body: copy.body,
      items: releaseItems,
      language: copy.language,
      subject: `[Coptic Compass Preview] ${copy.subject}`,
    }),
    text: buildContentReleaseEmailText({
      body: copy.body,
      items: releaseItems,
      language: copy.language,
    }),
    to: env.ownerAlertEmail,
  });

  revalidateAdminPaths();

  if (!result.success) {
    return {
      success: false,
      message: "The preview email could not be sent right now.",
    };
  }

  return {
    success: true,
    message: `Preview sent to ${env.ownerAlertEmail}.`,
  };
}
