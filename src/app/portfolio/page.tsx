'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { InvestmentService } from '@/lib/investment';
import { InvestorPortfolioItem } from '@/types/investment';
import { formatCurrency, formatNumber } from '@/lib/utils';
import MagneticEffect from '@/components/MagneticEffect';
import ScrollAnimations from '@/components/ScrollAnimations';
import Link from 'next/link';

interface PortfolioSummary {
  totalInvested: number;
  totalTokens: number;
  totalEarnings: number;
  activeInvestments: number;
  completedInvestments: number;
}

export default function PortfolioPage() {
  const router = useRouter();
  const [portfolio, setPortfolio] = useState<InvestorPortfolioItem[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary>({
    totalInvested: 0,
    totalTokens: 0,
    totalEarnings: 0,
    activeInvestments: 0,
    completedInvestments: 0
  });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        
        // Get user session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/auth');
          return;
        }
        setUser(session.user);

        // Fetch portfolio data
        const portfolioData = await InvestmentService.fetchPortfolio(session.user.id);
        setPortfolio(portfolioData.portfolio);
        setSummary(portfolioData.summary);
      } catch (error) {
        console.error('Error loading portfolio:', error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

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
              <Link href="/properties" className="text-gray-300 hover:text-white">Properties</Link>
              <Link href="/dashboard" className="text-gray-300 hover:text-white">Dashboard</Link>
              <Link href="/profile" className="text-gray-300 hover:text-white">Profile</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollAnimations animationType="fade-in-up">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">Investment Portfolio</h1>
              <p className="text-gray-400">Track your property investments and returns</p>
            </div>

            {/* Portfolio Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-gray-400 text-sm mb-2">Total Invested</h3>
                <p className="text-2xl font-bold text-white">{formatCurrency(summary.totalInvested)}</p>
              </div>
              
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-gray-400 text-sm mb-2">Total Tokens</h3>
                <p className="text-2xl font-bold text-white">{summary.totalTokens.toLocaleString()}</p>
              </div>
              
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-gray-400 text-sm mb-2">Total Earnings</h3>
                <p className="text-2xl font-bold text-emerald-400">{formatCurrency(summary.totalEarnings)}</p>
              </div>
              
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-gray-400 text-sm mb-2">Active Investments</h3>
                <p className="text-2xl font-bold text-white">{summary.activeInvestments}</p>
              </div>
            </div>

            {/* Portfolio Items */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Your Investments</h2>
              
              {portfolio.length === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
                  <div className="text-6xl mb-4">📈</div>
                  <h3 className="text-xl font-semibold text-white mb-2">No Investments Yet</h3>
                  <p className="text-gray-400 mb-6">Start building your property investment portfolio</p>
                  <MagneticEffect>
                    <Link 
                      href="/properties"
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 hover-lift"
                    >
                      Browse Properties
                    </Link>
                  </MagneticEffect>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {portfolio.map((item) => (
                    <div key={`${item.investor_id}-${item.property_id}`} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-1">{item.property_name}</h3>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${
                            item.property_status === 'active' 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                          }`}>
                            {item.property_status}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-white">{formatCurrency(item.total_invested)}</p>
                          <p className="text-sm text-gray-400">{item.total_tokens.toLocaleString()} tokens</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-sm">Average Token Price</span>
                          <span className="text-white">${item.average_token_price.toFixed(2)}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-sm">Number of Investments</span>
                          <span className="text-white">{item.number_of_investments}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-sm">Total Earnings</span>
                          <span className="text-emerald-400 font-semibold">{formatCurrency(item.total_earnings)}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-sm">Last Investment</span>
                          <span className="text-white text-sm">
                            {item.last_investment_date 
                              ? new Date(item.last_investment_date).toLocaleDateString()
                              : 'N/A'
                            }
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <MagneticEffect>
                          <Link 
                            href={`/properties/${item.property_id}`}
                            className="inline-flex items-center px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm"
                          >
                            View Property →
                          </Link>
                        </MagneticEffect>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollAnimations>
        </div>
      </div>
    </div>
  );
}