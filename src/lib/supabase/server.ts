import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies as nextCookies } from 'next/headers'
import { Database } from '@/types/supabase'

type CookieOptions = {
  name: string
  value: string
  path?: string
  domain?: string
  maxAge?: number
  sameSite?: 'lax' | 'strict' | 'none' | boolean
  secure?: boolean
  httpOnly?: boolean
}

export const createClient = async () => {
  const cookieStore = await nextCookies()
  
  const cookieManager = {
    get(name: string) {
      return cookieStore.get(name)?.value
    },
    set(name: string, value: string, options: Omit<CookieOptions, 'name' | 'value'> = {}) {
      try {
        cookieStore.set({
          name,
          value,
          ...options,
          path: options?.path || '/',
          maxAge: options?.maxAge || 60 * 60 * 24 * 7, // 7 days
          sameSite: options?.sameSite as 'lax' | 'strict' | 'none' || 'lax',
          secure: process.env.NODE_ENV === 'production',
          httpOnly: true,
        } as any)
      } catch (error) {
        console.error('Error setting cookie:', error)
      }
    },
    remove(name: string, options: Omit<CookieOptions, 'name' | 'value'> = {}) {
      try {
        cookieStore.set({
          name,
          value: '',
          ...options,
          path: options?.path || '/',
          maxAge: 0,
          sameSite: options?.sameSite as 'lax' | 'strict' | 'none' || 'lax',
          secure: process.env.NODE_ENV === 'production',
          httpOnly: true,
        } as any)
      } catch (error) {
        console.error('Error removing cookie:', error)
      }
    }
  }

  return createSupabaseServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieManager.get(name),
        set: (name: string, value: string, options: any) => cookieManager.set(name, value, options),
        remove: (name: string, options: any) => cookieManager.remove(name, options)
      },
    }
  )
}
