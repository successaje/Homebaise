'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MagneticEffect from '@/components/MagneticEffect';
import ScrollAnimations from '@/components/ScrollAnimations';
import { ensureProfileExists } from '@/lib/profile';

interface User {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
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
      // Ensure profile exists after auth
      await ensureProfileExists();
      setLoading(false);
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        router.push('/auth');
      } else if (session) {
        setUser(session.user);
        await ensureProfileExists();
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
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
      {/* Navigation */}
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
              <span className="text-gray-300">
                Welcome, {user?.user_metadata?.full_name || user?.email}
              </span>
              <MagneticEffect>
                <button
                  onClick={handleSignOut}
                  className="bg-white/5 border border-white/10 text-white px-4 py-2 rounded-lg hover:bg-white/10 transition-all hover-lift"
                >
                  Sign Out
                </button>
              </MagneticEffect>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollAnimations animationType="fade-in-up">
            <div className="text-center mb-12">
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
                Welcome to Your Dashboard
              </h1>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Start exploring African real estate opportunities and manage your investments
              </p>
            </div>
          </ScrollAnimations>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <ScrollAnimations animationType="fade-in-up" delay={200}>
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 hover:border-emerald-500/30 transition-all duration-500 hover-lift">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center text-2xl mb-6 animate-morph">
                  🏠
                </div>
                <h3 className="text-xl font-bold text-white mb-4">My Properties</h3>
                <p className="text-gray-400 mb-6">View and manage your tokenized property investments</p>
                <MagneticEffect>
                  <button className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 px-6 rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300">
                    View Properties
                  </button>
                </MagneticEffect>
              </div>
            </ScrollAnimations>

            <ScrollAnimations animationType="fade-in-up" delay={400}>
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 hover:border-emerald-500/30 transition-all duration-500 hover-lift">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-2xl mb-6 animate-morph">
                  💰
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Portfolio</h3>
                <p className="text-gray-400 mb-6">Track your investment performance and earnings</p>
                <MagneticEffect>
                  <button className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 px-6 rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300">
                    View Portfolio
                  </button>
                </MagneticEffect>
              </div>
            </ScrollAnimations>

            <ScrollAnimations animationType="fade-in-up" delay={600}>
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 hover:border-emerald-500/30 transition-all duration-500 hover-lift">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-2xl mb-6 animate-morph">
                  📊
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Analytics</h3>
                <p className="text-gray-400 mb-6">Detailed insights and market analysis</p>
                <MagneticEffect>
                  <button className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 px-6 rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300">
                    View Analytics
                  </button>
                </MagneticEffect>
              </div>
            </ScrollAnimations>
          </div>

          <ScrollAnimations animationType="fade-in-up" delay={800}>
            <div className="mt-12 text-center">
              <Link href="/">
                <MagneticEffect>
                  <button className="border border-white/20 bg-white/5 text-white px-8 py-4 rounded-full font-medium hover:bg-white/10 transition-all hover-lift">
                    ← Back to Home
                  </button>
                </MagneticEffect>
              </Link>
            </div>
          </ScrollAnimations>
        </div>
      </div>
    </div>
  );
} 