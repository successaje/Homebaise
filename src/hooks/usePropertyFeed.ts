import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { HCSEvent } from '@/lib/hedera-hcs';

export interface PropertyEvent {
  id: string;
  topic_id: string;
  property_id: string;
  event_type: string;
  investor?: string;
  amount?: number;
  tx_id: string;
  hcs_tx_id?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
  created_at: string;
}

export interface PropertyFeedData {
  events: PropertyEvent[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  totalCount: number;
}

export interface UsePropertyFeedOptions {
  propertyId: string;
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function usePropertyFeed({
  propertyId,
  limit = 20,
  autoRefresh = true,
  refreshInterval = 30000 // 30 seconds
}: UsePropertyFeedOptions): PropertyFeedData & {
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
} {
  const [events, setEvents] = useState<PropertyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [offset, setOffset] = useState(0);

  const fetchEvents = useCallback(async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setOffset(0);
      }

      const currentOffset = reset ? 0 : offset;
      
      const { data, error: fetchError, count } = await supabase
        .from('property_events')
        .select('*', { count: 'exact' })
        .eq('property_id', propertyId)
        .order('timestamp', { ascending: false })
        .range(currentOffset, currentOffset + limit - 1);

      if (fetchError) {
        throw fetchError;
      }

      const newEvents = data || [];
      
      if (reset) {
        setEvents(newEvents);
      } else {
        setEvents(prev => [...prev, ...newEvents]);
      }

      setTotalCount(count || 0);
      setHasMore(newEvents.length === limit);
      setOffset(currentOffset + newEvents.length);
      setError(null);
    } catch (err) {
      console.error('Error fetching property events:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  }, [propertyId, limit, offset]);

  const refresh = useCallback(async () => {
    await fetchEvents(true);
  }, [fetchEvents]);

  const loadMore = useCallback(async () => {
    if (!loading && hasMore) {
      await fetchEvents(false);
    }
  }, [fetchEvents, loading, hasMore]);

  // Initial load
  useEffect(() => {
    if (propertyId) {
      fetchEvents(true);
    }
  }, [propertyId, fetchEvents]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !propertyId) return;

    const interval = setInterval(() => {
      refresh();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, propertyId, refresh, refreshInterval]);

  // Real-time subscription
  useEffect(() => {
    if (!propertyId) return;

    const subscription = supabase
      .channel(`property_events:${propertyId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'property_events',
          filter: `property_id=eq.${propertyId}`
        },
        (payload) => {
          console.log('New property event received:', payload);
          const newEvent = payload.new as PropertyEvent;
          
          setEvents(prev => [newEvent, ...prev]);
          setTotalCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [propertyId]);

  return {
    events,
    loading,
    error,
    hasMore,
    totalCount,
    refresh,
    loadMore
  };
}

// Helper function to format event data for display
export function formatEventForDisplay(event: PropertyEvent): {
  title: string;
  description: string;
  icon: string;
  color: string;
  amount?: string;
  timestamp: string;
} {
  const timestamp = new Date(event.timestamp).toLocaleString();
  
  switch (event.event_type) {
    case 'investment':
      return {
        title: 'New Investment',
        description: `Investor ${event.investor?.slice(-8) || 'Unknown'} invested in this property`,
        icon: '💰',
        color: 'text-green-400',
        amount: event.amount ? `$${event.amount.toLocaleString()}` : undefined,
        timestamp
      };
    
    case 'token_transfer':
      return {
        title: 'Token Transfer',
        description: `Tokens transferred to investor ${event.investor?.slice(-8) || 'Unknown'}`,
        icon: '🔄',
        color: 'text-blue-400',
        amount: event.amount ? `${event.amount} tokens` : undefined,
        timestamp
      };
    
    case 'property_created':
      return {
        title: 'Property Tokenized',
        description: 'Property was successfully tokenized on Hedera',
        icon: '🏗️',
        color: 'text-purple-400',
        timestamp
      };
    
    case 'withdrawal':
      return {
        title: 'Withdrawal',
        description: `Investor ${event.investor?.slice(-8) || 'Unknown'} withdrew from this property`,
        icon: '💸',
        color: 'text-red-400',
        amount: event.amount ? `$${event.amount.toLocaleString()}` : undefined,
        timestamp
      };
    
    default:
      return {
        title: 'Property Event',
        description: `Event: ${event.event_type}`,
        icon: '📋',
        color: 'text-gray-400',
        timestamp
      };
  }
}

// Helper function to get HashScan URLs
export function getEventHashScanUrls(event: PropertyEvent): {
  transactionUrl?: string;
  hcsUrl?: string;
} {
  const urls: { transactionUrl?: string; hcsUrl?: string } = {};
  
  if (event.tx_id) {
    urls.transactionUrl = `https://hashscan.io/testnet/transaction/${event.tx_id}`;
  }
  
  if (event.hcs_tx_id) {
    urls.hcsUrl = `https://hashscan.io/testnet/transaction/${event.hcs_tx_id}`;
  }
  
  return urls;
}
