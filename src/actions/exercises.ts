'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitExercise(prevState: any, formData: FormData) {
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
    console.error('Error submitting exercise:', error)
    return { success: false, error: 'Failed to submit exercise. Please try again.' }
  }

  revalidatePath('/dashboard')
  revalidatePath(`/grammar/${lessonSlug}`)

  return { success: true }
}
