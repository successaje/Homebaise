'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import MagneticEffect from '@/components/MagneticEffect';
import ScrollAnimations from '@/components/ScrollAnimations';
import VerifiedBadge from '@/components/VerifiedBadge';

interface ProfileRow {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  provider: string | null;
  wallet_address: string | null;
  kyc_status: 'unverified' | 'pending' | 'verified' | null;
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [walletAddress, setWalletAddress] = useState('');

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/auth';
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('id,email,full_name,avatar_url,provider,wallet_address,kyc_status')
        .eq('id', session.user.id)
        .single();

      if (data) {
        setProfile(data as ProfileRow);
        setFullName(data.full_name || '');
        setAvatarUrl(data.avatar_url || '');
        setWalletAddress(data.wallet_address || '');
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

  // Placeholder for wallet connect (implement HashConnect later)
  const connectWallet = async () => {
    // TODO: integrate HashConnect; for now prompt input or mock
    const input = prompt('Enter your Hedera account (0.0.x)');
    if (input) {
      setWalletAddress(input);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profile) return null;

  const verified = profile.kyc_status === 'verified';

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
                    <button onClick={connectWallet} className="text-emerald-400 hover:text-emerald-300 text-sm">Connect</button>
                  </div>
                  <input
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300"
                    placeholder="0.0.xxxxx"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">KYC status</label>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${verified ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : profile.kyc_status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 'bg-white/10 text-gray-300 border border-white/10'}`}>
                    {profile.kyc_status || 'unverified'}
                  </div>
                </div>

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