import { Resend } from 'resend'
import { hasAudienceSubscriptions } from '@/features/communications/lib/communications'
import { assertServerOnly } from '@/lib/server/assertServerOnly'
import { createServiceRoleClient } from '@/lib/supabase/serviceRole'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/supabase'

type AudienceContactRow = Tables<'audience_contacts'>
type AudienceContactSyncStateRow = Tables<'audience_contact_sync_state'>
type ServiceRoleClient = ReturnType<typeof createServiceRoleClient>

type ResendAudienceSegments = {
  books: string
  general: string
  lessons: string
}

type ResendLocalizedAudienceSegments = {
  books: {
    en: string | null
    nl: string | null
  }
  general: {
    en: string | null
    nl: string | null
  }
  lessons: {
    en: string | null
    nl: string | null
  }
}

type ResendAudienceEnv = {
  resendApiKey: string
  localizedSegments: ResendLocalizedAudienceSegments
  segments: ResendAudienceSegments
}

export type ResendAudienceSyncResult =
  | {
      contact: AudienceContactRow
      syncState: AudienceContactSyncStateRow | null
      skipped: true
      success: true
    }
  | {
      contact: AudienceContactRow
      syncState: AudienceContactSyncStateRow | null
      success: true
    }
  | {
      contact: AudienceContactRow
      error: string
      syncState: AudienceContactSyncStateRow | null
      success: false
    }

export function getResendAudienceEnv(): ResendAudienceEnv | null {
  assertServerOnly('getResendAudienceEnv')

  const resendApiKey = process.env.RESEND_API_KEY_FULL_ACCESS
  const lessons = process.env.RESEND_LESSONS_SEGMENT_ID
  const books = process.env.RESEND_BOOKS_SEGMENT_ID
  const general = process.env.RESEND_GENERAL_SEGMENT_ID
  const lessonsEn = normalizeOptionalSegmentId(process.env.RESEND_LESSONS_EN_SEGMENT_ID)
  const lessonsNl = normalizeOptionalSegmentId(process.env.RESEND_LESSONS_NL_SEGMENT_ID)
  const booksEn = normalizeOptionalSegmentId(process.env.RESEND_BOOKS_EN_SEGMENT_ID)
  const booksNl = normalizeOptionalSegmentId(process.env.RESEND_BOOKS_NL_SEGMENT_ID)
  const generalEn = normalizeOptionalSegmentId(process.env.RESEND_GENERAL_EN_SEGMENT_ID)
  const generalNl = normalizeOptionalSegmentId(process.env.RESEND_GENERAL_NL_SEGMENT_ID)

  if (!resendApiKey || !lessons || !books || !general) {
    return null
  }

  return {
    localizedSegments: {
      books: {
        en: booksEn,
        nl: booksNl,
      },
      general: {
        en: generalEn,
        nl: generalNl,
      },
      lessons: {
        en: lessonsEn,
        nl: lessonsNl,
      },
    },
    resendApiKey,
    segments: {
      books,
      general,
      lessons,
    },
  }
}

export function hasResendAudienceEnv() {
  return getResendAudienceEnv() !== null
}

export async function syncStoredAudienceContactToResend(
  contact: AudienceContactRow,
  supabase?: ServiceRoleClient,
): Promise<ResendAudienceSyncResult> {
  const env = getResendAudienceEnv()
  if (!env) {
    const syncState = await getAudienceContactSyncState(contact.id, supabase)
    return {
      contact,
      syncState,
      skipped: true,
      success: true,
    }
  }

  const serviceRoleClient = supabase ?? createServiceRoleClient()
  const existingSyncState = await getAudienceContactSyncState(contact.id, serviceRoleClient)
  const resend = new Resend(env.resendApiKey)
  const { firstName, lastName } = splitAudienceFullName(contact.full_name)
  const managedSegmentIds = getManagedSegmentIds(env)
  const desiredSegmentIds = getDesiredSegmentIds(contact, env)
  const desiredSegmentList = [...desiredSegmentIds]

  try {
    const upsertedContact = await upsertResendContact({
      contact,
      desiredSegmentIds: desiredSegmentList,
      firstName,
      lastName,
      existingSyncState,
      resend,
    })
    const contactId = upsertedContact.contactId

    if (upsertedContact.segmentsAppliedOnCreate) {
      const syncState = await persistAudienceContactSyncState(
        contact.id,
        {
          last_error: null,
          last_synced_at: new Date().toISOString(),
          provider: 'resend',
          provider_contact_id: contactId,
        },
        serviceRoleClient,
      )

      return {
        contact,
        syncState,
        success: true,
      }
    }

    const { data: currentSegments, error: currentSegmentsError } =
      await resend.contacts.segments.list({
        contactId,
      })

    if (currentSegmentsError) {
      throw new Error(currentSegmentsError.message)
    }

    const existingSegmentIds = new Set(
      (currentSegments?.data ?? [])
        .map((segment) => segment.id)
        .filter((segmentId) => managedSegmentIds.has(segmentId)),
    )

    for (const segmentId of desiredSegmentIds) {
      if (!existingSegmentIds.has(segmentId)) {
        const { error } = await resend.contacts.segments.add({
          contactId,
          segmentId,
        })

        if (error) {
          throw new Error(error.message)
        }
      }
    }

    for (const segmentId of existingSegmentIds) {
      if (!desiredSegmentIds.has(segmentId)) {
        const { error } = await resend.contacts.segments.remove({
          contactId,
          segmentId,
        })

        if (error) {
          throw new Error(error.message)
        }
      }
    }

    const syncState = await persistAudienceContactSyncState(
      contact.id,
      {
        last_error: null,
        last_synced_at: new Date().toISOString(),
        provider: 'resend',
        provider_contact_id: contactId,
      },
      serviceRoleClient,
    )

    return {
      contact,
      syncState,
      success: true,
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Audience contact sync failed.'

    const syncState = await persistAudienceContactSyncState(
      contact.id,
      {
        last_error: errorMessage,
        provider: 'resend',
      },
      serviceRoleClient,
    )

    return {
      contact,
      error: errorMessage,
      syncState,
      success: false,
    }
  }
}

function getManagedSegmentIds(env: Pick<ResendAudienceEnv, 'localizedSegments' | 'segments'>) {
  const segmentIds = [
    env.segments.lessons,
    env.segments.books,
    env.segments.general,
    env.localizedSegments.lessons.en,
    env.localizedSegments.lessons.nl,
    env.localizedSegments.books.en,
    env.localizedSegments.books.nl,
    env.localizedSegments.general.en,
    env.localizedSegments.general.nl,
  ].filter((segmentId): segmentId is string => Boolean(segmentId))

  return new Set(segmentIds)
}

function getDesiredSegmentIds(
  contact: Pick<
    AudienceContactRow,
    'books_opt_in' | 'general_updates_opt_in' | 'lessons_opt_in' | 'locale'
  >,
  env: Pick<ResendAudienceEnv, 'localizedSegments' | 'segments'>,
) {
  const desiredSegmentIds = new Set<string>()
  const preferredLocale = contact.locale === 'nl' ? 'nl' : 'en'

  if (contact.lessons_opt_in) {
    desiredSegmentIds.add(env.segments.lessons)
    const localizedSegmentId = env.localizedSegments.lessons[preferredLocale]
    if (localizedSegmentId) {
      desiredSegmentIds.add(localizedSegmentId)
    }
  }

  if (contact.books_opt_in) {
    desiredSegmentIds.add(env.segments.books)
    const localizedSegmentId = env.localizedSegments.books[preferredLocale]
    if (localizedSegmentId) {
      desiredSegmentIds.add(localizedSegmentId)
    }
  }

  if (contact.general_updates_opt_in) {
    desiredSegmentIds.add(env.segments.general)
    const localizedSegmentId = env.localizedSegments.general[preferredLocale]
    if (localizedSegmentId) {
      desiredSegmentIds.add(localizedSegmentId)
    }
  }

  return desiredSegmentIds
}

async function upsertResendContact(options: {
  contact: AudienceContactRow
  desiredSegmentIds: string[]
  existingSyncState: AudienceContactSyncStateRow | null
  firstName: string | null
  lastName: string | null
  resend: Resend
}) {
  const unsubscribed = !hasAudienceSubscriptions(options.contact)
  const existingContactLookup =
    options.existingSyncState?.provider_contact_id
      ? await options.resend.contacts.get({
          id: options.existingSyncState.provider_contact_id,
        })
      : await options.resend.contacts.get({
          email: options.contact.email,
        })

  if (!existingContactLookup.error && existingContactLookup.data?.id) {
    const updatedContact = await options.resend.contacts.update({
      email: options.contact.email,
      firstName: options.firstName,
      lastName: options.lastName,
      unsubscribed,
    })

    if (updatedContact.error) {
      throw new Error(updatedContact.error.message)
    }

    return {
      contactId: existingContactLookup.data.id,
      segmentsAppliedOnCreate: false,
    }
  }

  if (existingContactLookup.error && existingContactLookup.error.name !== 'not_found') {
    throw new Error(existingContactLookup.error.message)
  }

  const createdContact = await options.resend.contacts.create({
    email: options.contact.email,
    firstName: options.firstName ?? undefined,
    lastName: options.lastName ?? undefined,
    segments: options.desiredSegmentIds.map((id) => ({ id })),
    unsubscribed,
  })

  if (!createdContact.error && createdContact.data?.id) {
    return {
      contactId: createdContact.data.id,
      segmentsAppliedOnCreate: true,
    }
  }

  throw new Error(
      createdContact.error?.message ??
      'Resend contact sync failed.',
  )
}

async function persistAudienceContactSyncState(
  audienceContactId: string,
  payload: Omit<TablesUpdate<'audience_contact_sync_state'>, 'audience_contact_id'>,
  supabase: ServiceRoleClient,
) {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('audience_contact_sync_state')
    .upsert({
      audience_contact_id: audienceContactId,
      ...payload,
      updated_at: now,
    } satisfies TablesInsert<'audience_contact_sync_state'>, {
      onConflict: 'audience_contact_id',
    })
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

async function getAudienceContactSyncState(
  audienceContactId: string,
  supabase?: ServiceRoleClient,
) {
  const serviceRoleClient = supabase ?? createServiceRoleClient()
  const { data, error } = await serviceRoleClient
    .from('audience_contact_sync_state')
    .select('*')
    .eq('audience_contact_id', audienceContactId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

function splitAudienceFullName(fullName: string | null) {
  const normalized = (fullName ?? '').trim()
  if (!normalized) {
    return {
      firstName: null,
      lastName: null,
    }
  }

  const [firstName, ...rest] = normalized.split(/\s+/)
  return {
    firstName,
    lastName: rest.length > 0 ? rest.join(' ') : null,
  }
}

function normalizeOptionalSegmentId(value: string | undefined) {
  if (!value) {
    return null
  }

  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}
