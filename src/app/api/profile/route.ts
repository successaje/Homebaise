import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    console.log('API - Starting profile fetch')

    // Get the user session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('API - Authentication error:', authError)
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
    }
    
    if (!user) {
      console.error('API - No user found')
      return NextResponse.json({ error: 'No user found' }, { status: 401 })
    }

    console.log('API - User authenticated:', user.id)

    // Try to fetch the profile with a simpler query first
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('API - Error fetching profile:', error)
      
      // If profile doesn't exist, create it
      if (error.code === 'PGRST116') {
        console.log('API - Profile not found, creating new profile...')
        
        const newProfile = {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name,
          avatar_url: user.user_metadata?.avatar_url,
          provider: user.app_metadata?.provider || 'email',
          role: 'user',
          kyc_status: 'unverified',
          wallet_address: null,
          hedera_account_id: null,
          hedera_evm_address: null,
          hedera_private_key: null,
          hedera_public_key: null
        }

        console.log('API - Creating profile with data:', newProfile)

        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select()
          .single()

        if (createError) {
          console.error('API - Error creating profile:', createError)
          return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
        }

        console.log('API - Profile created successfully:', createdProfile)
        return NextResponse.json(createdProfile)
      }
      
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }

    console.log('API - Profile fetched successfully:', profile)
    return NextResponse.json(profile)
  } catch (error) {
    console.error('API - Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 