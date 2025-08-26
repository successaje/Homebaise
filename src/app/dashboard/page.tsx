'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MagneticEffect from '@/components/MagneticEffect';
import ScrollAnimations from '@/components/ScrollAnimations';
import UserAvatar from '@/components/UserAvatar';
import KYCStatus from '@/components/KYCStatus';
import { ensureProfileExists } from '@/lib/profile';

interface ProfileRow {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  provider: string | null;
  wallet_address: string | null;
  kyc_status: 'unverified' | 'pending' | 'verified' | null;
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth');
        return;
      }
      setUser(session.user);
      await ensureProfileExists(session.user);
      
      // Fetch profile data
      const { data } = await supabase
        .from('profiles')
        .select('id,email,full_name,avatar_url,provider,wallet_address,kyc_status')
        .eq('id', session.user.id)
        .single();
      
      if (data) {
        setProfile(data as ProfileRow);
      }
      
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push('/auth');
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
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
              <Link href="/properties" className="text-gray-300 hover:text-white">Properties</Link>
              <Link href="/portfolio" className="text-gray-300 hover:text-white">Portfolio</Link>
              <Link href="/analytics" className="text-gray-300 hover:text-white">Analytics</Link>
              <Link href="/admin" className="text-gray-300 hover:text-white">Admin</Link>
              <Link href="/profile" className="text-gray-300 hover:text-white">Profile</Link>
              <MagneticEffect>
                <button
                  onClick={handleSignOut}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Sign Out
                </button>
              </MagneticEffect>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollAnimations animationType="fade-in-up">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
              <h1 className="text-3xl font-bold text-white mb-6">Welcome to Homebaise</h1>
              <div className="mb-6">
                <UserAvatar
                  avatarUrl={profile?.avatar_url}
                  fullName={profile?.full_name}
                  email={user?.email}
                  kycStatus={profile?.kyc_status}
                  size="lg"
                  showVerifiedBadge={true}
                />
                <p className="text-gray-400 mt-2">
                  {user?.email} • <KYCStatus status={profile?.kyc_status} showIcon={false} />
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MagneticEffect>
                  <Link href="/properties">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300 hover-lift">
                      <h3 className="text-xl font-semibold text-white mb-2">Browse Properties</h3>
                      <p className="text-gray-400">Discover and invest in tokenized African real estate opportunities</p>
                    </div>
                  </Link>
                </MagneticEffect>
                
                <MagneticEffect>
                  <Link href="/portfolio">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300 hover-lift">
                      <h3 className="text-xl font-semibold text-white mb-2">My Portfolio</h3>
                      <p className="text-gray-400">Track your investments, returns, and portfolio performance</p>
                    </div>
                  </Link>
                </MagneticEffect>
                
                <MagneticEffect>
                  <Link href="/analytics">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300 hover-lift">
                      <h3 className="text-xl font-semibold text-white mb-2">Analytics</h3>
                      <p className="text-gray-400">View detailed investment analytics and performance insights</p>
                    </div>
                  </Link>
                </MagneticEffect>
                
                <MagneticEffect>
                  <Link href="/profile">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300 hover-lift">
                      <h3 className="text-xl font-semibold text-white mb-2">Manage Profile</h3>
                      <p className="text-gray-400">Update your profile, connect wallet, and manage KYC status</p>
                    </div>
                  </Link>
                </MagneticEffect>
              </div>
            </div>
          </ScrollAnimations>
        </div>
      </div>
    </div>
  );
} 