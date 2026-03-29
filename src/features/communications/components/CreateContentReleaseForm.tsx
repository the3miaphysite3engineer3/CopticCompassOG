'use client'

import { useActionState } from 'react'
import { createContentReleaseDraft, type ContentReleaseDraftState } from '@/actions/admin'
import { FormField } from '@/components/FormField'
import { StatusNotice } from '@/components/StatusNotice'
import {
  CONTENT_RELEASE_AUDIENCE_SEGMENTS,
  CONTENT_RELEASE_LOCALE_MODES,
  type ContentReleaseCandidate,
} from '@/features/communications/lib/releases'

function formatAudienceSegmentLabel(segment: (typeof CONTENT_RELEASE_AUDIENCE_SEGMENTS)[number]) {
  switch (segment) {
    case 'lessons':
      return 'Lesson subscribers'
    case 'books':
      return 'Book subscribers'
    case 'general':
      return 'General update subscribers'
    default:
      return segment
  }
}

function formatLocaleModeLabel(localeMode: (typeof CONTENT_RELEASE_LOCALE_MODES)[number]) {
  switch (localeMode) {
    case 'localized':
      return 'Localized EN + NL'
    case 'en_only':
      return 'English only'
    case 'nl_only':
      return 'Dutch only'
    default:
      return localeMode
  }
}

export function CreateContentReleaseForm({
  publicationCandidates,
  lessonCandidates,
}: {
  publicationCandidates: ContentReleaseCandidate[]
  lessonCandidates: ContentReleaseCandidate[]
}) {
  const [state, formAction, isPending] = useActionState<ContentReleaseDraftState | null, FormData>(
    createContentReleaseDraft,
    null,
  )

  return (
    <form
      action={formAction}
      className="space-y-6 rounded-3xl border border-stone-200/80 bg-white/70 p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900/40"
    >
      <div className="grid gap-5 md:grid-cols-2">
        <FormField htmlFor="audience_segment" label="Audience segment">
          <select
            id="audience_segment"
            name="audience_segment"
            defaultValue="lessons"
            className="select-base"
          >
            {CONTENT_RELEASE_AUDIENCE_SEGMENTS.map((segment) => (
              <option key={segment} value={segment}>
                {formatAudienceSegmentLabel(segment)}
              </option>
            ))}
          </select>
        </FormField>

        <FormField htmlFor="locale_mode" label="Locale mode">
          <select
            id="locale_mode"
            name="locale_mode"
            defaultValue="localized"
            className="select-base"
          >
            {CONTENT_RELEASE_LOCALE_MODES.map((localeMode) => (
              <option key={localeMode} value={localeMode}>
                {formatLocaleModeLabel(localeMode)}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <FormField htmlFor="subject_en" label="English subject">
          <input
            id="subject_en"
            name="subject_en"
            type="text"
            className="input-base"
            maxLength={160}
            placeholder="New Coptic lesson available"
          />
        </FormField>

        <FormField htmlFor="subject_nl" label="Dutch subject">
          <input
            id="subject_nl"
            name="subject_nl"
            type="text"
            className="input-base"
            maxLength={160}
            placeholder="Nieuwe Koptische les beschikbaar"
          />
        </FormField>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <FormField htmlFor="body_en" label="English message">
          <textarea
            id="body_en"
            name="body_en"
            rows={6}
            className="textarea-base resize-y"
            placeholder="Share what is new, why it matters, and where the reader should go next."
          />
        </FormField>

        <FormField htmlFor="body_nl" label="Dutch message">
          <textarea
            id="body_nl"
            name="body_nl"
            rows={6}
            className="textarea-base resize-y"
            placeholder="Vat samen wat er nieuw is, waarom het relevant is en waar de lezer verder kan gaan."
          />
        </FormField>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <FormField
          label={`Published lessons (${lessonCandidates.length})`}
          className="rounded-2xl border border-stone-200/80 bg-stone-50/70 p-4 dark:border-stone-800 dark:bg-stone-950/30"
        >
          <div className="space-y-3">
            {lessonCandidates.length === 0 ? (
              <p className="text-sm text-stone-500 dark:text-stone-400">
                No published grammar lessons are available yet.
              </p>
            ) : (
              lessonCandidates.map((candidate) => (
                <label
                  key={candidate.id}
                  className="flex items-start gap-3 text-sm leading-6 text-stone-600 dark:text-stone-300"
                >
                  <input
                    type="checkbox"
                    name="release_item"
                    value={candidate.id}
                    className="mt-1 h-4 w-4 rounded border-stone-300 text-sky-600 focus:ring-sky-500/40 dark:border-stone-700 dark:bg-stone-950"
                  />
                  <span>
                    <span className="block font-semibold text-stone-800 dark:text-stone-100">
                      {candidate.title}
                    </span>
                    {candidate.summaryEn ? (
                      <span className="block text-xs text-stone-500 dark:text-stone-400">
                        {candidate.summaryEn}
                      </span>
                    ) : null}
                  </span>
                </label>
              ))
            )}
          </div>
        </FormField>

        <FormField
          label={`Published publications (${publicationCandidates.length})`}
          className="rounded-2xl border border-stone-200/80 bg-stone-50/70 p-4 dark:border-stone-800 dark:bg-stone-950/30"
        >
          <div className="space-y-3">
            {publicationCandidates.length === 0 ? (
              <p className="text-sm text-stone-500 dark:text-stone-400">
                No published publications are available yet.
              </p>
            ) : (
              publicationCandidates.map((candidate) => (
                <label
                  key={candidate.id}
                  className="flex items-start gap-3 text-sm leading-6 text-stone-600 dark:text-stone-300"
                >
                  <input
                    type="checkbox"
                    name="release_item"
                    value={candidate.id}
                    className="mt-1 h-4 w-4 rounded border-stone-300 text-sky-600 focus:ring-sky-500/40 dark:border-stone-700 dark:bg-stone-950"
                  />
                  <span>
                    <span className="block font-semibold text-stone-800 dark:text-stone-100">
                      {candidate.title}
                    </span>
                    {candidate.summaryEn ? (
                      <span className="block text-xs text-stone-500 dark:text-stone-400">
                        {candidate.summaryEn}
                      </span>
                    ) : null}
                  </span>
                </label>
              ))
            )}
          </div>
        </FormField>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" className="btn-primary px-6" disabled={isPending}>
          {isPending ? 'Saving draft...' : 'Create release draft'}
        </button>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          Drafts snapshot the selected titles and URLs so later content edits do not silently change the outgoing release.
        </p>
      </div>

      {state?.success ? (
        <StatusNotice tone="success" align="left">
          Release draft created.
        </StatusNotice>
      ) : null}

      {state?.error ? (
        <StatusNotice tone="error" align="left">
          {state.error}
        </StatusNotice>
      ) : null}
    </form>
  )
}
