'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import MagneticEffect from '@/components/MagneticEffect';
import ScrollAnimations from '@/components/ScrollAnimations';
import VerifiedBadge from '@/components/VerifiedBadge';
import KYCStatus from '@/components/KYCStatus';
import KYCVerification from '@/components/KYCVerification';
import dynamic from 'next/dynamic';
import HederaAccountCreator from '@/components/HederaAccountCreator';
import { ensureProfileExists } from '@/lib/profile';

// Dynamically import WalletConnect to avoid SSR issues
const WalletConnect = dynamic(() => import('@/components/WalletConnect'), {
  ssr: false,
  loading: () => <div className="h-10 bg-white/5 border border-white/10 rounded-lg animate-pulse"></div>
});

interface ProfileRow {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  provider: string | null;
  wallet_address: string | null;
  hedera_evm_address: string | null;
  hedera_private_key: string | null;
  hedera_public_key: string | null;
  kyc_status: 'unverified' | 'pending' | 'verified' | null;
  kyc_verified_at: string | null;
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [showHederaCreator, setShowHederaCreator] = useState(false);

  const updateProfileStatus = (newStatus: 'unverified' | 'pending' | 'verified') => {
    if (profile) {
      setProfile({
        ...profile,
        kyc_status: newStatus
      });
    }
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/auth';
        return;
      }

      // Make sure a profile row exists for the authenticated user
      await ensureProfileExists();

      const { data } = await supabase
        .from('profiles')
        .select('id,email,full_name,avatar_url,provider,wallet_address,hedera_evm_address,hedera_private_key,hedera_public_key,kyc_status,kyc_verified_at')
        .eq('id', session.user.id)
        .single();

      if (data) {
        setProfile(data as ProfileRow);
        setFullName(data.full_name || '');
        setAvatarUrl(data.avatar_url || '');
        setWalletAddress(data.wallet_address || '');
      } else {
        // Fallback: populate minimal profile shape so the page is not blank
        setProfile({
          id: session.user.id,
          email: session.user.email ?? null,
          full_name: null,
          avatar_url: null,
          provider: 'email',
          wallet_address: null,
          hedera_evm_address: null,
          hedera_private_key: null,
          hedera_public_key: null,
          kyc_status: 'unverified',
          kyc_verified_at: null
        });
      }
      setLoading(false);
    };
    init();
  }, []);

  const saveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    await supabase
      .from('profiles')
      .update({
        full_name: fullName || null,
        avatar_url: avatarUrl || null,
        wallet_address: walletAddress || null,
      })
      .eq('id', profile.id);
    setSaving(false);
  };

  const onWalletConnected = async (acc: string) => {
    // External wallet connected; save immediately and hide Hedera creator.
    setWalletAddress(acc);
    setShowHederaCreator(false);
    if (profile) {
      await supabase
        .from('profiles')
        .update({ wallet_address: acc })
        .eq('id', profile.id);
    }
  };

  const onWalletVerified = async (acc: string, signatureHex: string) => {
    if (!profile) return;
    setSaving(true);
    await supabase
      .from('profiles')
      .update({ wallet_address: acc })
      .eq('id', profile.id);
    setSaving(false);
  };

  const onHederaAccountCreated = async (accountId: string, evmAddress: string) => {
    setWalletAddress(accountId);
    setShowHederaCreator(false);
    // Refresh profile data
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data } = await supabase
        .from('profiles')
        .select('id,email,full_name,avatar_url,provider,wallet_address,hedera_evm_address,hedera_private_key,hedera_public_key,kyc_status,kyc_verified_at')
        .eq('id', session.user.id)
        .single();
      if (data) {
        setProfile(data as ProfileRow);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-gray-300">Unable to load profile. Please try refreshing.</div>
      </div>
    );
  }

  const verified = profile.kyc_status === 'verified';
  const hasExternalWallet = Boolean(walletAddress && walletAddress.startsWith('0x'));
  const hasHederaAccount = Boolean(profile.hedera_evm_address || (profile.wallet_address && profile.wallet_address.startsWith('0.')));

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
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollAnimations animationType="fade-in-up">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
              <div className="flex items-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-2xl mr-4">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="avatar" className="w-16 h-16 rounded-2xl object-cover" />
                  ) : (
                    <span>👤</span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-bold text-white">Profile</h1>
                  {verified && <VerifiedBadge />}
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Full name</label>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Avatar URL</label>
                  <input
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                  <input value={profile.email || ''} disabled className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-300">Wallet address</label>
                    <WalletConnect onConnected={onWalletConnected} onVerified={onWalletVerified} />
                  </div>
                  <input
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300"
                    placeholder="0.0.xxxxx"
                  />
                </div>

                {/* Hedera Account Creation Section */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-300">Or create a Hedera Account</label>
                    {!hasExternalWallet && !hasHederaAccount && !showHederaCreator && (
                      <button
                        onClick={() => setShowHederaCreator(true)}
                        className="px-3 py-2 rounded-lg text-sm bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors"
                      >
                        Create Hedera Account
                      </button>
                    )}
                  </div>

                  {/* Show existing Hedera details if available */}
                  {!showHederaCreator && (profile.hedera_evm_address || hasHederaAccount) && (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                      {hasHederaAccount && (
                        <div>
                          <div className="text-xs text-gray-400">Hedera Account ID</div>
                          <div className="flex items-center space-x-2">
                            <code className="flex-1 px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-emerald-400 font-mono text-sm break-all">
                              {profile.wallet_address}
                            </code>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(profile.wallet_address || '');
                                // Show a temporary notification
                                const notification = document.createElement('div');
                                notification.textContent = 'Hedera Account ID copied!';
                                notification.className = 'fixed top-4 right-4 bg-emerald-500 text-white px-4 py-2 rounded-lg z-50 transition-opacity duration-300';
                                document.body.appendChild(notification);
                                
                                setTimeout(() => {
                                  notification.style.opacity = '0';
                                  setTimeout(() => document.body.removeChild(notification), 300);
                                }, 2000);
                              }}
                              className="px-3 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      )}
                      {profile.hedera_evm_address && (
                        <div>
                          <div className="text-xs text-gray-400">EVM Address</div>
                          <div className="flex items-center space-x-2">
                            <code className="flex-1 px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-emerald-400 font-mono text-sm break-all">
                              {profile.hedera_evm_address}
                            </code>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(profile.hedera_evm_address || '');
                                // Show a temporary notification
                                const notification = document.createElement('div');
                                notification.textContent = 'EVM Address copied!';
                                notification.className = 'fixed top-4 right-4 bg-emerald-500 text-white px-4 py-2 rounded-lg z-50 transition-opacity duration-300';
                                document.body.appendChild(notification);
                                
                                setTimeout(() => {
                                  notification.style.opacity = '0';
                                  setTimeout(() => document.body.removeChild(notification), 300);
                                }, 2000);
                              }}
                              className="px-3 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {showHederaCreator && !hasExternalWallet && (
                    <HederaAccountCreator
                      onAccountCreated={onHederaAccountCreated}
                      className="mt-2"
                    />
                  )}

                  {hasExternalWallet && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-sm text-yellow-300">
                      External wallet connected. Hedera account creation is not required.
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">KYC status</label>
                  <KYCStatus status={profile.kyc_status} />
                </div>

                <KYCVerification 
                  userId={profile.id}
                  currentStatus={profile.kyc_status}
                  onStatusChange={updateProfileStatus}
                />

                <MagneticEffect>
                  <button
                    onClick={saveProfile}
                    disabled={saving}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 px-4 rounded-xl font-medium hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 hover-lift disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save changes'}
                  </button>
                </MagneticEffect>
              </div>
            </div>
          </ScrollAnimations>

          <div className="mt-8 text-center">
            <Link href="/dashboard" className="text-gray-400 hover:text-white">← Back to Dashboard</Link>
          </div>
        </div>
      </div>
    </div>
  );
}