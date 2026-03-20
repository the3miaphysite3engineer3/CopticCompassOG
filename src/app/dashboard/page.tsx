import { createClient } from '@/lib/supabase/server'
import { getAuthUnavailableLoginPath, hasSupabaseRuntimeEnv } from '@/lib/supabase/config'
import { redirect } from 'next/navigation'
import { logout } from '@/actions/auth'

export default async function DashboardPage() {
  if (!hasSupabaseRuntimeEnv()) {
    return redirect(getAuthUnavailableLoginPath('/dashboard'))
  }

  const supabase = await createClient()

  // Verify authentication server-side
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  // Fetch student's submissions
  const { data: submissions } = await supabase
    .from('submissions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen relative overflow-hidden px-6 py-16">
      <div className="absolute top-0 left-0 w-[480px] h-[480px] bg-sky-500/10 dark:bg-sky-900/10 rounded-full blur-[120px] -z-10 pointer-events-none transition-colors duration-500" />
      <div className="absolute bottom-0 right-0 w-[420px] h-[420px] bg-emerald-500/10 dark:bg-emerald-900/10 rounded-full blur-[120px] -z-10 pointer-events-none transition-colors duration-500" />

      <div className="max-w-5xl mx-auto min-h-[80vh]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-400 mb-4">
              Student Workspace
            </span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-tr from-sky-600 to-emerald-500 dark:from-sky-400 dark:to-emerald-400 bg-clip-text text-transparent drop-shadow-sm">
            Student Dashboard
          </h1>
          <p className="text-stone-500 dark:text-stone-400 mt-2 font-medium">
            Manage your grammar exercises and view feedback.
          </p>
        </div>
        <form action={logout}>
          <button className="btn-secondary px-6">
            Sign Out
          </button>
        </form>
      </div>
      
      <div className="p-6 md:p-8 rounded-3xl bg-white/70 dark:bg-stone-900/50 backdrop-blur-md border border-stone-200 dark:border-stone-800 shadow-md dark:shadow-xl dark:shadow-black/20 mb-10">
        <h2 className="text-2xl font-semibold mb-2 text-stone-800 dark:text-stone-200">Welcome Back!</h2>
        <p className="text-stone-600 dark:text-stone-400 font-medium">
          Logged in as <span className="text-sky-600 dark:text-sky-400 font-bold">{user.email}</span>
        </p>
      </div>

      <div className="space-y-8">
        <h3 className="text-2xl font-semibold tracking-tight mb-4 text-stone-800 dark:text-stone-200">Your Recent Exercises</h3>
        
        {submissions?.map((sub) => (
          <div key={sub.id} className="p-6 md:p-8 rounded-3xl bg-white/70 dark:bg-stone-900/55 backdrop-blur-md border border-stone-200 dark:border-stone-800 shadow-md dark:shadow-xl dark:shadow-black/20 relative overflow-hidden transition-all hover:shadow-lg">
            {sub.status === 'reviewed' && (
              <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl shadow-sm">
                Reviewed
              </div>
            )}
            
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl md:text-2xl font-semibold uppercase tracking-wide text-stone-800 dark:text-stone-200">
                {sub.lesson_slug.replace('-', ' ')}
              </h2>
              <span className="text-xs font-semibold text-stone-400 bg-stone-100 dark:bg-stone-800 px-3 py-1 rounded-lg">
                {new Date(sub.created_at).toLocaleDateString()}
              </span>
            </div>
            
            <div className="p-5 bg-stone-50 dark:bg-stone-950 rounded-xl whitespace-pre-wrap font-coptic text-lg md:text-xl mb-6 border border-stone-100 dark:border-stone-800/50 text-stone-700 dark:text-stone-300">
              {sub.submitted_text}
            </div>

            {sub.status === 'reviewed' ? (
              <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 rounded-2xl p-5 md:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 text-sm font-bold px-4 py-1.5 rounded-full">
                    Score: {sub.rating} / 5
                  </span>
                </div>
                <h4 className="font-bold text-stone-800 dark:text-stone-200 mb-2 flex items-center gap-2">
                  <span>Instructor Feedback</span>
                </h4>
                <p className="text-stone-700 dark:text-stone-300 leading-relaxed font-medium">
                  &ldquo;{sub.feedback_text}&rdquo;
                </p>
              </div>
            ) : (
              <div className="mt-2 text-center p-6 border border-dashed border-stone-300 dark:border-stone-700 rounded-2xl bg-stone-50 dark:bg-stone-900/30">
                <p className="text-stone-500 dark:text-stone-400 font-medium italic">
                  Waiting for instructor review. Check back later!
                </p>
              </div>
            )}
          </div>
        ))}

        {submissions?.length === 0 && (
          <div className="text-center py-20 bg-white/70 dark:bg-stone-900/50 backdrop-blur-md rounded-3xl border border-stone-200 dark:border-stone-800 shadow-md dark:shadow-xl dark:shadow-black/20">
            <h3 className="text-2xl font-semibold mb-2 text-stone-800 dark:text-stone-200">No Exercises Submitted Yet</h3>
            <p className="text-stone-500 font-medium">Head over to the Grammar section to complete your first lesson!</p>
          </div>
        )}
      </div>
      </div>
    </main>
  )
}
