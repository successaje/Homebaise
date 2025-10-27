'use client';

import React, { useState } from 'react';
import { usePropertyFeed, formatEventForDisplay, getEventHashScanUrls, PropertyEvent } from '@/hooks/usePropertyFeed';
import { getHashScanTopicUrl } from '@/lib/hedera-hcs';

interface PropertyActivityFeedProps {
  propertyId: string;
  topicId?: string;
  className?: string;
}

export default function PropertyActivityFeed({ 
  propertyId, 
  topicId,
  className = '' 
}: PropertyActivityFeedProps) {
  const { events, loading, error, hasMore, totalCount, refresh, loadMore } = usePropertyFeed({
    propertyId,
    limit: 10,
    autoRefresh: true,
    refreshInterval: 30000
  });

  const [showAll, setShowAll] = useState(false);

  if (loading && events.length === 0) {
    return (
      <div className={`bg-white/5 border border-white/10 rounded-2xl p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">Activity Feed</h3>
          <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-gray-400">Loading activity...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white/5 border border-white/10 rounded-2xl p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">Activity Feed</h3>
          <button
            onClick={refresh}
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            🔄 Retry
          </button>
        </div>
        <p className="text-red-400">Error loading activity: {error}</p>
      </div>
    );
  }

  const displayEvents = showAll ? events : events.slice(0, 5);

  return (
    <div className={`bg-white/5 border border-white/10 rounded-2xl p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mr-3">
            <span className="text-white text-sm">📊</span>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">Activity Feed</h3>
            <p className="text-gray-400 text-sm">
              {totalCount} events • Real-time updates
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {topicId && (
            <a
              href={getHashScanTopicUrl(topicId)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-blue-400 hover:text-blue-300 transition-colors text-sm"
            >
              <span className="mr-1">🔗</span>
              View on HashScan
            </a>
          )}
          <button
            onClick={refresh}
            className="text-gray-400 hover:text-white transition-colors p-1"
            title="Refresh"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Transparency Badge */}
      <div className="mb-6 p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg">
        <div className="flex items-center">
          <span className="text-green-400 mr-2">✅</span>
          <span className="text-green-300 text-sm font-medium">
            All transactions are verifiable on Hedera Consensus Service
          </span>
        </div>
      </div>

      {displayEvents.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📋</div>
          <p className="text-gray-400">No activity yet</p>
          <p className="text-gray-500 text-sm">Events will appear here as they happen</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
          
          {events.length > 5 && !showAll && (
            <button
              onClick={() => setShowAll(true)}
              className="w-full py-2 text-blue-400 hover:text-blue-300 transition-colors text-sm"
            >
              Show {events.length - 5} more events
            </button>
          )}
          
          {hasMore && showAll && (
            <button
              onClick={loadMore}
              disabled={loading}
              className="w-full py-2 text-blue-400 hover:text-blue-300 transition-colors text-sm disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function EventCard({ event }: { event: PropertyEvent }) {
  const eventData = formatEventForDisplay(event);
  const urls = getEventHashScanUrls(event);

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="text-2xl">{eventData.icon}</div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="text-white font-medium">{eventData.title}</h4>
              {eventData.amount && (
                <span className="text-sm bg-white/10 px-2 py-1 rounded-full text-gray-300">
                  {eventData.amount}
                </span>
              )}
            </div>
            <p className="text-gray-400 text-sm mb-2">{eventData.description}</p>
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span>{eventData.timestamp}</span>
              {urls.transactionUrl && (
                <a
                  href={urls.transactionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  View Transaction
                </a>
              )}
              {urls.hcsUrl && (
                <a
                  href={urls.hcsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 transition-colors"
                >
                  View HCS Message
                </a>
              )}
            </div>
          </div>
        </div>
        
        <div className={`text-xs px-2 py-1 rounded-full ${eventData.color} bg-opacity-20`}>
          {event.event_type.replace('_', ' ')}
        </div>
      </div>
    </div>
  );
}
