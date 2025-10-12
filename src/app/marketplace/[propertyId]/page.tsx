'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Property } from '@/types/property';
import { 
  MarketplaceStatistics, 
  OrderBook, 
  MarketplaceTrade,
  MarketplaceOrder,
  OrderType 
} from '@/types/marketplace';
import { supabase } from '@/lib/supabase';
import { formatNumber, formatCurrency } from '@/lib/utils';
import TradingChart from '@/components/marketplace/TradingChart';
import OrderBookComponent from '@/components/marketplace/OrderBook';
import TradeForm from '@/components/marketplace/TradeForm';
import RecentTrades from '@/components/marketplace/RecentTrades';
import MarketStats from '@/components/marketplace/MarketStats';
import MyOrders from '@/components/marketplace/MyOrders';

export default function MarketplacePage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.propertyId as string;

  const [property, setProperty] = useState<Property | null>(null);
  const [stats, setStats] = useState<MarketplaceStatistics | null>(null);
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);
  const [recentTrades, setRecentTrades] = useState<MarketplaceTrade[]>([]);
  const [myOrders, setMyOrders] = useState<MarketplaceOrder[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);

  useEffect(() => {
    init();
    setupRealtimeSubscriptions();
  }, [propertyId]);

  const init = async () => {
    try {
      setLoading(true);

      // Get user session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        await fetchMyOrders(session.user.id);
      }

      // Fetch property
      const { data: propertyData } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();

      if (!propertyData) {
        router.push('/marketplace');
        return;
      }

      setProperty(propertyData as Property);

      // Fetch market data
      await Promise.all([
        fetchStatistics(),
        fetchOrderBook(),
        fetchRecentTrades()
      ]);

    } catch (error) {
      console.error('Error initializing marketplace page:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch(`/api/marketplace/statistics?property_id=${propertyId}`);
      const data = await response.json();
      if (data.statistics) {
        setStats(data.statistics);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const fetchOrderBook = async () => {
    try {
      const response = await fetch(`/api/marketplace/orderbook?property_id=${propertyId}`);
      const data = await response.json();
      if (data.orderBook) {
        setOrderBook(data.orderBook);
      }
    } catch (error) {
      console.error('Error fetching order book:', error);
    }
  };

  const fetchRecentTrades = async () => {
    try {
      const response = await fetch(`/api/marketplace/trades?property_id=${propertyId}&limit=20`);
      const data = await response.json();
      if (data.trades) {
        setRecentTrades(data.trades);
      }
    } catch (error) {
      console.error('Error fetching recent trades:', error);
    }
  };

  const fetchMyOrders = async (userId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `/api/marketplace/orders?property_id=${propertyId}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        }
      );
      const data = await response.json();
      if (data.orders) {
        setMyOrders(data.orders);
      }
    } catch (error) {
      console.error('Error fetching my orders:', error);
    }
  };

  const setupRealtimeSubscriptions = () => {
    // Subscribe to order book changes
    const ordersChannel = supabase
      .channel(`marketplace_orders_${propertyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'marketplace_orders',
          filter: `property_id=eq.${propertyId}`
        },
        () => {
          fetchOrderBook();
          if (user) fetchMyOrders(user.id);
        }
      )
      .subscribe();

    // Subscribe to trades
    const tradesChannel = supabase
      .channel(`marketplace_trades_${propertyId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'marketplace_trades',
          filter: `property_id=eq.${propertyId}`
        },
        () => {
          fetchRecentTrades();
          fetchStatistics();
        }
      )
      .subscribe();

    return () => {
      ordersChannel.unsubscribe();
      tradesChannel.unsubscribe();
    };
  };

  const handleOrderSuccess = () => {
    fetchOrderBook();
    fetchStatistics();
    if (user) fetchMyOrders(user.id);
  };

  const handlePriceClick = (price: number, type: OrderType) => {
    setSelectedPrice(price);
    setActiveTab(type);
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/marketplace/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        fetchOrderBook();
        if (user) fetchMyOrders(user.id);
      }
    } catch (error) {
      console.error('Error canceling order:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Property not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Navigation */}
      <nav className="fixed w-full bg-black/80 backdrop-blur-xl border-b border-white/10 z-50">
        <div className="max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <span className="text-xl font-bold text-white">Homebaise</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/marketplace" className="text-gray-300 hover:text-white">Marketplace</Link>
              <Link href="/properties" className="text-gray-300 hover:text-white">Properties</Link>
              <Link href="/dashboard" className="text-gray-300 hover:text-white">Dashboard</Link>
              {user ? (
                <Link href="/profile" className="text-emerald-400 hover:text-emerald-300">Profile</Link>
              ) : (
                <Link href="/auth" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-20 pb-8 max-w-[2000px] mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 text-gray-400 text-sm mb-2">
                <Link href="/marketplace" className="hover:text-white">Marketplace</Link>
                <span>›</span>
                <span>{property.token_symbol || property.name}</span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {property.name || property.title}
              </h1>
              <p className="text-gray-400">📍 {property.location}</p>
            </div>
            <Link 
              href={`/properties/${property.id}`}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors"
            >
              View Property Details
            </Link>
          </div>
        </div>

        {/* Market Statistics */}
        {stats && <MarketStats stats={stats} property={property} />}

        {/* Trading Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-6">
          {/* Left Column - Chart & Trades */}
          <div className="lg:col-span-8 space-y-4">
            {/* Price Chart */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <TradingChart propertyId={propertyId} />
            </div>

            {/* Recent Trades */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <RecentTrades trades={recentTrades} />
            </div>

            {/* My Orders */}
            {user && myOrders.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <MyOrders 
                  orders={myOrders} 
                  onCancel={handleCancelOrder}
                />
              </div>
            )}
          </div>

          {/* Right Column - Order Book & Trading */}
          <div className="lg:col-span-4 space-y-4">
            {/* Trading Form */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <TradeForm
                property={property}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                selectedPrice={selectedPrice}
                onSuccess={handleOrderSuccess}
                user={user}
              />
            </div>

            {/* Order Book */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <OrderBookComponent
                orderBook={orderBook}
                onPriceClick={handlePriceClick}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

