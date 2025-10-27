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
  metadata?: any;
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
        investments.forEach((investment: any) => {
          activitiesList.push({
            id: `investment-${investment.id}`,
            type: 'investment',
            title: `Investment in ${investment.property?.name || investment.property?.title || 'Property'}`,
            description: `Invested $${investment.amount} for ${investment.tokens_purchased} tokens`,
            timestamp: investment.created_at,
            amount: investment.amount,
            currency: 'USD',
            propertyId: investment.property_id,
            propertyName: investment.property?.name || investment.property?.title,
            transactionId: investment.transaction_hash,
            hashScanUrl: investment.transaction_hash ? getHashScanTransactionUrl(investment.transaction_hash) : undefined,
            status: investment.status === 'completed' ? 'completed' : investment.status === 'pending' ? 'pending' : 'failed',
            metadata: {
              tokens_purchased: investment.tokens_purchased,
              token_price: investment.token_price,
              location: investment.property?.location
            }
          });
        });
      }

      // Add property creation activities
      if (userProperties) {
        userProperties.forEach((property: any) => {
          activitiesList.push({
            id: `property-${property.id}`,
            type: 'property_created',
            title: `Property Listed: ${property.name || property.title}`,
            description: `Tokenized property worth $${property.total_value} in ${property.location}`,
            timestamp: property.created_at,
            amount: property.total_value,
            currency: 'USD',
            propertyId: property.id,
            propertyName: property.name || property.title,
            status: property.status === 'active' ? 'completed' : 'pending',
            metadata: {
              location: property.location,
              property_type: property.property_type,
              yield_rate: property.yield_rate
            }
          });
        });
      }

      // Add HCS property events
      if (propertyEvents) {
        propertyEvents.forEach((event: any) => {
          const eventData = event.event_data;
          let activity: DashboardActivity | null = null;

          switch (event.event_type) {
            case 'investment':
              activity = {
                id: `hcs-investment-${event.id}`,
                type: 'investment',
                title: `New Investment in ${event.property?.name || event.property?.title || 'Property'}`,
                description: `$${eventData.usd_amount} invested for ${eventData.tokens_purchased} tokens`,
                timestamp: event.timestamp,
                amount: eventData.usd_amount,
                currency: 'USD',
                propertyId: event.property_id,
                propertyName: event.property?.name || event.property?.title,
                transactionId: event.tx_id,
                hashScanUrl: getHashScanTransactionUrl(event.tx_id),
                status: 'completed',
                metadata: {
                  investor: eventData.investor,
                  hbar_amount: eventData.amount_hbar,
                  tokens_purchased: eventData.tokens_purchased
                }
              };
              break;

            case 'property_created':
              activity = {
                id: `hcs-property-${event.id}`,
                type: 'property_created',
                title: `Property Tokenized: ${eventData.name}`,
                description: `New property tokenized with ${eventData.token_symbol} tokens`,
                timestamp: event.timestamp,
                amount: eventData.total_value,
                currency: 'USD',
                propertyId: event.property_id,
                propertyName: eventData.name,
                transactionId: event.tx_id,
                hashScanUrl: getHashScanTransactionUrl(event.tx_id),
                status: 'completed',
                metadata: {
                  token_symbol: eventData.token_symbol,
                  location: eventData.location
                }
              };
              break;

            case 'token_transfer':
              activity = {
                id: `hcs-transfer-${event.id}`,
                type: 'token_transfer',
                title: `Token Transfer`,
                description: `${eventData.tokens_transferred} tokens transferred`,
                timestamp: event.timestamp,
                transactionId: event.tx_id,
                hashScanUrl: getHashScanTransactionUrl(event.tx_id),
                status: 'completed',
                metadata: {
                  from_account: eventData.from_account,
                  to_account: eventData.to_account,
                  tokens_transferred: eventData.tokens_transferred
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
    } catch (err: any) {
      console.error('Error fetching dashboard activities:', err);
      setError(err.message || 'Failed to fetch activities');
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
