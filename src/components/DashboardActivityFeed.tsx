'use client';

import React from 'react';
import Link from 'next/link';
import { useDashboardActivity, DashboardActivity } from '@/hooks/useDashboardActivity';
import { formatCurrency, formatDate } from '@/lib/utils';
import MagneticEffect from './MagneticEffect';
import ScrollAnimations from './ScrollAnimations';

interface DashboardActivityFeedProps {
  userId: string;
  limit?: number;
  showHeader?: boolean;
  className?: string;
}

const DashboardActivityFeed: React.FC<DashboardActivityFeedProps> = ({ 
  userId, 
  limit = 10, 
  showHeader = true,
  className = ''
}) => {
  const { activities, loading, error, refetch } = useDashboardActivity({ 
    userId, 
    limit 
  });

  const getActivityIcon = (type: DashboardActivity['type'], status: DashboardActivity['status']) => {
    const baseIcons = {
      investment: '💰',
      property_created: '🏠',
      token_transfer: '💸',
      withdrawal: '💳',
      certificate_minted: '📜',
      profile_update: '👤'
    };

    const statusIcons = {
      completed: '✅',
      pending: '⏳',
      failed: '❌'
    };

    return status === 'completed' ? baseIcons[type] : statusIcons[status];
  };

  const getActivityColor = (type: DashboardActivity['type'], status: DashboardActivity['status']) => {
    if (status === 'failed') return 'text-red-400 bg-red-500/10 border-red-500/20';
    if (status === 'pending') return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    
    const colors = {
      investment: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      property_created: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      token_transfer: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      withdrawal: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
      certificate_minted: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      profile_update: 'text-gray-400 bg-gray-500/10 border-gray-500/20'
    };

    return colors[type];
  };

  const formatActivityDescription = (activity: DashboardActivity) => {
    if (activity.amount && activity.currency) {
      return `${activity.description} • ${formatCurrency(activity.amount)} ${activity.currency}`;
    }
    return activity.description;
  };

  if (loading && activities.length === 0) {
    return (
      <div className={`bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 ${className}`}>
        {showHeader && (
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <span className="mr-3">📊</span>
              Recent Activity
            </h2>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-400">Live</span>
            </div>
          </div>
        )}
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-4 p-4 bg-white/5 rounded-xl">
                <div className="w-10 h-10 bg-gray-500/20 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-500/20 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-500/20 rounded w-1/2"></div>
                </div>
                <div className="h-3 bg-gray-500/20 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 ${className}`}>
        {showHeader && (
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <span className="mr-3">📊</span>
            Recent Activity
          </h2>
        )}
        <div className="text-center py-8">
          <div className="text-red-400 text-4xl mb-4">⚠️</div>
          <p className="text-red-400 mb-4">Failed to load activity feed</p>
          <button
            onClick={refetch}
            className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg hover:bg-red-500/30 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className={`bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 ${className}`}>
        {showHeader && (
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <span className="mr-3">📊</span>
            Recent Activity
          </h2>
        )}
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-4">📈</div>
          <p className="text-gray-400 mb-2">No recent activity</p>
          <p className="text-gray-500 text-sm">Your investment activities will appear here</p>
          <Link 
            href="/properties" 
            className="inline-block mt-4 bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-lg hover:bg-emerald-500/30 transition-colors"
          >
            Browse Properties
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 ${className}`}>
      {showHeader && (
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <span className="mr-3">📊</span>
            Recent Activity
          </h2>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-400">Live</span>
            <button
              onClick={refetch}
              className="ml-2 p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              title="Refresh"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {activities.map((activity, index) => (
          <ScrollAnimations 
            key={activity.id} 
            animationType="fade-in-up" 
            delay={index * 100}
          >
            <MagneticEffect>
              <div className={`p-4 rounded-xl border transition-all duration-300 hover:bg-white/10 ${getActivityColor(activity.type, activity.status)}`}>
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-lg">
                    {getActivityIcon(activity.type, activity.status)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-white font-semibold text-sm mb-1">
                          {activity.title}
                        </h3>
                        <p className="text-gray-300 text-xs mb-2">
                          {formatActivityDescription(activity)}
                        </p>
                        
                        {activity.propertyName && (
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-xs text-gray-500">Property:</span>
                            <Link 
                              href={`/properties/${activity.propertyId}`}
                              className="text-xs text-blue-400 hover:text-blue-300 hover:underline"
                            >
                              {activity.propertyName}
                            </Link>
                          </div>
                        )}

                        {activity.metadata && typeof activity.metadata === 'object' && 'location' in activity.metadata && (
                          <p className="text-xs text-gray-500">
                            📍 {String(activity.metadata.location)}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex flex-col items-end space-y-1">
                        <span className="text-xs text-gray-400">
                          {formatDate(activity.timestamp)}
                        </span>
                        
                        {activity.transactionId && activity.hashScanUrl && (
                          <Link
                            href={activity.hashScanUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-xs text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            <span className="mr-1">🔗</span>
                            View on HashScan
                            <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </MagneticEffect>
          </ScrollAnimations>
        ))}
      </div>

      {activities.length >= limit && (
        <div className="text-center mt-6">
          <Link 
            href="/portfolio" 
            className="inline-flex items-center text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <span className="mr-2">View All Activity</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
};

export default DashboardActivityFeed;
