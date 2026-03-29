import type { SupabaseClient } from '@supabase/supabase-js'
import {
  compareContactMessagePriority,
} from '@/features/contact/lib/contact'
import type {
  ContactMessageRow,
} from '@/features/contact/lib/contact'
import {
  compareAudienceContactPriority,
  type AdminAudienceContactRow,
  type AudiencePreferencesRow,
} from '@/features/communications/lib/communications'
import {
  compareContentReleasePriority,
  type AdminContentRelease,
  type ContentReleaseItemRow,
} from '@/features/communications/lib/releases'
import {
  compareEntryReportPriority,
} from '@/features/dictionary/lib/entryActions'
import type {
  AdminEntryReport,
  EntryFavoriteRow,
} from '@/features/dictionary/lib/entryActions'
import type {
  LessonBookmarkRow,
  LessonNoteRow,
  LessonProgressRow,
  SectionProgressRow,
} from '@/features/grammar/types'
import type {
  AdminSubmission,
  ProfileRole,
  SubmissionRow,
} from '@/features/submissions/types'
import {
  compareAdminNotificationPriority,
  type AdminNotificationEvent,
  type NotificationDeliveryRow,
} from '@/features/notifications/lib/notifications'
import type { Database, Tables } from '@/types/supabase'

export type AppSupabaseClient = SupabaseClient<Database>

type QueryResult<T> = {
  data: T | null
  error: { message: string } | null
}

export async function getAuthenticatedUser(supabase: AppSupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
}

export async function getProfile(
  supabase: AppSupabaseClient,
  userId: string
): Promise<Tables<'profiles'> | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    return null
  }

  return data
}

export async function getAudienceContactForProfile(
  supabase: AppSupabaseClient,
  userId: string,
  email?: string | null,
): Promise<AudiencePreferencesRow | null> {
  const profileLinkedResult = await supabase
    .from('audience_contacts')
    .select(
      'id, email, locale, source, books_opt_in, general_updates_opt_in, lessons_opt_in, profile_id',
    )
    .eq('profile_id', userId)
    .maybeSingle()

  if (profileLinkedResult.error) {
    return null
  }

  if (profileLinkedResult.data) {
    return profileLinkedResult.data
  }

  if (!email) {
    return null
  }

  const { data, error } = await supabase
    .from('audience_contacts')
    .select(
      'id, email, locale, source, books_opt_in, general_updates_opt_in, lessons_opt_in, profile_id',
    )
    .eq('email', email.toLowerCase())
    .maybeSingle()

  if (error) {
    return null
  }

  return data
}

export async function getProfileRole(
  supabase: AppSupabaseClient,
  userId: string
): Promise<ProfileRole | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (error) {
    return null
  }

  return data?.role ?? null
}

export async function getUserSubmissions(
  supabase: AppSupabaseClient,
  userId: string
): Promise<SubmissionRow[]> {
  const { data } = await supabase
    .from('submissions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  return data ?? []
}

export async function getUserLessonProgressRows(
  supabase: AppSupabaseClient,
  userId: string
): Promise<LessonProgressRow[]> {
  const { data } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('user_id', userId)
    .order('last_viewed_at', { ascending: false })

  return data ?? []
}

export async function getUserSectionProgressRows(
  supabase: AppSupabaseClient,
  userId: string
): Promise<SectionProgressRow[]> {
  const { data } = await supabase
    .from('section_progress')
    .select('*')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })

  return data ?? []
}

export async function getUserLessonBookmarks(
  supabase: AppSupabaseClient,
  userId: string
): Promise<LessonBookmarkRow[]> {
  const { data } = await supabase
    .from('lesson_bookmarks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  return data ?? []
}

export async function getUserLessonNotes(
  supabase: AppSupabaseClient,
  userId: string
): Promise<LessonNoteRow[]> {
  const { data } = await supabase
    .from('lesson_notes')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  return data ?? []
}

export async function getUserEntryFavorites(
  supabase: AppSupabaseClient,
  userId: string,
): Promise<EntryFavoriteRow[]> {
  const { data } = await supabase
    .from('entry_favorites')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  return data ?? []
}

export async function getAdminSubmissions(
  supabase: AppSupabaseClient
): Promise<QueryResult<AdminSubmission[]>> {
  const submissionsResult = await supabase
    .from('submissions')
    .select('*')
    .order('created_at', { ascending: false })

  if (submissionsResult.error || !submissionsResult.data) {
    return {
      data: null,
      error: submissionsResult.error
        ? { message: submissionsResult.error.message }
        : { message: 'Could not load submissions.' },
    }
  }

  if (submissionsResult.data.length === 0) {
    return {
      data: [],
      error: null,
    }
  }

  const profileIds = Array.from(
    new Set(submissionsResult.data.map((submission) => submission.user_id))
  )

  const profilesResult = await supabase
    .from('profiles')
    .select('id, email')
    .in('id', profileIds)

  if (profilesResult.error) {
    return {
      data: null,
      error: { message: profilesResult.error.message },
    }
  }

  const emailsByProfileId = new Map(
    (profilesResult.data ?? []).map((profile) => [profile.id, profile.email])
  )

  return {
    data: submissionsResult.data.map((submission) => ({
      ...submission,
      studentEmail: emailsByProfileId.get(submission.user_id) ?? null,
    })),
    error: null,
  }
}

export async function getAdminContactMessages(
  supabase: AppSupabaseClient,
): Promise<QueryResult<ContactMessageRow[]>> {
  const contactMessagesResult = await supabase
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false })

  if (contactMessagesResult.error || !contactMessagesResult.data) {
    return {
      data: null,
      error: contactMessagesResult.error
        ? { message: contactMessagesResult.error.message }
        : { message: 'Could not load contact messages.' },
    }
  }

  return {
    data: [...contactMessagesResult.data].sort(compareContactMessagePriority),
    error: null,
  }
}

export async function getAdminAudienceContacts(
  supabase: AppSupabaseClient,
  limit?: number,
): Promise<QueryResult<AdminAudienceContactRow[]>> {
  let audienceContactsQuery = supabase
    .from('audience_contacts')
    .select('*')
    .order('updated_at', { ascending: false })

  if (typeof limit === 'number') {
    audienceContactsQuery = audienceContactsQuery.limit(limit)
  }

  const audienceContactsResult = await audienceContactsQuery

  if (audienceContactsResult.error || !audienceContactsResult.data) {
    return {
      data: null,
      error: audienceContactsResult.error
        ? { message: audienceContactsResult.error.message }
        : { message: 'Could not load audience contacts.' },
    }
  }

  if (audienceContactsResult.data.length === 0) {
    return {
      data: [],
      error: null,
    }
  }

  const audienceContactIds = audienceContactsResult.data.map((contact) => contact.id)
  const syncStatesResult = await supabase
    .from('audience_contact_sync_state')
    .select('*')
    .in('audience_contact_id', audienceContactIds)

  if (syncStatesResult.error) {
    return {
      data: null,
      error: { message: syncStatesResult.error.message },
    }
  }

  const syncStateByContactId = new Map(
    (syncStatesResult.data ?? []).map((syncState) => [
      syncState.audience_contact_id,
      syncState,
    ]),
  )

  return {
    data: audienceContactsResult.data
      .map((contact) => ({
        ...contact,
        syncState: syncStateByContactId.get(contact.id) ?? null,
      }))
      .sort(compareAudienceContactPriority),
    error: null,
  }
}

export async function getAdminContentReleases(
  supabase: AppSupabaseClient,
  limit = 12,
): Promise<QueryResult<AdminContentRelease[]>> {
  const contentReleasesResult = await supabase
    .from('content_releases')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (contentReleasesResult.error || !contentReleasesResult.data) {
    return {
      data: null,
      error: contentReleasesResult.error
        ? { message: contentReleasesResult.error.message }
        : { message: 'Could not load content releases.' },
    }
  }

  if (contentReleasesResult.data.length === 0) {
    return {
      data: [],
      error: null,
    }
  }

  const releaseIds = contentReleasesResult.data.map((release) => release.id)
  const releaseItemsResult = await supabase
    .from('content_release_items')
    .select('*')
    .in('release_id', releaseIds)
    .order('created_at', { ascending: true })

  if (releaseItemsResult.error) {
    return {
      data: null,
      error: { message: releaseItemsResult.error.message },
    }
  }

  const itemsByReleaseId = new Map<string, ContentReleaseItemRow[]>()

  for (const item of releaseItemsResult.data ?? []) {
    const items = itemsByReleaseId.get(item.release_id) ?? []
    items.push(item)
    itemsByReleaseId.set(item.release_id, items)
  }

  return {
    data: contentReleasesResult.data
      .map((release) => ({
        ...release,
        items: itemsByReleaseId.get(release.id) ?? [],
      }))
      .sort(compareContentReleasePriority),
    error: null,
  }
}

export async function getAdminEntryReports(
  supabase: AppSupabaseClient,
): Promise<QueryResult<AdminEntryReport[]>> {
  const reportsResult = await supabase
    .from('entry_reports')
    .select('*')
    .order('created_at', { ascending: false })

  if (reportsResult.error || !reportsResult.data) {
    return {
      data: null,
      error: reportsResult.error
        ? { message: reportsResult.error.message }
        : { message: 'Could not load dictionary entry reports.' },
    }
  }

  if (reportsResult.data.length === 0) {
    return {
      data: [],
      error: null,
    }
  }

  const profileIds = Array.from(
    new Set(reportsResult.data.map((report) => report.user_id)),
  )

  const profilesResult = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .in('id', profileIds)

  if (profilesResult.error) {
    return {
      data: null,
      error: { message: profilesResult.error.message },
    }
  }

  const profileMetadataById = new Map(
    (profilesResult.data ?? []).map((profile) => [
      profile.id,
      {
        email: profile.email,
        fullName: profile.full_name,
      },
    ]),
  )

  return {
    data: reportsResult.data
      .map((report) => ({
        ...report,
        reporterEmail: profileMetadataById.get(report.user_id)?.email ?? null,
        reporterName: profileMetadataById.get(report.user_id)?.fullName ?? null,
      }))
      .sort(compareEntryReportPriority),
    error: null,
  }
}

export async function getAdminNotificationEvents(
  supabase: AppSupabaseClient,
  limit = 18,
): Promise<QueryResult<AdminNotificationEvent[]>> {
  const notificationEventsResult = await supabase
    .from('notification_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (notificationEventsResult.error || !notificationEventsResult.data) {
    return {
      data: null,
      error: notificationEventsResult.error
        ? { message: notificationEventsResult.error.message }
        : { message: 'Could not load notification activity.' },
    }
  }

  if (notificationEventsResult.data.length === 0) {
    return {
      data: [],
      error: null,
    }
  }

  const eventIds = notificationEventsResult.data.map((event) => event.id)
  const deliveriesResult = await supabase
    .from('notification_deliveries')
    .select('*')
    .in('event_id', eventIds)
    .order('created_at', { ascending: false })

  if (deliveriesResult.error) {
    return {
      data: null,
      error: { message: deliveriesResult.error.message },
    }
  }

  const deliveriesByEventId = new Map<string, NotificationDeliveryRow[]>()

  for (const delivery of deliveriesResult.data ?? []) {
    const deliveries = deliveriesByEventId.get(delivery.event_id) ?? []
    deliveries.push(delivery)
    deliveriesByEventId.set(delivery.event_id, deliveries)
  }

  return {
    data: notificationEventsResult.data
      .map((event) => {
        const deliveries = deliveriesByEventId.get(event.id) ?? []
        return {
          ...event,
          deliveries,
          latestDelivery: deliveries[0] ?? null,
        }
      })
      .sort(compareAdminNotificationPriority),
    error: null,
  }
}
