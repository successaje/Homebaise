import { supabase } from '@/lib/supabase'

export async function ensureProfileExists(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Check if profile exists
  const { data: existing, error: selectError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  if (selectError && selectError.code !== 'PGRST116') {
    // PGRST116: No rows found — safe to ignore
    // Other errors: proceed to upsert anyway; RLS may still allow insert
  }

  const fullName = (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || null
  const avatarUrl = (user.user_metadata?.avatar_url as string) || null
  const provider = (user.app_metadata?.provider as string) || 'email'

  await supabase.from('profiles').upsert(
    {
      id: user.id,
      email: user.email,
      full_name: fullName,
      avatar_url: avatarUrl,
      provider,
    },
    { onConflict: 'id' }
  )
}