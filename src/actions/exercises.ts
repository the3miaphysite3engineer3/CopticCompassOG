'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ExerciseActionState =
  | {
      success?: boolean
      error?: string
    }
  | null

export async function submitExercise(_prevState: ExerciseActionState, formData: FormData): Promise<ExerciseActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Unauthorized. Please log in first.' }

  const lessonSlug = formData.get('lessonSlug') as string

  let submittedText = ''
  let i = 0
  while (formData.has(`question_${i}`) && formData.has(`answer_${i}`)) {
    const question = formData.get(`question_${i}`)
    const answer = formData.get(`answer_${i}`)
    submittedText += `Question: ${question}\nAnswer: ${answer}\n\n`
    i++
  }

  const { error } = await supabase
    .from('submissions')
    .insert([
      {
        user_id: user.id,
        lesson_slug: lessonSlug,
        submitted_text: submittedText.trim(),
        status: 'pending',
      }
    ])

  if (error) {
    console.error('Error submitting exercise:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      lessonSlug,
      userId: user.id,
    })

    if (
      error.code === 'PGRST205' ||
      error.code === '42P01' ||
      error.message?.includes('Could not find the table')
    ) {
      return {
        success: false,
        error: 'Exercise submissions are not configured yet. Please contact the administrator.',
      }
    }

    if (error.code === '42501') {
      return {
        success: false,
        error: 'Your account does not have permission to submit exercises yet.',
      }
    }

    return { success: false, error: 'Failed to submit exercise. Please try again.' }
  }

  revalidatePath('/dashboard')
  revalidatePath(`/grammar/${lessonSlug}`)

  return { success: true }
}
