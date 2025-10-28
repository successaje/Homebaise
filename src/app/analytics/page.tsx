'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MagneticEffect from '@/components/MagneticEffect';
import ScrollAnimations from '@/components/ScrollAnimations';
import { formatNumber, formatCurrency, getPropertyTypeLabel, getCountryFlag } from '@/lib/utils';

interface AnalyticsData {
  totalInvested: number;
  totalValue: number;
  totalReturn: number;
  monthlyReturn: number;
  roi: number;
  investmentCount: number;
  averageInvestment: number;
  bestPerformingProperty: {
    name: string;
    return: number;
    roi: number;
  };
  portfolioGrowth: {
    month: string;
    value: number;
    return: number;
  }[];
  propertyTypeDistribution: {
    type: string;
    amount: number;
    percentage: number;
  }[];
  countryDistribution: {
    country: string;
    amount: number;
    percentage: number;
  }[];
  monthlyReturns: {
    month: string;
    return: number;
  }[];
}

// Mock analytics data
const mockAnalytics: AnalyticsData = {
  totalInvested: 8000,
  totalValue: 8900,
  totalReturn: 900,
  monthlyReturn: 75,
  roi: 11.3,
  investmentCount: 2,
  averageInvestment: 4000,
  bestPerformingProperty: {
    name: 'Lagos Marina Luxury Apartments',
    return: 600,
    roi: 12.0
  },
  portfolioGrowth: [
    { month: 'Jan', value: 5000, return: 0 },
    { month: 'Feb', value: 8000, return: 300 },
    { month: 'Mar', value: 8900, return: 900 }
  ],
  propertyTypeDistribution: [
    { type: 'Residential', amount: 5000, percentage: 62.5 },
    { type: 'Commercial', amount: 3000, percentage: 37.5 }
  ],
  countryDistribution: [
    { country: 'Nigeria', amount: 5000, percentage: 62.5 },
    { country: 'Kenya', amount: 3000, percentage: 37.5 }
  ],
  monthlyReturns: [
    { month: 'Jan', return: 0 },
    { month: 'Feb', return: 50 },
    { month: 'Mar', return: 75 }
  ]
};

export default function AnalyticsPage() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData>(mockAnalytics);
  const [timeRange, setTimeRange] = useState<'1M' | '3M' | '6M' | '1Y' | 'ALL'>('ALL');
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

  const getGrowthColor = (value: number) => {
    if (value > 0) return 'text-emerald-400';
    if (value < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const getGrowthIcon = (value: number) => {
    if (value > 0) return '↗️';
    if (value < 0) return '↘️';
    return '→';
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
              <Link href="/portfolio" className="text-gray-300 hover:text-white">Portfolio</Link>
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
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Investment Analytics</h1>
                <p className="text-gray-400">
                  Track your portfolio performance and investment insights
                </p>
              </div>
              
              {/* Time Range Selector */}
              <div className="flex items-center space-x-2 bg-white/5 border border-white/10 rounded-xl p-1">
                {(['1M', '3M', '6M', '1Y', 'ALL'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                      timeRange === range
                        ? 'bg-emerald-500 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Total Invested</span>
                  <span className="text-2xl">💰</span>
                </div>
                <div className="text-2xl font-bold text-white">{formatCurrency(analytics.totalInvested)}</div>
                <div className="text-gray-400 text-sm mt-1">{analytics.investmentCount} investments</div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Portfolio Value</span>
                  <span className="text-2xl">📈</span>
                </div>
                <div className="text-2xl font-bold text-white">{formatCurrency(analytics.totalValue)}</div>
                <div className="text-emerald-400 text-sm mt-1">+{formatCurrency(analytics.totalReturn)} returns</div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Total ROI</span>
                  <span className="text-2xl">🎯</span>
                </div>
                <div className="text-2xl font-bold text-emerald-400">{analytics.roi.toFixed(1)}%</div>
                <div className="text-gray-400 text-sm mt-1">+{formatCurrency(analytics.totalReturn)}</div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Monthly Return</span>
                  <span className="text-2xl">📊</span>
                </div>
                <div className="text-2xl font-bold text-emerald-400">{formatCurrency(analytics.monthlyReturn)}</div>
                <div className="text-gray-400 text-sm mt-1">Passive income</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Portfolio Growth Chart */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">Portfolio Growth</h3>
                <div className="space-y-4">
                  {analytics.portfolioGrowth.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-gray-400">{item.month}</span>
                      <div className="flex items-center space-x-4">
                        <span className="text-white font-medium">{formatCurrency(item.value)}</span>
                        <span className={`text-sm ${getGrowthColor(item.return)}`}>
                          {getGrowthIcon(item.return)} {formatCurrency(item.return)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Best Performing Property */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">Best Performing Property</h3>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                  <h4 className="text-lg font-semibold text-white mb-2">
                    {analytics.bestPerformingProperty.name}
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-400 text-sm">Total Return</span>
                      <div className="text-emerald-400 font-semibold">
                        {formatCurrency(analytics.bestPerformingProperty.return)}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">ROI</span>
                      <div className="text-emerald-400 font-semibold">
                        {analytics.bestPerformingProperty.roi.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Property Type Distribution */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">Property Type Distribution</h3>
                <div className="space-y-4">
                  {analytics.propertyTypeDistribution.map((item, index) => (
                    <div key={index}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white">{item.type}</span>
                        <span className="text-gray-400">{item.percentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                      <div className="text-gray-400 text-sm mt-1">{formatCurrency(item.amount)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Country Distribution */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">Geographic Distribution</h3>
                <div className="space-y-4">
                  {analytics.countryDistribution.map((item, index) => (
                    <div key={index}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white flex items-center">
                          {getCountryFlag(item.country)} {item.country}
                        </span>
                        <span className="text-gray-400">{item.percentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                      <div className="text-gray-400 text-sm mt-1">{formatCurrency(item.amount)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Monthly Returns Chart */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
              <h3 className="text-xl font-bold text-white mb-4">Monthly Returns Trend</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {analytics.monthlyReturns.map((item, index) => (
                  <div key={index} className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="text-gray-400 text-sm mb-1">{item.month}</div>
                    <div className="text-2xl font-bold text-emerald-400">{formatCurrency(item.return)}</div>
                    <div className="text-gray-400 text-sm">Monthly return</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Insights */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Investment Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                  <div className="text-emerald-400 text-2xl mb-2">📈</div>
                  <h4 className="text-white font-semibold mb-2">Strong Performance</h4>
                  <p className="text-gray-300 text-sm">
                    Your portfolio is outperforming the market average with an 11.3% ROI.
                  </p>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                  <div className="text-blue-400 text-2xl mb-2">🌍</div>
                  <h4 className="text-white font-semibold mb-2">Geographic Diversity</h4>
                  <p className="text-gray-300 text-sm">
                    Your investments are spread across 2 countries, providing good diversification.
                  </p>
                </div>

                <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                  <div className="text-purple-400 text-2xl mb-2">💰</div>
                  <h4 className="text-white font-semibold mb-2">Passive Income</h4>
                  <p className="text-gray-300 text-sm">
                    Generating ${analytics.monthlyReturn} monthly in passive income.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <MagneticEffect>
                <Link href="/portfolio" className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 hover-lift">
                  View Portfolio
                </Link>
              </MagneticEffect>
              
              <MagneticEffect>
                <Link href="/properties" className="border border-white/20 bg-white/5 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/10 transition-all duration-300 hover-lift">
                  Browse Properties
                </Link>
              </MagneticEffect>
            </div>
          </ScrollAnimations>
        </div>
      </div>
    </div>
  );
} 