'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { getCurrentUserProfile, getBasicProfile, testSupabaseConnection, ProfileRow } from '@/lib/profile'
import WalletConnect from '@/components/WalletConnect'
import HederaAccountCreator from '@/components/HederaAccountCreator'
import KYCVerification from '@/components/KYCVerification'
import KYCStatus from '@/components/KYCStatus'
import UserAvatar from '@/components/UserAvatar'
import VerifiedBadge from '@/components/VerifiedBadge'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [walletAddress, setWalletAddress] = useState('')
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    const init = async () => {
      console.log('Profile page - Starting initialization...')
      
      // Get current session
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      setSession(currentSession)
      
      if (!currentSession) {
        console.log('Profile page - No session found')
        setLoading(false)
        return
      }

      console.log('Profile page - Session found:', currentSession.user.id)

      // Use the API route to get profile data (server-side approach)
      let profileData = null;
      
      try {
        const response = await fetch('/api/profile', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Profile page - API response:', data);
          
          if (data.profile) {
            profileData = data.profile;
            console.log('Profile page - Profile from API:', profileData);
          } else {
            console.error('Profile page - No profile in API response');
          }
        } else {
          console.error('Profile page - API error:', response.status, response.statusText);
          const errorData = await response.json();
          console.error('Profile page - API error details:', errorData);
        }
      } catch (apiError) {
        console.error('Profile page - API fetch error:', apiError);
      }

      // Fallback to client-side approach if API fails
      if (!profileData) {
        console.log('Profile page - Falling back to client-side approach...');
        
        // First, test the Supabase connection
        const connectionTest = await testSupabaseConnection();
        console.log('Profile page - Connection test result:', connectionTest);

        // Try to get complete profile first
        profileData = await getCurrentUserProfile();
        console.log('Profile page - Complete profile data:', profileData);

        // If complete profile fails, try basic profile
        if (!profileData) {
          console.log('Profile page - Trying basic profile...');
          profileData = await getBasicProfile();
          console.log('Profile page - Basic profile data:', profileData);
        }
      }

      if (profileData) {
        console.log('Profile page - Setting profile data:', profileData);
        setProfile(profileData as ProfileRow);
        setFullName(profileData.full_name || '');
        setAvatarUrl(profileData.avatar_url || '');
        setWalletAddress(profileData.wallet_address || '');
        console.log('Profile page - State variables set:', {
          fullName: profileData.full_name || '',
          avatarUrl: profileData.avatar_url || '',
          walletAddress: profileData.wallet_address || ''
        });
      } else {
        console.log('Profile page - Using fallback profile data');
        // Create a fallback profile if none exists
        setProfile({
          id: currentSession.user.id,
          email: currentSession.user.email ?? null,
          full_name: null,
          avatar_url: null,
          provider: 'email',
          role: 'user',
          wallet_address: null,
          hedera_account_id: null,
          hedera_evm_address: null,
          hedera_private_key: null,
          hedera_public_key: null,
          kyc_status: 'unverified',
          kyc_verified_at: null,
          created_at: null,
          updated_at: null
        });
      }
      
      setLoading(false);
    };

    init();
  }, []);

  // Debug effect to monitor state changes
  useEffect(() => {
    console.log('Profile page - State updated:', {
      profile,
      fullName,
      avatarUrl,
      walletAddress,
      loading
    });
  }, [profile, fullName, avatarUrl, walletAddress, loading]);

  const saveProfile = async () => {
    if (!profile) return

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        avatar_url: avatarUrl,
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Please sign in to view your profile</h1>
          <p className="text-gray-600">You need to be authenticated to access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-12">
            <div className="flex items-center space-x-6">
              <UserAvatar 
                src={avatarUrl} 
                alt={fullName || 'User'} 
                size="xl"
                className="ring-4 ring-white/20"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold text-white">
                    {fullName || 'Your Profile'}
                  </h1>
                  {profile?.kyc_status === 'verified' && <VerifiedBadge />}
                </div>
                <p className="text-indigo-100 text-lg">{profile?.email}</p>
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
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Information</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Avatar URL
                      </label>
                      <input
                        type="url"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Enter avatar URL"
                      />
                    </div>
                    <button
                      onClick={saveProfile}
                      className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>

                {/* KYC Status */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Identity Verification</h2>
                  <KYCStatus status={profile?.kyc_status || 'unverified'} />
                  {profile?.kyc_status !== 'verified' && <KYCVerification />}
                </div>
              </div>

              {/* Wallet & Hedera */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Wallet & Blockchain</h2>
                  <div className="space-y-4">
                    <WalletConnect 
                      onWalletConnected={(address) => setWalletAddress(address)}
                      currentAddress={walletAddress}
                    />
                    
                    {!profile?.hedera_account_id && !walletAddress && (
                      <HederaAccountCreator />
                    )}
                    
                    {profile?.hedera_account_id && (
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <h3 className="font-medium text-gray-900">Hedera Account</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Account ID:</span>
                            <div className="flex items-center space-x-2">
                              <code className="text-sm bg-white px-2 py-1 rounded border">
                                {profile.hedera_account_id}
                              </code>
                              <button
                                onClick={() => navigator.clipboard.writeText(profile.hedera_account_id!)}
                                className="text-indigo-600 hover:text-indigo-800 text-sm"
                              >
                                Copy
                              </button>
                            </div>
                          </div>
                          {profile.hedera_evm_address && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">EVM Address:</span>
                              <div className="flex items-center space-x-2">
                                <code className="text-sm bg-white px-2 py-1 rounded border">
                                  {profile.hedera_evm_address}
                                </code>
                                <button
                                  onClick={() => navigator.clipboard.writeText(profile.hedera_evm_address!)}
                                  className="text-indigo-600 hover:text-indigo-800 text-sm"
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
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Details</h2>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Provider:</span>
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {profile?.provider || 'email'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Member Since:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Last Updated:</span>
                      <span className="text-sm font-medium text-gray-900">
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
  )
}