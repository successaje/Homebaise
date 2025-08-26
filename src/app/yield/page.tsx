'use client';

import { useState } from 'react';
import Link from 'next/link';
import MagneticEffect from '@/components/MagneticEffect';
import ScrollAnimations from '@/components/ScrollAnimations';
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils';

interface YieldEarning {
  id: string;
  propertyId: string;
  propertyName: string;
  propertyType: string;
  location: string;
  tokensOwned: number;
  tokenValue: number;
  monthlyRentalIncome: number;
  monthlyYield: number;
  yieldRate: string;
  totalEarned: number;
  lastDistribution: string;
  nextDistribution: string;
  distributionHistory: {
    date: string;
    amount: number;
    type: 'rental' | 'yield' | 'bonus';
    status: 'pending' | 'paid' | 'failed';
  }[];
}

interface IncomeSummary {
  totalMonthlyIncome: number;
  totalYearlyIncome: number;
  averageYieldRate: string;
  totalProperties: number;
  totalTokens: number;
  totalValue: number;
  monthlyGrowth: number;
  yearlyGrowth: number;
}

// Mock yield earnings
const yieldEarnings: YieldEarning[] = [
  {
    id: '1',
    propertyId: 'prop-1',
    propertyName: 'Lagos Luxury Apartments',
    propertyType: 'Residential',
    location: 'Lagos, Nigeria',
    tokensOwned: 500,
    tokenValue: 26250,
    monthlyRentalIncome: 3150,
    monthlyYield: 262.5,
    yieldRate: '12% APY',
    totalEarned: 15750,
    lastDistribution: '2024-01-15',
    nextDistribution: '2024-02-15',
    distributionHistory: [
      {
        date: '2024-01-15',
        amount: 3150,
        type: 'rental',
        status: 'paid'
      },
      {
        date: '2024-01-15',
        amount: 262.5,
        type: 'yield',
        status: 'paid'
      },
      {
        date: '2023-12-15',
        amount: 3150,
        type: 'rental',
        status: 'paid'
      },
      {
        date: '2023-12-15',
        amount: 262.5,
        type: 'yield',
        status: 'paid'
      }
    ]
  },
  {
    id: '2',
    propertyId: 'prop-2',
    propertyName: 'Nairobi Office Complex',
    propertyType: 'Commercial',
    location: 'Nairobi, Kenya',
    tokensOwned: 300,
    tokenValue: 21375,
    monthlyRentalIncome: 4275,
    monthlyYield: 267.19,
    yieldRate: '15% APY',
    totalEarned: 27225,
    lastDistribution: '2024-01-15',
    nextDistribution: '2024-02-15',
    distributionHistory: [
      {
        date: '2024-01-15',
        amount: 4275,
        type: 'rental',
        status: 'paid'
      },
      {
        date: '2024-01-15',
        amount: 267.19,
        type: 'yield',
        status: 'paid'
      },
      {
        date: '2023-12-15',
        amount: 4275,
        type: 'rental',
        status: 'paid'
      },
      {
        date: '2023-12-15',
        amount: 267.19,
        type: 'yield',
        status: 'paid'
      }
    ]
  },
  {
    id: '3',
    propertyId: 'prop-3',
    propertyName: 'Accra Shopping Mall',
    propertyType: 'Retail',
    location: 'Accra, Ghana',
    tokensOwned: 400,
    tokenValue: 25200,
    monthlyRentalIncome: 5040,
    monthlyYield: 378,
    yieldRate: '18% APY',
    totalEarned: 32490,
    lastDistribution: '2024-01-15',
    nextDistribution: '2024-02-15',
    distributionHistory: [
      {
        date: '2024-01-15',
        amount: 5040,
        type: 'rental',
        status: 'paid'
      },
      {
        date: '2024-01-15',
        amount: 378,
        type: 'yield',
        status: 'paid'
      },
      {
        date: '2023-12-15',
        amount: 5040,
        type: 'rental',
        status: 'paid'
      },
      {
        date: '2023-12-15',
        amount: 378,
        type: 'yield',
        status: 'paid'
      }
    ]
  },
  {
    id: '4',
    propertyId: 'prop-4',
    propertyName: 'Kampala Industrial Park',
    propertyType: 'Industrial',
    location: 'Kampala, Uganda',
    tokensOwned: 600,
    tokenValue: 22800,
    monthlyRentalIncome: 3420,
    monthlyYield: 266,
    yieldRate: '14% APY',
    totalEarned: 22110,
    lastDistribution: '2024-01-15',
    nextDistribution: '2024-02-15',
    distributionHistory: [
      {
        date: '2024-01-15',
        amount: 3420,
        type: 'rental',
        status: 'paid'
      },
      {
        date: '2024-01-15',
        amount: 266,
        type: 'yield',
        status: 'paid'
      },
      {
        date: '2023-12-15',
        amount: 3420,
        type: 'rental',
        status: 'paid'
      },
      {
        date: '2023-12-15',
        amount: 266,
        type: 'yield',
        status: 'paid'
      }
    ]
  },
  {
    id: '5',
    propertyId: 'prop-5',
    propertyName: 'Dar es Salaam Hotel',
    propertyType: 'Hospitality',
    location: 'Dar es Salaam, Tanzania',
    tokensOwned: 250,
    tokenValue: 21000,
    monthlyRentalIncome: 4200,
    monthlyYield: 350,
    yieldRate: '20% APY',
    totalEarned: 27300,
    lastDistribution: '2024-01-15',
    nextDistribution: '2024-02-15',
    distributionHistory: [
      {
        date: '2024-01-15',
        amount: 4200,
        type: 'rental',
        status: 'paid'
      },
      {
        date: '2024-01-15',
        amount: 350,
        type: 'yield',
        status: 'paid'
      },
      {
        date: '2023-12-15',
        amount: 4200,
        type: 'rental',
        status: 'paid'
      },
      {
        date: '2023-12-15',
        amount: 350,
        type: 'yield',
        status: 'paid'
      }
    ]
  }
];

// Calculate income summary
const incomeSummary: IncomeSummary = {
  totalMonthlyIncome: yieldEarnings.reduce((sum, earning) => sum + earning.monthlyRentalIncome + earning.monthlyYield, 0),
  totalYearlyIncome: yieldEarnings.reduce((sum, earning) => sum + earning.monthlyRentalIncome + earning.monthlyYield, 0) * 12,
  averageYieldRate: '15.8%',
  totalProperties: yieldEarnings.length,
  totalTokens: yieldEarnings.reduce((sum, earning) => sum + earning.tokensOwned, 0),
  totalValue: yieldEarnings.reduce((sum, earning) => sum + earning.tokenValue, 0),
  monthlyGrowth: 8.5,
  yearlyGrowth: 22.3
};

export default function YieldPage() {
  const [selectedPropertyType, setSelectedPropertyType] = useState<string>('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('monthly');
  const [showDistributionHistory, setShowDistributionHistory] = useState<string | null>(null);

  const propertyTypes = ['all', 'Residential', 'Commercial', 'Retail', 'Industrial', 'Hospitality'];
  const timeframes = ['monthly', 'quarterly', 'yearly'];

  const filteredEarnings = yieldEarnings.filter(earning => {
    return selectedPropertyType === 'all' || earning.propertyType === selectedPropertyType;
  });

  const getDistributionTypeColor = (type: string) => {
    switch (type) {
      case 'rental':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'yield':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'bonus':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'failed':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
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
              <Link href="/agriculture" className="text-gray-300 hover:text-white">Agriculture</Link>
              <Link href="/community" className="text-gray-300 hover:text-white">Community</Link>
              <Link href="/market" className="text-gray-300 hover:text-white">Market</Link>
              <Link href="/portfolio" className="text-gray-300 hover:text-white">Portfolio</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollAnimations animationType="fade-in-up">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-white mb-4">Yield & Rental Income</h1>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Track your passive income from rental yields and property appreciation
              </p>
            </div>

            {/* Income Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <div className="text-2xl mb-2">💰</div>
                <div className="text-2xl font-bold text-white">{formatCurrency(incomeSummary.totalMonthlyIncome)}</div>
                <div className="text-gray-400 text-sm">Monthly Income</div>
                <div className="text-emerald-400 text-sm">+{incomeSummary.monthlyGrowth}%</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <div className="text-2xl mb-2">📈</div>
                <div className="text-2xl font-bold text-white">{formatCurrency(incomeSummary.totalYearlyIncome)}</div>
                <div className="text-gray-400 text-sm">Yearly Income</div>
                <div className="text-emerald-400 text-sm">+{incomeSummary.yearlyGrowth}%</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <div className="text-2xl mb-2">🎯</div>
                <div className="text-2xl font-bold text-emerald-400">{incomeSummary.averageYieldRate}</div>
                <div className="text-gray-400 text-sm">Average Yield</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <div className="text-2xl mb-2">🏢</div>
                <div className="text-2xl font-bold text-white">{incomeSummary.totalProperties}</div>
                <div className="text-gray-400 text-sm">Properties</div>
                <div className="text-white text-sm">{incomeSummary.totalTokens.toLocaleString()} tokens</div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
              <div className="flex flex-col md:flex-row gap-4">
                <select
                  value={selectedPropertyType}
                  onChange={(e) => setSelectedPropertyType(e.target.value)}
                  className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {propertyTypes.map((type) => (
                    <option key={type} value={type}>
                      {type === 'all' ? 'All Property Types' : type}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedTimeframe}
                  onChange={(e) => setSelectedTimeframe(e.target.value)}
                  className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {timeframes.map((timeframe) => (
                    <option key={timeframe} value={timeframe}>
                      {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
                    </option>
                  ))}
                </select>

                <MagneticEffect>
                  <button className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 hover-lift">
                    Withdraw Earnings
                  </button>
                </MagneticEffect>
              </div>
            </div>

            {/* Yield Earnings */}
            <div className="space-y-6">
              {filteredEarnings.map((earning) => (
                <MagneticEffect key={earning.id}>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 hover-lift">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                      {/* Property Info */}
                      <div className="lg:col-span-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl flex items-center justify-center">
                            <span className="text-lg">🏢</span>
                          </div>
                          <div>
                            <h3 className="text-white font-semibold">{earning.propertyName}</h3>
                            <p className="text-gray-400 text-sm">{earning.location}</p>
                            <span className="text-xs bg-white/10 px-2 py-1 rounded-full text-gray-300">
                              {earning.propertyType}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Tokens & Value */}
                      <div className="lg:col-span-2">
                        <div className="text-center">
                          <div className="text-white font-semibold">{earning.tokensOwned.toLocaleString()}</div>
                          <div className="text-gray-400 text-xs">Tokens Owned</div>
                          <div className="text-white text-xs">{formatCurrency(earning.tokenValue)}</div>
                        </div>
                      </div>

                      {/* Monthly Income */}
                      <div className="lg:col-span-2">
                        <div className="text-center">
                          <div className="text-emerald-400 font-semibold">{formatCurrency(earning.monthlyRentalIncome)}</div>
                          <div className="text-gray-400 text-xs">Rental Income</div>
                          <div className="text-emerald-400 text-xs">{formatCurrency(earning.monthlyYield)}</div>
                        </div>
                      </div>

                      {/* Yield Rate */}
                      <div className="lg:col-span-2">
                        <div className="text-center">
                          <div className="text-emerald-400 font-semibold">{earning.yieldRate}</div>
                          <div className="text-gray-400 text-xs">Yield Rate</div>
                          <div className="text-white text-xs">{formatCurrency(earning.totalEarned)}</div>
                        </div>
                      </div>

                      {/* Next Distribution */}
                      <div className="lg:col-span-2">
                        <div className="text-center">
                          <div className="text-white font-semibold">{formatDate(earning.nextDistribution)}</div>
                          <div className="text-gray-400 text-xs">Next Distribution</div>
                          <div className="text-emerald-400 text-xs">{formatCurrency(earning.monthlyRentalIncome + earning.monthlyYield)}</div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="lg:col-span-1">
                        <div className="flex flex-col space-y-2">
                          <button
                            onClick={() => setShowDistributionHistory(showDistributionHistory === earning.id ? null : earning.id)}
                            className="text-emerald-400 text-sm hover:text-emerald-300 transition-colors"
                          >
                            {showDistributionHistory === earning.id ? 'Hide History' : 'View History'}
                          </button>
                          <button className="text-gray-400 text-sm hover:text-white transition-colors">
                            Details
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Distribution History */}
                    {showDistributionHistory === earning.id && (
                      <div className="mt-6 pt-6 border-t border-white/10">
                        <h4 className="text-white font-semibold mb-4">Distribution History</h4>
                        <div className="space-y-3">
                          {earning.distributionHistory.map((distribution, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full flex items-center justify-center">
                                  <span className="text-xs">💰</span>
                                </div>
                                <div>
                                  <div className="text-white text-sm font-medium">{formatDate(distribution.date)}</div>
                                  <div className="text-gray-400 text-xs">{distribution.type.charAt(0).toUpperCase() + distribution.type.slice(1)}</div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-3">
                                <div className="text-right">
                                  <div className="text-white font-semibold">{formatCurrency(distribution.amount)}</div>
                                </div>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${getStatusColor(distribution.status)}`}>
                                  {distribution.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </MagneticEffect>
              ))}
            </div>

            {filteredEarnings.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">💰</div>
                <h3 className="text-xl font-semibold text-white mb-2">No yield earnings found</h3>
                <p className="text-gray-400">
                  Start investing in properties to earn rental income and yields
                </p>
              </div>
            )}

            {/* Income Features */}
            <div className="mt-16 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">Income Features</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl mb-3">📅</div>
                  <h3 className="text-white font-semibold mb-2">Regular Distributions</h3>
                  <p className="text-gray-400 text-sm">Receive rental income and yields on a monthly basis</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-3">📊</div>
                  <h3 className="text-white font-semibold mb-2">Transparent Tracking</h3>
                  <p className="text-gray-400 text-sm">Monitor all your earnings with detailed transaction history</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-3">💳</div>
                  <h3 className="text-white font-semibold mb-2">Easy Withdrawals</h3>
                  <p className="text-gray-400 text-sm">Withdraw your earnings to your preferred payment method</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-3">📈</div>
                  <h3 className="text-white font-semibold mb-2">Growth Potential</h3>
                  <p className="text-gray-400 text-sm">Earnings grow as property values and rental rates increase</p>
                </div>
              </div>
            </div>
          </ScrollAnimations>
        </div>
      </div>
    </div>
  );
} 