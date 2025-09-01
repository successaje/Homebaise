'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function DatabaseTest() {
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testDatabase = async () => {
    setLoading(true)
    try {
      // Test 1: Check if we can connect
      console.log('Testing database connection...')
      
      // Test 2: Check if profiles table exists and has the right columns
      const { data: columns, error: columnsError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1)

      if (columnsError) {
        console.error('Columns test error:', columnsError)
        setResults({
          success: false,
          error: columnsError.message,
          code: columnsError.code
        })
        return
      }

      // Test 3: Check if we can fetch a profile
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setResults({
          success: false,
          error: 'No authenticated user found'
        })
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Profile test error:', profileError)
        setResults({
          success: false,
          error: profileError.message,
          code: profileError.code,
          details: profileError.details,
          hint: profileError.hint
        })
        return
      }

      setResults({
        success: true,
        profile: profile,
        message: 'Database connection and profile fetch successful'
      })

    } catch (error) {
      console.error('Database test error:', error)
      setResults({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 bg-white/5 backdrop-blur-xl rounded-xl border border-white/10">
      <h3 className="text-lg font-semibold text-white mb-4">Database Test</h3>
      
      <button
        onClick={testDatabase}
        disabled={loading}
        className="bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test Database Connection'}
      </button>

      {results && (
        <div className="mt-4">
          {results.success ? (
            <div className="text-green-400">
              <p>✅ {results.message}</p>
              {results.profile && (
                <div className="mt-2 text-sm">
                  <p><strong>Profile ID:</strong> {results.profile.id}</p>
                  <p><strong>Email:</strong> {results.profile.email}</p>
                  <p><strong>Full Name:</strong> {results.profile.full_name}</p>
                  <p><strong>Role:</strong> {results.profile.role}</p>
                  <p><strong>KYC Status:</strong> {results.profile.kyc_status}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-red-400">
              <p>❌ Error: {results.error}</p>
              {results.code && <p><strong>Code:</strong> {results.code}</p>}
              {results.details && <p><strong>Details:</strong> {results.details}</p>}
              {results.hint && <p><strong>Hint:</strong> {results.hint}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  )
} 