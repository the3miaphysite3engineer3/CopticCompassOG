'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitFeedback(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return

  const submissionId = formData.get('submission_id') as string
  const rating = parseInt(formData.get('rating') as string) || 0
  const feedback = formData.get('feedback') as string

  const { error } = await supabase
    .from('submissions')
    .update({ status: 'reviewed', rating, feedback_text: feedback })
    .eq('id', submissionId)

  if (error) {
    console.error('Error submitting feedback:', error)
  }

  revalidatePath('/admin')
}
