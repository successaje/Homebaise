import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { getHashScanTransactionUrl } from '@/lib/hedera-hcs';

export interface DashboardActivity {
  id: string;
  type: 'investment' | 'property_created' | 'token_transfer' | 'withdrawal' | 'certificate_minted' | 'profile_update';
  title: string;
  description: string;
  timestamp: string;
  amount?: number;
  currency?: string;
  propertyId?: string;
  propertyName?: string;
  transactionId?: string;
  hashScanUrl?: string;
  status: 'completed' | 'pending' | 'failed';
  metadata?: Record<string, unknown>;
}

interface UseDashboardActivityOptions {
  limit?: number;
  refreshInterval?: number;
  userId?: string;
}

export const useDashboardActivity = (options?: UseDashboardActivityOptions) => {
  const { limit = 20, refreshInterval = 30000, userId } = options || {};
  const [activities, setActivities] = useState<DashboardActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch user's investments
      const { data: investments, error: investmentsError } = await supabase
        .from('investments')
        .select(`
          *,
          property:properties(
            id,
            name,
            title,
            location
          )
        `)
        .eq('investor_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (investmentsError) {
        console.error('Error fetching investments:', investmentsError);
      }

      // Fetch property events (HCS data)
      const { data: propertyEvents, error: eventsError } = await supabase
        .from('property_events')
        .select(`
          *,
          property:properties(
            id,
            name,
            title
          )
        `)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (eventsError) {
        console.error('Error fetching property events:', eventsError);
      }

      // Fetch user's properties
      const { data: userProperties, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .eq('listed_by', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (propertiesError) {
        console.error('Error fetching user properties:', propertiesError);
      }

      // Transform data into activities
      const activitiesList: DashboardActivity[] = [];

      // Add investment activities
      if (investments) {
        investments.forEach((investment: Record<string, unknown>) => {
          const property = investment.property as Record<string, unknown> | undefined;
          const propertyName = property?.name || property?.title || 'Property';
          activitiesList.push({
            id: `investment-${String(investment.id)}`,
            type: 'investment',
            title: `Investment in ${String(propertyName)}`,
            description: `Invested $${Number(investment.amount)} for ${Number(investment.tokens_purchased)} tokens`,
            timestamp: String(investment.created_at || ''),
            amount: Number(investment.amount || 0),
            currency: 'USD',
            propertyId: String(investment.property_id || ''),
            propertyName: String(property?.name || property?.title || 'Property'),
            transactionId: investment.transaction_hash ? String(investment.transaction_hash) : undefined,
            hashScanUrl: investment.transaction_hash ? getHashScanTransactionUrl(String(investment.transaction_hash)) : undefined,
            status: investment.status === 'completed' ? 'completed' : investment.status === 'pending' ? 'pending' : 'failed',
            metadata: {
              tokens_purchased: Number(investment.tokens_purchased || 0),
              token_price: Number(investment.token_price || 0),
              location: property?.location ? String(property.location) : undefined
            }
          });
        });
      }

      // Add property creation activities
      if (userProperties) {
        userProperties.forEach((property: Record<string, unknown>) => {
          activitiesList.push({
            id: `property-${String(property.id)}`,
            type: 'property_created',
            title: `Property Listed: ${String(property.name || property.title || 'Property')}`,
            description: `Tokenized property worth $${Number(property.total_value || 0)} in ${String(property.location || 'Unknown')}`,
            timestamp: String(property.created_at || ''),
            amount: Number(property.total_value || 0),
            currency: 'USD',
            propertyId: String(property.id || ''),
            propertyName: String(property.name || property.title || 'Property'),
            status: property.status === 'active' ? 'completed' : 'pending',
            metadata: {
              location: property.location ? String(property.location) : undefined,
              property_type: property.property_type ? String(property.property_type) : undefined,
              yield_rate: property.yield_rate ? Number(property.yield_rate) : undefined
            }
          });
        });
      }

      // Add HCS property events
      if (propertyEvents) {
        propertyEvents.forEach((event: Record<string, unknown>) => {
          const eventData = event.event_data as Record<string, unknown>;
          const property = event.property as Record<string, unknown> | undefined;
          let activity: DashboardActivity | null = null;

          switch (event.event_type) {
            case 'investment':
              activity = {
                id: `hcs-investment-${String(event.id)}`,
                type: 'investment',
                title: `New Investment in ${String(property?.name || property?.title || 'Property')}`,
                description: `$${Number(eventData.usd_amount || 0)} invested for ${Number(eventData.tokens_purchased || 0)} tokens`,
                timestamp: String(event.timestamp || ''),
                amount: Number(eventData.usd_amount || 0),
                currency: 'USD',
                propertyId: String(event.property_id || ''),
                propertyName: String(property?.name || property?.title || 'Property'),
                transactionId: event.tx_id ? String(event.tx_id) : undefined,
                hashScanUrl: event.tx_id ? getHashScanTransactionUrl(String(event.tx_id)) : undefined,
                status: 'completed',
                metadata: {
                  investor: eventData.investor ? String(eventData.investor) : undefined,
                  hbar_amount: eventData.amount_hbar ? Number(eventData.amount_hbar) : undefined,
                  tokens_purchased: eventData.tokens_purchased ? Number(eventData.tokens_purchased) : undefined
                }
              };
              break;

            case 'property_created':
              activity = {
                id: `hcs-property-${String(event.id)}`,
                type: 'property_created',
                title: `Property Tokenized: ${String(eventData.name || 'Property')}`,
                description: `New property tokenized with ${String(eventData.token_symbol || 'N/A')} tokens`,
                timestamp: String(event.timestamp || ''),
                amount: Number(eventData.total_value || 0),
                currency: 'USD',
                propertyId: String(event.property_id || ''),
                propertyName: String(eventData.name || 'Property'),
                transactionId: event.tx_id ? String(event.tx_id) : undefined,
                hashScanUrl: event.tx_id ? getHashScanTransactionUrl(String(event.tx_id)) : undefined,
                status: 'completed',
                metadata: {
                  token_symbol: eventData.token_symbol ? String(eventData.token_symbol) : undefined,
                  location: eventData.location ? String(eventData.location) : undefined
                }
              };
              break;

            case 'token_transfer':
              activity = {
                id: `hcs-transfer-${String(event.id)}`,
                type: 'token_transfer',
                title: `Token Transfer`,
                description: `${Number(eventData.tokens_transferred || 0)} tokens transferred`,
                timestamp: String(event.timestamp || ''),
                transactionId: event.tx_id ? String(event.tx_id) : undefined,
                hashScanUrl: event.tx_id ? getHashScanTransactionUrl(String(event.tx_id)) : undefined,
                status: 'completed',
                metadata: {
                  from_account: eventData.from_account ? String(eventData.from_account) : undefined,
                  to_account: eventData.to_account ? String(eventData.to_account) : undefined,
                  tokens_transferred: eventData.tokens_transferred ? Number(eventData.tokens_transferred) : undefined
                }
              };
              break;
          }

          if (activity) {
            activitiesList.push(activity);
          }
        });
      }

      // Sort by timestamp and limit
      const sortedActivities = activitiesList
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);

      setActivities(sortedActivities);
    } catch (err: unknown) {
      console.error('Error fetching dashboard activities:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch activities');
    } finally {
      setLoading(false);
    }
  }, [userId, limit]);

  useEffect(() => {
    if (!userId) return;

    fetchActivities();

    // Set up refresh interval
    const interval = setInterval(fetchActivities, refreshInterval);

    return () => clearInterval(interval);
  }, [fetchActivities, refreshInterval]);

  return { activities, loading, error, refetch: fetchActivities };
};
