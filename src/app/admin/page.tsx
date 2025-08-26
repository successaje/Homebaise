'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MagneticEffect from '@/components/MagneticEffect';
import ScrollAnimations from '@/components/ScrollAnimations';
import { formatNumber, formatCurrency, getPropertyTypeLabel, getCountryFlag } from '@/lib/utils';
import { properties } from '@/data/mockProperties';

interface AdminStats {
  totalUsers: number;
  totalProperties: number;
  totalInvestments: number;
  totalValue: number;
  activeInvestments: number;
  pendingKYC: number;
  monthlyRevenue: number;
  platformROI: number;
}

interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  kyc_status: string;
  created_at: string;
  last_login: string;
  total_invested: number;
  investment_count: number;
}

interface AdminInvestment {
  id: string;
  userId: string;
  userEmail: string;
  propertyId: string;
  propertyName: string;
  amount: number;
  status: string;
  createdAt: string;
}

// Mock admin data
const mockAdminStats: AdminStats = {
  totalUsers: 1247,
  totalProperties: 5,
  totalInvestments: 892,
  totalValue: 12500000,
  activeInvestments: 856,
  pendingKYC: 23,
  monthlyRevenue: 125000,
  platformROI: 12.5
};

const mockAdminUsers: AdminUser[] = [
  {
    id: '1',
    email: 'john@example.com',
    full_name: 'John Doe',
    kyc_status: 'verified',
    created_at: '2024-01-15',
    last_login: '2024-03-15',
    total_invested: 15000,
    investment_count: 3
  },
  {
    id: '2',
    email: 'jane@example.com',
    full_name: 'Jane Smith',
    kyc_status: 'pending',
    created_at: '2024-02-01',
    last_login: '2024-03-14',
    total_invested: 8000,
    investment_count: 2
  }
];

const mockAdminInvestments: AdminInvestment[] = [
  {
    id: '1',
    userId: '1',
    userEmail: 'john@example.com',
    propertyId: '1',
    propertyName: 'Lagos Marina Luxury Apartments',
    amount: 5000,
    status: 'active',
    createdAt: '2024-01-15'
  },
  {
    id: '2',
    userId: '2',
    userEmail: 'jane@example.com',
    propertyId: '2',
    propertyName: 'Nairobi Tech Hub Office Complex',
    amount: 3000,
    status: 'active',
    createdAt: '2024-02-01'
  }
];

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'properties' | 'investments' | 'kyc'>('overview');
  const [stats, setStats] = useState<AdminStats>(mockAdminStats);
  const [users, setUsers] = useState<AdminUser[]>(mockAdminUsers);
  const [investments, setInvestments] = useState<AdminInvestment[]>(mockAdminInvestments);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth');
        return;
      }
      
      // In a real app, check if user has admin role
      // For now, we'll allow any authenticated user to access admin
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
      case 'active':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'rejected':
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
              <span className="text-xl font-bold text-white">Homebaise Admin</span>
            </Link>
            <div className="flex items-center space-x-4">
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
              <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
              <p className="text-gray-400">
                Manage properties, users, investments, and platform analytics
              </p>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-white/5 border border-white/10 rounded-xl p-1 mb-8">
              {[
                { id: 'overview', label: 'Overview', icon: '📊' },
                { id: 'users', label: 'Users', icon: '👥' },
                { id: 'properties', label: 'Properties', icon: '🏠' },
                { id: 'investments', label: 'Investments', icon: '💰' },
                { id: 'kyc', label: 'KYC', icon: '✅' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-emerald-500 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400 text-sm">Total Users</span>
                      <span className="text-2xl">👥</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{stats.totalUsers.toLocaleString()}</div>
                    <div className="text-emerald-400 text-sm mt-1">+12% this month</div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400 text-sm">Total Properties</span>
                      <span className="text-2xl">🏠</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{stats.totalProperties}</div>
                    <div className="text-emerald-400 text-sm mt-1">All active</div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400 text-sm">Total Investments</span>
                      <span className="text-2xl">💰</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{stats.totalInvestments.toLocaleString()}</div>
                    <div className="text-emerald-400 text-sm mt-1">{formatCurrency(stats.totalValue)}</div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400 text-sm">Monthly Revenue</span>
                      <span className="text-2xl">📈</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{formatCurrency(stats.monthlyRevenue)}</div>
                    <div className="text-emerald-400 text-sm mt-1">{stats.platformROI}% ROI</div>
                  </div>
                </div>

                {/* Platform Analytics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Platform Performance</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Active Investments</span>
                        <span className="text-white font-semibold">{stats.activeInvestments}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Pending KYC</span>
                        <span className="text-yellow-400 font-semibold">{stats.pendingKYC}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Platform ROI</span>
                        <span className="text-emerald-400 font-semibold">{stats.platformROI}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                      <MagneticEffect>
                        <button className="w-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 py-2 px-4 rounded-lg hover:bg-emerald-500/20 transition-all">
                          Review Pending KYC
                        </button>
                      </MagneticEffect>
                      <MagneticEffect>
                        <button className="w-full bg-blue-500/10 border border-blue-500/20 text-blue-400 py-2 px-4 rounded-lg hover:bg-blue-500/20 transition-all">
                          Add New Property
                        </button>
                      </MagneticEffect>
                      <MagneticEffect>
                        <button className="w-full bg-purple-500/10 border border-purple-500/20 text-purple-400 py-2 px-4 rounded-lg hover:bg-purple-500/20 transition-all">
                          Generate Reports
                        </button>
                      </MagneticEffect>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">User Management</h3>
                  <MagneticEffect>
                    <button className="bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-all">
                      Export Users
                    </button>
                  </MagneticEffect>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 text-gray-400 font-medium">User</th>
                        <th className="text-left py-3 text-gray-400 font-medium">KYC Status</th>
                        <th className="text-left py-3 text-gray-400 font-medium">Total Invested</th>
                        <th className="text-left py-3 text-gray-400 font-medium">Investments</th>
                        <th className="text-left py-3 text-gray-400 font-medium">Last Login</th>
                        <th className="text-left py-3 text-gray-400 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b border-white/5">
                          <td className="py-3">
                            <div>
                              <div className="text-white font-medium">{user.full_name}</div>
                              <div className="text-gray-400 text-sm">{user.email}</div>
                            </div>
                          </td>
                          <td className="py-3">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${getStatusColor(user.kyc_status)}`}>
                              {user.kyc_status}
                            </span>
                          </td>
                          <td className="py-3 text-white">{formatCurrency(user.total_invested)}</td>
                          <td className="py-3 text-white">{user.investment_count}</td>
                          <td className="py-3 text-gray-400">{new Date(user.last_login).toLocaleDateString()}</td>
                          <td className="py-3">
                            <div className="flex space-x-2">
                              <button className="text-emerald-400 hover:text-emerald-300 text-sm">View</button>
                              <button className="text-blue-400 hover:text-blue-300 text-sm">Edit</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Properties Tab */}
            {activeTab === 'properties' && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">Property Management</h3>
                  <MagneticEffect>
                    <button className="bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-all">
                      Add Property
                    </button>
                  </MagneticEffect>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {properties.map((property) => (
                    <div key={property.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-white font-semibold">{property.name}</h4>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${getStatusColor(property.status)}`}>
                          {property.status}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Value</span>
                          <span className="text-white">{formatNumber(property.totalValueUSD)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Funded</span>
                          <span className="text-white">{property.fundedPercent}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Yield</span>
                          <span className="text-emerald-400">{property.yieldRate}</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex space-x-2">
                        <button className="text-emerald-400 hover:text-emerald-300 text-sm">Edit</button>
                        <button className="text-blue-400 hover:text-blue-300 text-sm">View</button>
                        <button className="text-red-400 hover:text-red-300 text-sm">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Investments Tab */}
            {activeTab === 'investments' && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">Investment Management</h3>
                  <MagneticEffect>
                    <button className="bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-all">
                      Export Data
                    </button>
                  </MagneticEffect>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 text-gray-400 font-medium">User</th>
                        <th className="text-left py-3 text-gray-400 font-medium">Property</th>
                        <th className="text-left py-3 text-gray-400 font-medium">Amount</th>
                        <th className="text-left py-3 text-gray-400 font-medium">Status</th>
                        <th className="text-left py-3 text-gray-400 font-medium">Date</th>
                        <th className="text-left py-3 text-gray-400 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {investments.map((investment) => (
                        <tr key={investment.id} className="border-b border-white/5">
                          <td className="py-3">
                            <div className="text-white">{investment.userEmail}</div>
                          </td>
                          <td className="py-3">
                            <div className="text-white">{investment.propertyName}</div>
                          </td>
                          <td className="py-3 text-white">{formatCurrency(investment.amount)}</td>
                          <td className="py-3">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${getStatusColor(investment.status)}`}>
                              {investment.status}
                            </span>
                          </td>
                          <td className="py-3 text-gray-400">{new Date(investment.createdAt).toLocaleDateString()}</td>
                          <td className="py-3">
                            <div className="flex space-x-2">
                              <button className="text-emerald-400 hover:text-emerald-300 text-sm">View</button>
                              <button className="text-blue-400 hover:text-blue-300 text-sm">Edit</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* KYC Tab */}
            {activeTab === 'kyc' && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">KYC Verification</h3>
                  <div className="text-gray-400">
                    {stats.pendingKYC} pending verifications
                  </div>
                </div>
                
                <div className="space-y-4">
                  {users.filter(u => u.kyc_status === 'pending').map((user) => (
                    <div key={user.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white font-medium">{user.full_name}</div>
                          <div className="text-gray-400 text-sm">{user.email}</div>
                          <div className="text-gray-400 text-sm">Submitted: {new Date(user.created_at).toLocaleDateString()}</div>
                        </div>
                        <div className="flex space-x-2">
                          <MagneticEffect>
                            <button className="bg-emerald-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-emerald-600 transition-all">
                              Approve
                            </button>
                          </MagneticEffect>
                          <MagneticEffect>
                            <button className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600 transition-all">
                              Reject
                            </button>
                          </MagneticEffect>
                          <MagneticEffect>
                            <button className="border border-white/20 text-white px-3 py-1 rounded-lg text-sm hover:bg-white/10 transition-all">
                              View
                            </button>
                          </MagneticEffect>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {users.filter(u => u.kyc_status === 'pending').length === 0 && (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">✅</div>
                      <h3 className="text-white font-semibold mb-2">No Pending KYC</h3>
                      <p className="text-gray-400">All KYC verifications are up to date!</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </ScrollAnimations>
        </div>
      </div>
    </div>
  );
} 