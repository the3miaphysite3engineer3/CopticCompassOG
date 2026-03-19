import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { submitFeedback } from '@/actions/admin'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return redirect('/dashboard')

  // Using a soft-join fallback via email if the relation fails easily
  const { data: submissions, error } = await supabase
    .from('submissions')
    .select(`*, profiles(email)`)
    .order('created_at', { ascending: false })

  if (error) {
    return <div className="p-8 text-red-500 font-bold text-center mt-20">Database Error: Could not load submissions. Make sure you've ran the SQL setup script.</div>
  }

  return (
    <div className="max-w-5xl mx-auto py-16 px-6 min-h-[80vh] animate-in fade-in slide-in-from-bottom-8 duration-700">
      <h1 className="text-4xl md:text-5xl font-extrabold mb-12 bg-gradient-to-tr from-sky-600 to-emerald-500 dark:from-sky-400 dark:to-emerald-400 bg-clip-text text-transparent drop-shadow-sm">
        Instructor Terminal
      </h1>
      
      <div className="space-y-10">
        {submissions?.map((sub: any) => (
          <div key={sub.id} className="p-6 md:p-8 rounded-3xl border border-stone-200 dark:border-stone-800 bg-white/70 dark:bg-stone-900/50 shadow-sm relative overflow-hidden">
            {sub.status === 'reviewed' && (
              <div className="absolute top-0 right-0 bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 text-xs font-bold px-5 py-1.5 rounded-bl-2xl">
                Graded
              </div>
            )}
            
            <div className="flex flex-col md:flex-row justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-bold uppercase tracking-wide">
                    {sub.lesson_slug.replace('-', ' ')}
                  </h3>
                  {sub.status === 'pending' && (
                    <span className="bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      Needs Review
                    </span>
                  )}
                </div>
                <p className="text-stone-500 font-medium mt-1">Student: {sub.profiles?.email || 'Unknown User'}</p>
              </div>
              <span className="text-sm font-semibold text-stone-400 mt-2 md:mt-0 bg-stone-100 dark:bg-stone-800 px-3 py-1 rounded-lg">
                {new Date(sub.created_at).toLocaleDateString()}
              </span>
            </div>

            <div className="p-5 bg-stone-50 dark:bg-stone-950 rounded-2xl whitespace-pre-wrap font-coptic text-xl mb-8 border border-stone-100 dark:border-stone-800/50">
              {sub.submitted_text}
            </div>

            <form action={submitFeedback} className="space-y-6 bg-stone-50/50 dark:bg-stone-900/20 p-6 rounded-2xl border border-stone-100 dark:border-stone-800">
              <input type="hidden" name="submission_id" value={sub.id} />
              <h4 className="font-bold text-stone-700 dark:text-stone-300">Evaluate Translation</h4>
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                <label className="font-semibold text-sm">Score (1-5):</label>
                <input 
                  type="number" 
                  name="rating" 
                  min="1" max="5" 
                  defaultValue={sub.rating || 5} 
                  required
                  className="w-24 px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 focus:outline-none focus:ring-2 focus:ring-sky-500/50 font-bold text-center"
                />
              </div>

              <div className="space-y-2">
                <label className="font-semibold text-sm">Instructor Notes / Corrections:</label>
                <textarea
                  name="feedback"
                  rows={4}
                  defaultValue={sub.feedback_text || ""}
                  className="w-full px-5 py-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 focus:outline-none focus:ring-2 focus:ring-sky-500/50 resize-y"
                  placeholder="Type your notes for the student..."
                  required
                />
              </div>

              <button type="submit" className="w-full sm:w-auto px-8 py-3.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow-sm transition-all focus:ring-4 focus:ring-sky-600/30">
                {sub.status === 'reviewed' ? 'Save Updated Feedback' : 'Mark Reviewed & Send Feedback'}
              </button>
            </form>
          </div>
        ))}
        {submissions?.length === 0 && (
          <div className="text-center py-20 bg-stone-50 dark:bg-stone-900/50 rounded-3xl border border-stone-200 dark:border-stone-800">
            <h3 className="text-2xl font-bold mb-2">No active submissions.</h3>
            <p className="text-stone-500">Your inbox is clear. Waiting for students to complete exercises.</p>
          </div>
        )}
      </div>
    </div>
  )
}
