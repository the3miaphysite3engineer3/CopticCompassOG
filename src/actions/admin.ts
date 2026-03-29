'use server'

import {
  buildContentReleaseEmailText,
  deriveContentReleaseType,
  getContentReleaseCopyForLocale,
  isContentReleaseAudienceSegment,
  isContentReleaseEditableStatus,
  isContentReleaseLocaleMode,
} from '@/features/communications/lib/releases'
import { getContentReleaseCandidateMap } from '@/features/communications/lib/releaseCandidates'
import {
  hasResendAudienceEnv,
  syncStoredAudienceContactToResend,
} from '@/lib/communications/resend'
import { formatLessonSlug } from '@/features/submissions/utils'
import { getAdminServerContext } from '@/lib/supabase/auth'
import { PUBLIC_LOCALES, getDashboardPath } from '@/lib/locale'
import { getNotificationEmailEnv } from '@/lib/notifications/config'
import { dispatchLoggedNotificationEmail } from '@/lib/notifications/events'
import { hasSupabaseRuntimeEnv } from '@/lib/supabase/config'
import { invokeSupabaseEdgeFunction } from '@/lib/supabase/functions'
import { revalidatePath } from 'next/cache'
import {
  isContactMessageStatus,
  type ContactMessageStatus,
} from '@/features/contact/lib/contact'
import {
  isEntryReportStatus,
  type EntryReportStatus,
} from '@/features/dictionary/lib/entryActions'
import {
  getFormString,
  hasLengthInRange,
  isUuid,
  normalizeMultiline,
  normalizeWhitespace,
  parseBoundedInteger,
} from '@/lib/validation'
import type { SubmissionUpdate } from '@/features/submissions/types'
import type { Language } from '@/types/i18n'

export type ContentReleaseDraftState = {
  error?: string
  success: boolean
}

export type SendContentReleaseState = {
  message?: string
  success: boolean
}

export type SyncAudienceContactsState = {
  message?: string
  success: boolean
}

async function getValidatedAdminContext() {
  if (!hasSupabaseRuntimeEnv()) {
    return null
  }

  const adminContext = await getAdminServerContext()
  if (!adminContext) {
    return null
  }

  return adminContext
}

function revalidateAdminPaths() {
  revalidatePath('/admin')
  for (const locale of PUBLIC_LOCALES) {
    revalidatePath(`/${locale}/admin`)
  }
}

async function loadContentReleaseForDelivery(
  releaseId: string,
  supabase: NonNullable<Awaited<ReturnType<typeof getAdminServerContext>>>['supabase'],
) {
  const { data: release, error: releaseError } = await supabase
    .from('content_releases')
    .select('*')
    .eq('id', releaseId)
    .maybeSingle()

  if (releaseError || !release) {
    console.error('Error loading content release draft for delivery:', releaseError)
    return null
  }

  const { data: releaseItems, error: releaseItemsError } = await supabase
    .from('content_release_items')
    .select('*')
    .eq('release_id', releaseId)
    .order('created_at', { ascending: true })

  if (releaseItemsError || !releaseItems || releaseItems.length === 0) {
    console.error('Error loading content release items for delivery:', releaseItemsError)
    return null
  }

  return {
    items: releaseItems,
    release,
  }
}

export async function submitFeedback(formData: FormData) {
  const adminContext = await getValidatedAdminContext()
  if (!adminContext) {
    console.warn('Admin feedback submission skipped because Supabase is not configured.')
    return
  }

  const { supabase, user } = adminContext

  const submissionId = normalizeWhitespace(getFormString(formData, 'submission_id'))
  const rating = parseBoundedInteger(normalizeWhitespace(getFormString(formData, 'rating')), {
    min: 1,
    max: 5,
  })
  const feedback = normalizeMultiline(getFormString(formData, 'feedback'))

  if (!isUuid(submissionId) || rating === null || !hasLengthInRange(feedback, { min: 1, max: 5000 })) {
    console.warn('Rejected invalid admin feedback submission', {
      userId: user.id,
      submissionId,
      rating,
      feedbackLength: feedback.length,
    })
    return
  }

  const updates: SubmissionUpdate = {
    status: 'reviewed',
    rating,
    feedback_text: feedback,
    reviewed_at: new Date().toISOString(),
    reviewed_by: user.id,
  }

  const { error } = await supabase
    .from('submissions')
    .update(updates)
    .eq('id', submissionId)

  if (error) {
    console.error('Error submitting feedback:', error)
    return
  }

  revalidatePath('/admin')
  revalidatePath('/dashboard')
  for (const locale of PUBLIC_LOCALES) {
    revalidatePath(getDashboardPath(locale))
  }

  const { data: submission, error: submissionError } = await supabase
    .from('submissions')
    .select('exercise_id, lesson_slug, rating, submitted_language, user_id')
    .eq('id', submissionId)
    .maybeSingle()

  if (submissionError || !submission) {
    console.error('Error loading submission review notification context:', {
      submissionId,
      submissionError,
    })
    return
  }

  const { data: studentProfile, error: studentProfileError } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', submission.user_id)
    .maybeSingle()

  if (studentProfileError || !studentProfile?.email) {
    console.error('Error loading student notification recipient for reviewed submission:', {
      submissionId,
      studentProfileError,
      userId: submission.user_id,
    })
    return
  }

  const submissionLanguage: Language =
    submission.submitted_language === 'nl' ? 'nl' : 'en'
  const lessonLabel = formatLessonSlug(submission.lesson_slug)
  const greetingLine = studentProfile.full_name?.trim()
    ? submissionLanguage === 'nl'
      ? `Hallo ${studentProfile.full_name.trim()},`
      : `Hello ${studentProfile.full_name.trim()},`
    : submissionLanguage === 'nl'
      ? 'Hallo,'
      : 'Hello,'
  const reviewSummary =
    submissionLanguage === 'nl'
      ? [
          greetingLine,
          '',
          `Je oefening voor ${lessonLabel} is nagekeken.`,
          `Score: ${submission.rating ?? rating}/5`,
          ...(submission.exercise_id
            ? [`Oefening: ${submission.exercise_id}`]
            : []),
          '',
          'Feedback:',
          feedback,
          '',
          'Je kan de volledige feedback ook in je dashboard bekijken.',
        ].join('\n')
      : [
          greetingLine,
          '',
          `Your exercise submission for ${lessonLabel} has been reviewed.`,
          `Rating: ${submission.rating ?? rating}/5`,
          ...(submission.exercise_id
            ? [`Exercise: ${submission.exercise_id}`]
            : []),
          '',
          'Feedback:',
          feedback,
          '',
          'You can also review the full feedback in your dashboard.',
        ].join('\n')

  const notificationResult = await dispatchLoggedNotificationEmail({
    aggregateId: submissionId,
    aggregateType: 'submission',
    eventType: 'submission_reviewed',
    payload: {
      exercise_id: submission.exercise_id,
      lesson_slug: submission.lesson_slug,
      rating: submission.rating ?? rating,
      reviewed_by: user.id,
      user_id: submission.user_id,
    },
    to: studentProfile.email,
    subject:
      submissionLanguage === 'nl'
        ? `Feedback beschikbaar voor ${lessonLabel}`
        : `Your feedback is ready for ${lessonLabel}`,
    text: reviewSummary,
  })

  if (!notificationResult.success) {
    console.error('Failed to send reviewed submission notification to student', {
      error: notificationResult.error,
      submissionId,
      userId: submission.user_id,
    })
  }
}

export async function updateEntryReportStatus(formData: FormData) {
  const adminContext = await getValidatedAdminContext()
  if (!adminContext) {
    console.warn('Dictionary entry report review skipped because Supabase is not configured.')
    return
  }

  const { supabase, user } = adminContext
  const reportId = normalizeWhitespace(getFormString(formData, 'report_id'))
  const status = normalizeWhitespace(
    getFormString(formData, 'status'),
  ) as EntryReportStatus

  if (!isUuid(reportId) || !isEntryReportStatus(status)) {
    console.warn('Rejected invalid entry report review payload', {
      reportId,
      status,
      userId: user.id,
    })
    return
  }

  const { error } = await supabase
    .from('entry_reports')
    .update({ status })
    .eq('id', reportId)

  if (error) {
    console.error('Error updating dictionary entry report status:', error)
  }

  revalidatePath('/admin')
}

export async function createContentReleaseDraft(
  _prevState: ContentReleaseDraftState | null,
  formData: FormData,
): Promise<ContentReleaseDraftState> {
  const adminContext = await getValidatedAdminContext()
  if (!adminContext) {
    return {
      success: false,
      error: 'Release drafts are unavailable right now.',
    }
  }

  const { supabase } = adminContext
  const audienceSegment = normalizeWhitespace(
    getFormString(formData, 'audience_segment'),
  )
  const localeMode = normalizeWhitespace(getFormString(formData, 'locale_mode'))
  const subjectEn = normalizeWhitespace(getFormString(formData, 'subject_en'))
  const subjectNl = normalizeWhitespace(getFormString(formData, 'subject_nl'))
  const bodyEn = normalizeMultiline(getFormString(formData, 'body_en'))
  const bodyNl = normalizeMultiline(getFormString(formData, 'body_nl'))
  const selectedItems = formData
    .getAll('release_item')
    .filter((value): value is string => typeof value === 'string')
    .map((value) => normalizeWhitespace(value))
    .filter((value) => value.length > 0)

  if (
    !isContentReleaseAudienceSegment(audienceSegment) ||
    !isContentReleaseLocaleMode(localeMode)
  ) {
    return {
      success: false,
      error: 'Choose a valid audience segment and locale mode.',
    }
  }

  if (selectedItems.length === 0) {
    return {
      success: false,
      error: 'Select at least one lesson or publication for this release.',
    }
  }

  const candidateMap = getContentReleaseCandidateMap()
  const resolvedItems = selectedItems
    .map((selectedItem) => candidateMap.get(selectedItem) ?? null)
    .filter((item): item is NonNullable<typeof item> => item !== null)

  if (resolvedItems.length !== selectedItems.length) {
    return {
      success: false,
      error: 'One or more selected release items could not be found.',
    }
  }

  const releaseType = deriveContentReleaseType(
    resolvedItems.map((item) => item.itemType),
  )

  if (!releaseType) {
    return {
      success: false,
      error: 'Could not determine the release type from the selected items.',
    }
  }

  const requiresEnglish =
    localeMode === 'localized' || localeMode === 'en_only'
  const requiresDutch = localeMode === 'localized' || localeMode === 'nl_only'

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
        'Provide the required localized subject and message copy for this release.',
    }
  }

  const timestamp = new Date().toISOString()
  const { data: release, error: releaseError } = await supabase
    .from('content_releases')
    .insert({
      audience_segment: audienceSegment,
      body_en: bodyEn || null,
      body_nl: bodyNl || null,
      locale_mode: localeMode,
      release_type: releaseType,
      subject_en: subjectEn || null,
      subject_nl: subjectNl || null,
      updated_at: timestamp,
    })
    .select('id')
    .single()

  if (releaseError || !release) {
    console.error('Error creating content release draft:', releaseError)
    return {
      success: false,
      error: 'Could not create the content release draft.',
    }
  }

  const { error: itemsError } = await supabase
    .from('content_release_items')
    .insert(
      resolvedItems.map((item) => ({
        item_id: item.itemId,
        item_type: item.itemType,
        release_id: release.id,
        title_snapshot: item.title,
        url_snapshot: item.url,
      })),
    )

  if (itemsError) {
    console.error('Error storing content release draft items:', itemsError)
    return {
      success: false,
      error: 'The release draft was created, but its content items could not be stored cleanly.',
    }
  }

  revalidateAdminPaths()
  return { success: true }
}

export async function updateContentReleaseStatus(formData: FormData) {
  const adminContext = await getValidatedAdminContext()
  if (!adminContext) {
    console.warn('Content release review skipped because Supabase is not configured.')
    return
  }

  const { supabase, user } = adminContext
  const releaseId = normalizeWhitespace(getFormString(formData, 'release_id'))
  const status = normalizeWhitespace(getFormString(formData, 'status'))

  if (!isUuid(releaseId) || !isContentReleaseEditableStatus(status)) {
    console.warn('Rejected invalid content release review payload', {
      releaseId,
      status,
      userId: user.id,
    })
    return
  }

  const { error } = await supabase
    .from('content_releases')
    .update({
      sent_at: null,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', releaseId)

  if (error) {
    console.error('Error updating content release status:', error)
  }

  revalidateAdminPaths()
}

export async function sendContentRelease(
  _prevState: SendContentReleaseState | null,
  formData: FormData,
): Promise<SendContentReleaseState> {
  const adminContext = await getValidatedAdminContext()
  if (!adminContext) {
    return {
      success: false,
      message: 'Release sending is unavailable right now.',
    }
  }

  const { supabase, user } = adminContext
  const releaseId = normalizeWhitespace(getFormString(formData, 'release_id'))

  if (!isUuid(releaseId)) {
    return {
      success: false,
      message: 'Choose a valid release draft before sending.',
    }
  }

  const deliveryContext = await loadContentReleaseForDelivery(releaseId, supabase)
  if (!deliveryContext) {
    return {
      success: false,
      message: 'Could not load that release draft.',
    }
  }
  const { items: releaseItems, release } = deliveryContext
  const isResumingQueuedRelease = release.status === 'queued'

  if (isResumingQueuedRelease) {
    // Keep the current cursor/summary so stalled batch chains can be resumed safely.
  } else {
    if (release.status === 'sending') {
      return {
        success: false,
        message: 'This release is already being delivered in the background.',
      }
    }

    if (release.status === 'sent') {
      return {
        success: false,
        message: 'This release has already been delivered.',
      }
    }

    if (release.status !== 'approved') {
      return {
        success: false,
        message: 'Approve the release draft before sending it.',
      }
    }

    const now = new Date().toISOString()
    const { error: queueError } = await supabase
      .from('content_releases')
      .update({
        delivery_cursor: null,
        delivery_finished_at: null,
        delivery_requested_at: now,
        delivery_requested_by: user.id,
        delivery_started_at: null,
        delivery_summary: release.delivery_summary ?? {
          item_count: releaseItems.length,
        },
        last_delivery_error: null,
        sent_at: null,
        status: 'queued',
        updated_at: now,
      })
      .eq('id', releaseId)

    if (queueError) {
      console.error('Error queueing content release delivery:', queueError)
      return {
        success: false,
        message: 'Could not queue this release for delivery.',
      }
    }
  }

  const invokeResult = await invokeSupabaseEdgeFunction('process-content-release', {
    releaseId,
  })

  if (!invokeResult.success) {
    const revertTimestamp = new Date().toISOString()
    const { error: revertError } = await supabase
      .from('content_releases')
      .update({
        last_delivery_error: 'The background delivery worker could not be started.',
        status: isResumingQueuedRelease ? 'queued' : 'approved',
        updated_at: revertTimestamp,
      })
      .eq('id', releaseId)

    if (revertError) {
      console.error('Error reverting content release queue state:', revertError)
    }

    revalidateAdminPaths()

    return {
      success: false,
      message: 'The background release worker could not be started right now.',
    }
  }

  revalidateAdminPaths()

  return {
    success: true,
    message: isResumingQueuedRelease
      ? 'Queued release resumed. Delivery will continue in the background.'
      : 'Release queued. Delivery will continue in the background.',
  }
}

export async function sendContentReleasePreview(
  _prevState: SendContentReleaseState | null,
  formData: FormData,
): Promise<SendContentReleaseState> {
  const adminContext = await getValidatedAdminContext()
  if (!adminContext) {
    return {
      success: false,
      message: 'Release previews are unavailable right now.',
    }
  }

  const env = getNotificationEmailEnv()
  if (!env?.ownerAlertEmail) {
    return {
      success: false,
      message: 'Release preview sending is not configured yet.',
    }
  }

  const { supabase } = adminContext
  const releaseId = normalizeWhitespace(getFormString(formData, 'release_id'))
  const previewLocaleRaw = normalizeWhitespace(getFormString(formData, 'preview_locale'))
  const previewLocale: Language = previewLocaleRaw === 'nl' ? 'nl' : 'en'

  if (!isUuid(releaseId)) {
    return {
      success: false,
      message: 'Choose a valid release draft before sending a preview.',
    }
  }

  const deliveryContext = await loadContentReleaseForDelivery(releaseId, supabase)
  if (!deliveryContext) {
    return {
      success: false,
      message: 'Could not load that release draft preview.',
    }
  }
  const { items: releaseItems, release } = deliveryContext

  const copy = getContentReleaseCopyForLocale(release, previewLocale)
  if (!copy.subject || !copy.body) {
    return {
      success: false,
      message: 'That locale does not have complete release copy yet.',
    }
  }

  const result = await dispatchLoggedNotificationEmail({
    aggregateId: releaseId,
    aggregateType: 'content_release',
    eventType: 'content_release_test_sent',
    payload: {
      audience_segment: release.audience_segment,
      item_count: releaseItems.length,
      locale: copy.language,
      locale_mode: release.locale_mode,
      preview: 'true',
      release_type: release.release_type,
    },
    subject: `[Preview] ${copy.subject}`,
    text: buildContentReleaseEmailText({
      body: copy.body,
      items: releaseItems,
      language: copy.language,
    }),
    to: env.ownerAlertEmail,
  })

  revalidateAdminPaths()

  if (!result.success) {
    return {
      success: false,
      message: 'The preview email could not be sent right now.',
    }
  }

  return {
    success: true,
    message: `Preview sent to ${env.ownerAlertEmail}.`,
  }
}

export async function syncAudienceContactsWithResend(
  _prevState: SyncAudienceContactsState | null,
  _formData: FormData,
): Promise<SyncAudienceContactsState> {
  void _prevState
  void _formData

  const adminContext = await getValidatedAdminContext()
  if (!adminContext) {
    return {
      success: false,
      message: 'Audience sync is unavailable right now.',
    }
  }

  if (!hasResendAudienceEnv()) {
    return {
      success: false,
      message: 'Resend audience sync is not configured yet.',
    }
  }

  const { supabase } = adminContext
  const { data: audienceContacts, error } = await supabase
    .from('audience_contacts')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error loading audience contacts for Resend sync:', error)
    return {
      success: false,
      message: 'Could not load audience contacts for sync.',
    }
  }

  if (!audienceContacts || audienceContacts.length === 0) {
    return {
      success: true,
      message: 'There are no audience contacts to sync yet.',
    }
  }

  let syncedCount = 0
  let failedCount = 0
  let skippedCount = 0

  for (const contact of audienceContacts) {
    const syncResult = await syncStoredAudienceContactToResend(contact)
    if (syncResult.success) {
      if ('skipped' in syncResult && syncResult.skipped) {
        skippedCount += 1
      } else {
        syncedCount += 1
      }
    } else {
      failedCount += 1
      console.error('Failed to sync audience contact with Resend', {
        audienceContactId: contact.id,
        email: contact.email,
        error: syncResult.error,
      })
    }
  }

  revalidateAdminPaths()

  if (failedCount > 0) {
    return {
      success: false,
      message: `Synced ${syncedCount}, skipped ${skippedCount}, failed ${failedCount}.`,
    }
  }

  return {
    success: true,
    message: `Synced ${syncedCount} audience contact${syncedCount === 1 ? '' : 's'}${skippedCount > 0 ? `, skipped ${skippedCount}` : ''}.`,
  }
}

export async function updateContactMessageStatus(formData: FormData) {
  const adminContext = await getValidatedAdminContext()
  if (!adminContext) {
    console.warn('Contact message review skipped because Supabase is not configured.')
    return
  }

  const { supabase, user } = adminContext
  const contactMessageId = normalizeWhitespace(getFormString(formData, 'contact_message_id'))
  const status = normalizeWhitespace(
    getFormString(formData, 'status'),
  ) as ContactMessageStatus

  if (!isUuid(contactMessageId) || !isContactMessageStatus(status)) {
    console.warn('Rejected invalid contact message review payload', {
      contactMessageId,
      status,
      userId: user.id,
    })
    return
  }

  const { error } = await supabase
    .from('contact_messages')
    .update({
      status,
      responded_at: status === 'answered' ? new Date().toISOString() : null,
    })
    .eq('id', contactMessageId)

  if (error) {
    console.error('Error updating contact message status:', error)
  }

  revalidatePath('/admin')
}
