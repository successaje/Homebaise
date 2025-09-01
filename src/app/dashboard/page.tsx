'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { getCurrentUserProfile, ProfileRow } from '@/lib/profile'
import Link from 'next/link'
import MagneticEffect from '@/components/MagneticEffect'
import ScrollAnimations from '@/components/ScrollAnimations'
import VerifiedBadge from '@/components/VerifiedBadge'
import KYCStatus from '@/components/KYCStatus'
import UserAvatar from '@/components/UserAvatar'
import DatabaseTest from '@/components/DatabaseTest'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function DashboardPage() {
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      try {
        // First check if user is authenticated
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        
        if (!currentSession) {
          console.log('Dashboard - No session found, redirecting to auth')
          router.push('/auth')
          return
        }

        setSession(currentSession)
        console.log('Dashboard - Session found for user:', currentSession.user.id)

        const profileData = await getCurrentUserProfile()
        console.log('Dashboard - Profile data:', profileData)
        setProfile(profileData)
      } catch (error) {
        console.error('Dashboard - Error fetching profile:', error)
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-300 mb-4">Please sign in to access your dashboard</div>
          <Link href="/auth" className="bg-emerald-500 text-white px-6 py-2 rounded-lg hover:bg-emerald-600 transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-300 mb-4">Unable to load profile. Please try refreshing.</div>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-emerald-500 text-white px-6 py-2 rounded-lg hover:bg-emerald-600 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }

  const verified = profile.kyc_status === 'verified'
  const isAdmin = profile.role === 'admin'

  return (
    <div className="min-h-screen bg-black particles">
      <nav className="fixed w-full bg-black/80 backdrop-blur-xl border-b border-white/10 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center animate-glow">
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <span className="text-xl font-bold text-white">Homebaise</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/profile" className="text-gray-300 hover:text-white">Profile</Link>
              {isAdmin && (
                <Link href="/admin" className="text-gray-300 hover:text-white">Admin</Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollAnimations animationType="fade-in-up">
            {/* Welcome Section */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 mb-8">
              <div className="flex items-center space-x-6">
                <UserAvatar 
                  src={profile.avatar_url} 
                  alt={profile.full_name || 'User'} 
                  size="xl"
                  className="ring-4 ring-emerald-500/20"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-3xl font-bold text-white">
                      Welcome back, {profile.full_name || 'User'}!
                    </h1>
                    {verified && <VerifiedBadge />}
                  </div>
                  <p className="text-gray-300 text-lg">{profile.email}</p>
                  {profile.role && (
                    <span className="inline-block bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-sm font-medium mt-2">
                      {profile.role}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">KYC Status</p>
                    <p className="text-white text-2xl font-bold">
                      {profile.kyc_status === 'verified' ? 'Verified' : 'Pending'}
                    </p>
                  </div>
                  <KYCStatus status={profile.kyc_status || 'unverified'} />
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Wallet</p>
                    <p className="text-white text-2xl font-bold">
                      {profile.wallet_address ? 'Connected' : 'Not Connected'}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-emerald-400 text-xl">💳</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Hedera Account</p>
                    <p className="text-white text-2xl font-bold">
                      {profile.hedera_account_id ? 'Active' : 'Not Created'}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-purple-400 text-xl">⚡</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <MagneticEffect>
                <Link href="/properties" className="block">
                  <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 group">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <span className="text-blue-400 text-xl">🏠</span>
                    </div>
                    <h3 className="text-white font-semibold text-lg mb-2">Browse Properties</h3>
                    <p className="text-gray-400 text-sm">Discover investment opportunities in real estate</p>
                  </div>
                </Link>
              </MagneticEffect>

              <MagneticEffect>
                <Link href="/portfolio" className="block">
                  <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 group">
                    <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <span className="text-green-400 text-xl">📊</span>
                    </div>
                    <h3 className="text-white font-semibold text-lg mb-2">My Portfolio</h3>
                    <p className="text-gray-400 text-sm">Track your investments and returns</p>
                  </div>
                </Link>
              </MagneticEffect>

              <MagneticEffect>
                <Link href="/market" className="block">
                  <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 group">
                    <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <span className="text-yellow-400 text-xl">📈</span>
                    </div>
                    <h3 className="text-white font-semibold text-lg mb-2">Market</h3>
                    <p className="text-gray-400 text-sm">View market trends and analytics</p>
                  </div>
                </Link>
              </MagneticEffect>

              <MagneticEffect>
                <Link href="/list-property" className="block">
                  <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 group">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <span className="text-purple-400 text-xl">➕</span>
                    </div>
                    <h3 className="text-white font-semibold text-lg mb-2">List Property</h3>
                    <p className="text-gray-400 text-sm">Tokenize and list your property</p>
                  </div>
                </Link>
              </MagneticEffect>

              <MagneticEffect>
                <Link href="/community" className="block">
                  <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 group">
                    <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <span className="text-pink-400 text-xl">👥</span>
                    </div>
                    <h3 className="text-white font-semibold text-lg mb-2">Community</h3>
                    <p className="text-gray-400 text-sm">Connect with other investors</p>
                  </div>
                </Link>
              </MagneticEffect>

              <MagneticEffect>
                <Link href="/analytics" className="block">
                  <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 group">
                    <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <span className="text-indigo-400 text-xl">📊</span>
                    </div>
                    <h3 className="text-white font-semibold text-lg mb-2">Analytics</h3>
                    <p className="text-gray-400 text-sm">Detailed performance insights</p>
                  </div>
                </Link>
              </MagneticEffect>
            </div>

            {/* Recent Activity */}
            <div className="mt-8 bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-6">Recent Activity</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-4 bg-white/5 rounded-lg">
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-emerald-400">✓</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">Profile updated</p>
                    <p className="text-gray-400 text-sm">Your profile information was updated</p>
                  </div>
                  <span className="text-gray-400 text-sm">Just now</span>
                </div>
                
                {profile.created_at && (
                  <div className="flex items-center space-x-4 p-4 bg-white/5 rounded-lg">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <span className="text-blue-400">🎉</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">Account created</p>
                      <p className="text-gray-400 text-sm">Welcome to Homebaise!</p>
                    </div>
                    <span className="text-gray-400 text-sm">
                      {new Date(profile.created_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Database Test Component (Temporary) */}
            <div className="mt-8">
              <DatabaseTest />
            </div>
          </ScrollAnimations>
        </div>
      </div>
    </div>
  )
} 