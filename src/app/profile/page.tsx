'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { getCurrentUserProfile, ProfileRow } from '@/lib/profile'
import Link from 'next/link'
import UserAvatar from '@/components/UserAvatar'
import VerifiedBadge from '@/components/VerifiedBadge'
import KYCStatus from '@/components/KYCStatus'
import KYCVerification from '@/components/KYCVerification'
import WalletConnect from '@/components/WalletConnect'
import HederaAccountCreator from '@/components/HederaAccountCreator'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [walletAddress, setWalletAddress] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<{ user: { id: string; email?: string } } | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // First check if user is authenticated
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        
        if (!currentSession) {
          console.log('Profile - No session found, redirecting to auth')
          router.push('/auth')
          return
        }

        setSession(currentSession)
        console.log('Profile - Session found for user:', currentSession.user.id)

        const profileData = await getCurrentUserProfile()
        console.log('Profile page - Complete profile data:', profileData)
        
        if (profileData) {
          setProfile(profileData)
          setFullName(profileData.full_name || '')
          setAvatarUrl(profileData.avatar_url || '')
          setWalletAddress(profileData.wallet_address || '')
          setPhoneNumber(profileData.phone_number || '')
          
          console.log('Profile page - Setting profile data:', profileData)
          console.log('Profile page - State variables set:', {
            fullName: profileData.full_name,
            avatarUrl: profileData.avatar_url,
            walletAddress: profileData.wallet_address
          })
        }
      } catch (error) {
        console.error('Profile - Error fetching profile:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [router])

  // Debug effect to monitor state changes
  useEffect(() => {
    console.log('Profile page - State updated:', {
      profile,
      fullName,
      avatarUrl,
      walletAddress,
      loading
    });
  }, [profile, fullName, avatarUrl, walletAddress, phoneNumber, loading]);

  const saveProfile = async () => {
    if (!profile) return

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        avatar_url: avatarUrl,
        phone_number: phoneNumber,
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id)

    if (error) {
      console.error('Error updating profile:', error)
    } else {
      console.log('Profile updated successfully')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Please sign in to view your profile</h1>
          <p className="text-gray-300 mb-4">You need to be authenticated to access this page.</p>
          <Link href="/auth" className="bg-emerald-500 text-white px-6 py-2 rounded-lg hover:bg-emerald-600 transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    )
  }

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
              <Link href="/dashboard" className="text-gray-300 hover:text-white">Dashboard</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-12">
              <div className="flex items-center space-x-6">
                <UserAvatar 
                  avatarUrl={avatarUrl} 
                  fullName={fullName}
                  size="xl"
                  showName={false}
                  className="ring-4 ring-white/20"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-3xl font-bold text-white">
                      {fullName || 'Your Profile'}
                    </h1>
                    {profile?.kyc_status === 'verified' && <VerifiedBadge />}
                  </div>
                  <p className="text-emerald-100 text-lg">{profile?.email}</p>
                  {profile?.role && (
                    <span className="inline-block bg-white/20 text-white px-3 py-1 rounded-full text-sm font-medium mt-2">
                      {profile.role}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Profile Information */}
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-4">Profile Information</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Avatar URL
                        </label>
                        <input
                          type="url"
                          value={avatarUrl}
                          onChange={(e) => setAvatarUrl(e.target.value)}
                          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          placeholder="Enter avatar URL"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          placeholder="+1234567890 (for WhatsApp/Telegram bots)"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          Used for WhatsApp and Telegram bot integration
                        </p>
                      </div>
                      <button
                        onClick={saveProfile}
                        className="w-full bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>

                  {/* KYC Status */}
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-4">Identity Verification</h2>
                    <KYCStatus status={profile?.kyc_status || 'unverified'} />
                    {profile?.kyc_status !== 'verified' && (
                      <KYCVerification
                        userId={profile?.id || ''}
                        currentStatus={profile?.kyc_status || 'unverified'}
                        onStatusChange={(status) => {
                          // Handle status change if needed
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* Wallet & Hedera */}
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-4">Wallet & Blockchain</h2>
                    <div className="space-y-4">
                      <WalletConnect 
                        onConnected={(address) => setWalletAddress(address)}
                      />
                      
                      {!profile?.hedera_account_id && !walletAddress && (
                        <HederaAccountCreator 
                          onAccountCreated={(accountId, evmAddress) => {
                            setWalletAddress(accountId);
                            // Refresh profile data by calling the effect again
                            window.location.reload();
                          }}
                        />
                      )}
                      
                      {profile?.hedera_account_id && (
                        <div className="bg-white/5 rounded-lg p-4 space-y-3 border border-white/10">
                          <h3 className="font-medium text-white">Hedera Account</h3>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-300">Account ID:</span>
                              <div className="flex items-center space-x-2">
                                <code className="text-sm bg-black/50 px-2 py-1 rounded border border-white/10 text-emerald-400">
                                  {profile.hedera_account_id}
                                </code>
                                <button
                                  onClick={() => navigator.clipboard.writeText(profile.hedera_account_id!)}
                                  className="text-emerald-400 hover:text-emerald-300 text-sm"
                                >
                                  Copy
                                </button>
                              </div>
                            </div>
                            {profile.hedera_evm_address && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-300">EVM Address:</span>
                                <div className="flex items-center space-x-2">
                                  <code className="text-sm bg-black/50 px-2 py-1 rounded border border-white/10 text-emerald-400">
                                    {profile.hedera_evm_address}
                                  </code>
                                  <button
                                    onClick={() => navigator.clipboard.writeText(profile.hedera_evm_address!)}
                                    className="text-emerald-400 hover:text-emerald-300 text-sm"
                                  >
                                    Copy
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Account Details */}
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-4">Account Details</h2>
                    <div className="bg-white/5 rounded-lg p-4 space-y-3 border border-white/10">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-300">Provider:</span>
                        <span className="text-sm font-medium text-white capitalize">
                          {profile?.provider || 'email'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-300">Member Since:</span>
                        <span className="text-sm font-medium text-white">
                          {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-300">Last Updated:</span>
                        <span className="text-sm font-medium text-white">
                          {profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}