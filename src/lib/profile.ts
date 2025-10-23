import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface ProfileRow {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  provider: string | null
  role: string | null
  wallet_address: string | null
  hedera_account_id: string | null
  hedera_evm_address: string | null
  hedera_private_key: string | null
  hedera_public_key: string | null
  phone_number: string | null
  kyc_status: 'unverified' | 'pending' | 'verified' | null
  kyc_verified_at: string | null
  created_at: string | null
  updated_at: null
}

export async function getCurrentUserProfile(): Promise<ProfileRow | null> {
  try {
    console.log('getCurrentUserProfile - Starting profile fetch...')
    console.log('getCurrentUserProfile - Environment check:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      urlLength: supabaseUrl?.length,
      keyLength: supabaseAnonKey?.length
    })

    // First, check if we have a session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('getCurrentUserProfile - Session error:', sessionError)
      return null
    }

    if (!session) {
      console.log('getCurrentUserProfile - No active session found')
      return null
    }

    console.log('getCurrentUserProfile - Session found for user:', session.user.id)

    // Now get the user details
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('getCurrentUserProfile - User error:', userError)
      return null
    }
    
    if (!user) {
      console.log('getCurrentUserProfile - No user found despite having session')
      return null
    }

    console.log('getCurrentUserProfile - Fetching profile for user:', user.id)

    // Try to fetch the profile with a simpler query first
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    console.log('getCurrentUserProfile - Profile result:', { 
      profile: profile ? 'Found' : 'Not found', 
      error: error ? {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      } : null
    })

    if (error) {
      console.error('getCurrentUserProfile - Error fetching profile:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        fullError: error
      })
      
      // If profile doesn't exist, try to create it
      if (error.code === 'PGRST116') {
        console.log('getCurrentUserProfile - Profile not found, creating...')
        return await ensureProfileExists(user)
      }
      
      return null
    }

    return profile
  } catch (error) {
    console.error('getCurrentUserProfile - Unexpected error:', error)
    return null
  }
}

export async function ensureProfileExists(user: any): Promise<ProfileRow | null> {
  try {
    console.log('ensureProfileExists - Starting for user:', user.id)
    
    const fullName = user.user_metadata?.full_name || user.user_metadata?.name
    const avatarUrl = user.user_metadata?.avatar_url
    const provider = user.app_metadata?.provider || 'email'

    const profileData = {
      id: user.id,
      email: user.email,
      full_name: fullName,
      avatar_url: avatarUrl,
      provider,
      role: 'user',
      kyc_status: 'unverified',
      wallet_address: null,
      hedera_account_id: null,
      hedera_evm_address: null,
      hedera_private_key: null,
      hedera_public_key: null,
      phone_number: null
    }

    console.log('ensureProfileExists - Profile data being upserted:', profileData)

    const { data: profile, error } = await supabase
      .from('profiles')
      .upsert(profileData, { onConflict: 'id' })
      .select()
      .single()

    if (error) {
      console.error('ensureProfileExists - Error upserting profile:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        fullError: error
      })
      return null
    }

    console.log('ensureProfileExists - Profile created/updated successfully:', profile)
    return profile
  } catch (error) {
    console.error('ensureProfileExists - Unexpected error:', error)
    return null
  }
}

export async function getBasicProfile(): Promise<ProfileRow | null> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('getBasicProfile - User error:', userError)
      return null
    }

    console.log('getBasicProfile - Fetching basic profile for user:', user.id)

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, avatar_url, role, kyc_status, wallet_address, phone_number')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('getBasicProfile - Basic profile fetch error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        fullError: error
      })
      return null
    }

    return profile
  } catch (error) {
    console.error('getBasicProfile - Unexpected error:', error)
    return null
  }
}

export async function testSupabaseConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    // Check environment variables
    if (!supabaseUrl || !supabaseAnonKey) {
      return { 
        success: false, 
        error: 'Missing Supabase environment variables' 
      }
    }

    console.log('testSupabaseConnection - Environment variables check passed')

    // Test basic connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)

    if (error) {
      console.error('testSupabaseConnection - Database connection error:', error)
      return { 
        success: false, 
        error: `Database connection failed: ${error.message}` 
      }
    }

    console.log('testSupabaseConnection - Database connection successful')
    return { success: true }
  } catch (error) {
    console.error('testSupabaseConnection - Unexpected error:', error)
    return { 
      success: false, 
      error: `Unexpected error: ${error}` 
    }
  }
}

export async function isUserVerified(): Promise<boolean> {
  const profile = await getCurrentUserProfile()
  return profile?.kyc_status === 'verified'
}

export async function isUserAdmin(): Promise<boolean> {
  const profile = await getCurrentUserProfile()
  return profile?.role === 'admin'
}