'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MagneticEffect from '@/components/MagneticEffect';
import ScrollAnimations from '@/components/ScrollAnimations';
import { formatNumber, formatCurrency, getPropertyTypeLabel, getCountryFlag } from '@/lib/utils';

interface Investment {
  id: string;
  propertyId: string;
  propertyName: string;
  propertyType: string;
  propertyLocation: string;
  propertyCountry: string;
  amount: number;
  tokens: number;
  tokenPrice: number;
  yieldRate: string;
  investedAt: string;
  status: 'active' | 'completed' | 'pending';
  totalReturn: number;
  monthlyReturn: number;
  propertyImage: string;
}

// Mock investment data
const mockInvestments: Investment[] = [
  {
    id: '1',
    propertyId: '1',
    propertyName: 'Lagos Marina Luxury Apartments',
    propertyType: 'residential',
    propertyLocation: 'Victoria Island, Lagos',
    propertyCountry: 'Nigeria',
    amount: 5000,
    tokens: 50,
    tokenPrice: 100,
    yieldRate: '12% APY',
    investedAt: '2024-01-15',
    status: 'active',
    totalReturn: 600,
    monthlyReturn: 50,
    propertyImage: '/images/lagos-marina.jpg'
  },
  {
    id: '2',
    propertyId: '2',
    propertyName: 'Nairobi Tech Hub Office Complex',
    propertyType: 'commercial',
    propertyLocation: 'Westlands, Nairobi',
    propertyCountry: 'Kenya',
    amount: 3000,
    tokens: 60,
    tokenPrice: 50,
    yieldRate: '10% APY',
    investedAt: '2024-02-01',
    status: 'active',
    totalReturn: 300,
    monthlyReturn: 25,
    propertyImage: '/images/nairobi-tech-hub.jpg'
  }
];

export default function PortfolioPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [investments, setInvestments] = useState<Investment[]>(mockInvestments);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth');
        return;
      }
      setUser(session.user);
      setLoading(false);
    };

    getUser();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalReturn = investments.reduce((sum, inv) => sum + inv.totalReturn, 0);
  const monthlyReturn = investments.reduce((sum, inv) => sum + inv.monthlyReturn, 0);
  const totalValue = totalInvested + totalReturn;
  const roi = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

  const getPropertyTypeIcon = (type: string) => {
    switch (type) {
      case 'residential':
        return '🏠';
      case 'commercial':
        return '🏢';
      case 'agricultural':
        return '🌾';
      case 'mixed-use':
        return '🏗️';
      case 'land':
        return '🌍';
      default:
        return '🏠';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'completed':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

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
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-white mb-4">My Investment Portfolio</h1>
              <p className="text-gray-400 text-lg">
                Track your investments, returns, and portfolio performance
              </p>
            </div>

            {/* Portfolio Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Total Invested</span>
                  <span className="text-2xl">💰</span>
                </div>
                <div className="text-2xl font-bold text-white">{formatCurrency(totalInvested)}</div>
                <div className="text-gray-400 text-sm mt-1">{investments.length} investments</div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Total Value</span>
                  <span className="text-2xl">📈</span>
                </div>
                <div className="text-2xl font-bold text-white">{formatCurrency(totalValue)}</div>
                <div className="text-emerald-400 text-sm mt-1">+{formatCurrency(totalReturn)} returns</div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Monthly Return</span>
                  <span className="text-2xl">📊</span>
                </div>
                <div className="text-2xl font-bold text-emerald-400">{formatCurrency(monthlyReturn)}</div>
                <div className="text-gray-400 text-sm mt-1">Passive income</div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">ROI</span>
                  <span className="text-2xl">🎯</span>
                </div>
                <div className="text-2xl font-bold text-emerald-400">{roi.toFixed(1)}%</div>
                <div className="text-gray-400 text-sm mt-1">Total return</div>
              </div>
            </div>

            {/* Investments List */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">My Investments</h2>
                <MagneticEffect>
                  <Link href="/properties" className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 hover-lift">
                    Browse More Properties
                  </Link>
                </MagneticEffect>
              </div>

              {investments.length > 0 ? (
                <div className="space-y-4">
                  {investments.map((investment) => (
                    <div key={investment.id} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl flex items-center justify-center">
                            <span className="text-2xl">{getPropertyTypeIcon(investment.propertyType)}</span>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white mb-1">{investment.propertyName}</h3>
                            <p className="text-gray-400 text-sm flex items-center">
                              <span className="mr-2">📍</span>
                              {investment.propertyLocation}
                            </p>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${getStatusColor(investment.status)}`}>
                                {investment.status}
                              </span>
                              <span className="text-gray-400 text-sm">
                                {getCountryFlag(investment.propertyCountry)} {investment.propertyCountry}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-lg font-semibold text-white mb-1">
                            {formatCurrency(investment.amount)}
                          </div>
                          <div className="text-emerald-400 text-sm mb-2">
                            {investment.tokens} tokens @ {formatCurrency(investment.tokenPrice)}
                          </div>
                          <div className="text-gray-400 text-sm">
                            {investment.yieldRate} • +{formatCurrency(investment.totalReturn)} returns
                          </div>
                        </div>
                      </div>

                      {/* Investment Details */}
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-400">Invested</span>
                            <div className="text-white font-medium">{formatCurrency(investment.amount)}</div>
                          </div>
                          <div>
                            <span className="text-gray-400">Current Value</span>
                            <div className="text-white font-medium">{formatCurrency(investment.amount + investment.totalReturn)}</div>
                          </div>
                          <div>
                            <span className="text-gray-400">Monthly Return</span>
                            <div className="text-emerald-400 font-medium">{formatCurrency(investment.monthlyReturn)}</div>
                          </div>
                          <div>
                            <span className="text-gray-400">Total Return</span>
                            <div className="text-emerald-400 font-medium">+{formatCurrency(investment.totalReturn)}</div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                        <div className="text-gray-400 text-sm">
                          Invested on {new Date(investment.investedAt).toLocaleDateString()}
                        </div>
                        <div className="flex space-x-2">
                          <MagneticEffect>
                            <Link href={`/properties/${investment.propertyId}`}>
                              <button className="text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors">
                                View Property
                              </button>
                            </Link>
                          </MagneticEffect>
                          <MagneticEffect>
                            <button className="text-gray-400 hover:text-white text-sm font-medium transition-colors">
                              View Details
                            </button>
                          </MagneticEffect>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">💼</div>
                  <h3 className="text-xl font-semibold text-white mb-2">No Investments Yet</h3>
                  <p className="text-gray-400 mb-6">
                    Start building your portfolio by investing in African real estate opportunities.
                  </p>
                  <MagneticEffect>
                    <Link href="/properties" className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 hover-lift">
                      Browse Properties
                    </Link>
                  </MagneticEffect>
                </div>
              )}
            </div>

            {/* Performance Chart Placeholder */}
            <div className="mt-8 bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Portfolio Performance</h3>
              <div className="h-64 bg-white/5 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-2">📊</div>
                  <p className="text-gray-400">Performance charts coming soon</p>
                </div>
              </div>
            </div>
          </ScrollAnimations>
        </div>
      </div>
    </div>
  );
} 