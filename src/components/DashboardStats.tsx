'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatNumber } from '@/lib/utils';
import MagneticEffect from './MagneticEffect';
import ScrollAnimations from './ScrollAnimations';

interface DashboardStatsProps {
  userId: string;
  className?: string;
}

interface UserStats {
  totalInvestments: number;
  totalInvested: number;
  totalProperties: number;
  totalTokens: number;
  averageInvestment: number;
  recentActivity: number;
  hcsVerifiedTransactions: number;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ userId, className = '' }) => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!userId) return;

      setLoading(true);
      setError(null);

      try {
        // Fetch user's investments
        const { data: investments, error: investmentsError } = await supabase
          .from('investments')
          .select('amount, tokens_purchased, status, created_at')
          .eq('investor_id', userId);

        if (investmentsError) {
          throw investmentsError;
        }

        // Fetch user's properties
        const { data: properties, error: propertiesError } = await supabase
          .from('properties')
          .select('id, total_value, created_at')
          .eq('listed_by', userId);

        if (propertiesError) {
          throw propertiesError;
        }

        // Fetch HCS events for this user
        const { data: hcsEvents, error: hcsError } = await supabase
          .from('property_events')
          .select('id, event_type, created_at')
          .order('created_at', { ascending: false })
          .limit(100);

        if (hcsError) {
          console.warn('Could not fetch HCS events:', hcsError);
        }

        // Calculate stats
        const completedInvestments = investments?.filter(inv => inv.status === 'completed') || [];
        const totalInvested = completedInvestments.reduce((sum, inv) => sum + (inv.amount || 0), 0);
        const totalTokens = completedInvestments.reduce((sum, inv) => sum + (inv.tokens_purchased || 0), 0);
        const averageInvestment = completedInvestments.length > 0 ? totalInvested / completedInvestments.length : 0;
        
        // Count recent activity (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentActivity = completedInvestments.filter(inv => 
          new Date(inv.created_at) > thirtyDaysAgo
        ).length;

        // Count HCS verified transactions
        const hcsVerifiedTransactions = hcsEvents?.length || 0;

        setStats({
          totalInvestments: completedInvestments.length,
          totalInvested,
          totalProperties: properties?.length || 0,
          totalTokens,
          averageInvestment,
          recentActivity,
          hcsVerifiedTransactions
        });
      } catch (err: any) {
        console.error('Error fetching dashboard stats:', err);
        setError(err.message || 'Failed to fetch stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId]);

  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10 animate-pulse">
            <div className="h-4 bg-gray-500/20 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-500/20 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-500/20 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className={`bg-red-500/10 border border-red-500/20 rounded-xl p-6 ${className}`}>
        <div className="text-center">
          <div className="text-red-400 text-2xl mb-2">⚠️</div>
          <p className="text-red-400">Failed to load statistics</p>
          <p className="text-red-300 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Investments',
      value: stats.totalInvestments,
      subtitle: `${formatCurrency(stats.totalInvested)} invested`,
      icon: '💰',
      color: 'emerald',
      link: '/portfolio'
    },
    {
      title: 'Properties Owned',
      value: stats.totalProperties,
      subtitle: `${stats.totalTokens.toLocaleString()} tokens`,
      icon: '🏠',
      color: 'blue',
      link: '/properties'
    },
    {
      title: 'Recent Activity',
      value: stats.recentActivity,
      subtitle: 'Last 30 days',
      icon: '📈',
      color: 'purple',
      link: '/portfolio'
    },
    {
      title: 'HCS Verified',
      value: stats.hcsVerifiedTransactions,
      subtitle: 'Blockchain events',
      icon: '🔗',
      color: 'indigo',
      link: '/portfolio'
    }
  ];

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {statCards.map((card, index) => (
        <ScrollAnimations 
          key={card.title} 
          animationType="fade-in-up" 
          delay={index * 100}
        >
          <MagneticEffect>
            <Link href={card.link} className="block">
              <div className={`bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 group`}>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 bg-${card.color}-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <span className="text-2xl">{card.icon}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className={`w-2 h-2 bg-${card.color}-400 rounded-full animate-pulse`}></div>
                    <span className="text-xs text-gray-400">Live</span>
                  </div>
                </div>
                
                <div className="mb-2">
                  <h3 className="text-gray-400 text-sm font-medium">{card.title}</h3>
                  <p className={`text-${card.color}-400 text-2xl font-bold`}>
                    {formatNumber(card.value)}
                  </p>
                </div>
                
                <p className="text-gray-300 text-sm">{card.subtitle}</p>
                
                {card.title === 'HCS Verified' && (
                  <div className="mt-3 flex items-center text-xs text-blue-400">
                    <span className="mr-1">🔒</span>
                    <span>Hedera Consensus Service</span>
                  </div>
                )}
              </div>
            </Link>
          </MagneticEffect>
        </ScrollAnimations>
      ))}
    </div>
  );
};

export default DashboardStats;
