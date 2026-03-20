'use server'

import { createClient } from '@/lib/supabase/server'
import { hasSupabaseRuntimeEnv } from '@/lib/supabase/config'
import { revalidatePath } from 'next/cache'
import {
  getFormString,
  hasLengthInRange,
  isUuid,
  normalizeMultiline,
  normalizeWhitespace,
  parseBoundedInteger,
} from '@/lib/validation'

export async function submitFeedback(formData: FormData) {
  if (!hasSupabaseRuntimeEnv()) {
    console.warn('Admin feedback submission skipped because Supabase is not configured.')
    return
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return

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

  const { error } = await supabase
    .from('submissions')
    .update({ status: 'reviewed', rating, feedback_text: feedback })
    .eq('id', submissionId)

  if (error) {
    console.error('Error submitting feedback:', error)
  }

  revalidatePath('/admin')
}
