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

// Mock data for demo purposes
const MOCK_DATA: Record<string, any> = {
  'mock-1': {
    property: {
      id: 'mock-1',
      name: 'Lagos Luxury Apartments',
      title: 'Lagos Luxury Apartments',
      description: 'Premium residential complex in Victoria Island',
      location: 'Victoria Island, Lagos, Nigeria',
      property_type: 'residential',
      total_value: 2500000,
      token_id: '0.0.123456',
      token_symbol: 'LAGOS',
      status: 'tokenized',
      yield_rate: '8.5%',
      images: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800']
    },
    stats: {
      volume_24h: 45000,
      trades_24h: 23,
      high_24h: 52.50,
      low_24h: 48.20,
      change_24h: 5.2,
      last_price: 51.75,
      best_bid: 51.50,
      best_ask: 52.00,
      spread: 0.50
    },
    orderBook: {
      bids: [
        { price_per_token: 51.50, total_amount: 500, order_count: 3 },
        { price_per_token: 51.25, total_amount: 800, order_count: 5 },
        { price_per_token: 51.00, total_amount: 1200, order_count: 7 },
        { price_per_token: 50.75, total_amount: 600, order_count: 4 }
      ],
      asks: [
        { price_per_token: 52.00, total_amount: 600, order_count: 4 },
        { price_per_token: 52.25, total_amount: 900, order_count: 6 },
        { price_per_token: 52.50, total_amount: 750, order_count: 5 },
        { price_per_token: 52.75, total_amount: 400, order_count: 2 }
      ],
      spread: 0.50,
      mid_price: 51.75
    },
    recentTrades: [
      { id: '1', token_amount: 150, price_per_token: 51.75, total_price: 7762.5, completed_at: new Date(Date.now() - 5 * 60000).toISOString() },
      { id: '2', token_amount: 200, price_per_token: 51.50, total_price: 10300, completed_at: new Date(Date.now() - 15 * 60000).toISOString() },
      { id: '3', token_amount: 100, price_per_token: 51.25, total_price: 5125, completed_at: new Date(Date.now() - 30 * 60000).toISOString() },
      { id: '4', token_amount: 300, price_per_token: 51.00, total_price: 15300, completed_at: new Date(Date.now() - 45 * 60000).toISOString() },
      { id: '5', token_amount: 75, price_per_token: 51.60, total_price: 3870, completed_at: new Date(Date.now() - 60 * 60000).toISOString() }
    ]
  },
  'mock-2': {
    property: {
      id: 'mock-2',
      name: 'Nairobi Commercial Plaza',
      location: 'Westlands, Nairobi, Kenya',
      token_id: '0.0.234567',
      token_symbol: 'NRBI',
      status: 'tokenized',
      yield_rate: '12.3%',
      images: ['https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800']
    },
    stats: {
      volume_24h: 67000,
      trades_24h: 34,
      change_24h: 3.8,
      last_price: 77.25,
      best_bid: 76.90,
      best_ask: 77.50,
      spread: 0.60
    },
    orderBook: {
      bids: [
        { price_per_token: 76.90, total_amount: 400, order_count: 2 },
        { price_per_token: 76.50, total_amount: 650, order_count: 4 },
        { price_per_token: 76.00, total_amount: 900, order_count: 6 }
      ],
      asks: [
        { price_per_token: 77.50, total_amount: 500, order_count: 3 },
        { price_per_token: 78.00, total_amount: 700, order_count: 5 },
        { price_per_token: 78.50, total_amount: 450, order_count: 3 }
      ],
      spread: 0.60,
      mid_price: 77.20
    },
    recentTrades: [
      { id: '1', token_amount: 250, price_per_token: 77.25, total_price: 19312.5, completed_at: new Date(Date.now() - 3 * 60000).toISOString() },
      { id: '2', token_amount: 180, price_per_token: 77.00, total_price: 13860, completed_at: new Date(Date.now() - 12 * 60000).toISOString() }
    ]
  },
  'mock-3': {
    property: {
      id: 'mock-3',
      name: 'Cape Town Beachfront',
      location: 'Camps Bay, Cape Town, South Africa',
      token_id: '0.0.345678',
      token_symbol: 'CAPE',
      status: 'tokenized',
      yield_rate: '6.8%',
      images: ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800']
    },
    stats: {
      volume_24h: 28000,
      trades_24h: 15,
      change_24h: -1.5,
      last_price: 93.20,
      best_bid: 92.80,
      best_ask: 93.60,
      spread: 0.80
    },
    orderBook: {
      bids: [
        { price_per_token: 92.80, total_amount: 300, order_count: 2 },
        { price_per_token: 92.50, total_amount: 500, order_count: 3 }
      ],
      asks: [
        { price_per_token: 93.60, total_amount: 350, order_count: 2 },
        { price_per_token: 94.00, total_amount: 450, order_count: 3 }
      ],
      spread: 0.80,
      mid_price: 93.20
    },
    recentTrades: [
      { id: '1', token_amount: 100, price_per_token: 93.20, total_price: 9320, completed_at: new Date(Date.now() - 8 * 60000).toISOString() }
    ]
  },
  'mock-4': {
    property: {
      id: 'mock-4',
      name: 'Accra Tech Hub',
      location: 'Osu, Accra, Ghana',
      token_id: '0.0.456789',
      token_symbol: 'TECH',
      status: 'tokenized',
      yield_rate: '10.5%',
      images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=800']
    },
    stats: {
      volume_24h: 52000,
      trades_24h: 28,
      change_24h: 6.2,
      last_price: 37.90,
      best_bid: 37.60,
      best_ask: 38.10,
      spread: 0.50
    },
    orderBook: {
      bids: [
        { price_per_token: 37.60, total_amount: 700, order_count: 4 },
        { price_per_token: 37.30, total_amount: 950, order_count: 6 }
      ],
      asks: [
        { price_per_token: 38.10, total_amount: 600, order_count: 4 },
        { price_per_token: 38.40, total_amount: 800, order_count: 5 }
      ],
      spread: 0.50,
      mid_price: 37.85
    },
    recentTrades: [
      { id: '1', token_amount: 220, price_per_token: 37.90, total_price: 8338, completed_at: new Date(Date.now() - 4 * 60000).toISOString() },
      { id: '2', token_amount: 180, price_per_token: 37.70, total_price: 6786, completed_at: new Date(Date.now() - 18 * 60000).toISOString() }
    ]
  },
  'mock-5': {
    property: {
      id: 'mock-5',
      name: 'Kigali Urban Residences',
      location: 'Kigali City, Rwanda',
      token_id: '0.0.567890',
      token_symbol: 'KGLI',
      status: 'tokenized',
      yield_rate: '9.2%',
      images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800']
    },
    stats: {
      volume_24h: 15000,
      trades_24h: 8,
      change_24h: 2.1,
      last_price: 26.30,
      best_bid: 26.00,
      best_ask: 26.50,
      spread: 0.50
    },
    orderBook: {
      bids: [
        { price_per_token: 26.00, total_amount: 400, order_count: 2 },
        { price_per_token: 25.80, total_amount: 550, order_count: 3 }
      ],
      asks: [
        { price_per_token: 26.50, total_amount: 350, order_count: 2 },
        { price_per_token: 26.75, total_amount: 500, order_count: 3 }
      ],
      spread: 0.50,
      mid_price: 26.25
    },
    recentTrades: [
      { id: '1', token_amount: 120, price_per_token: 26.30, total_price: 3156, completed_at: new Date(Date.now() - 10 * 60000).toISOString() }
    ]
  },
  'mock-6': {
    property: {
      id: 'mock-6',
      name: 'Dar es Salaam Shopping Mall',
      location: 'Mikocheni, Dar es Salaam, Tanzania',
      token_id: '0.0.678901',
      token_symbol: 'DARES',
      status: 'tokenized',
      yield_rate: '11.8%',
      images: ['https://images.unsplash.com/photo-1519643381401-22c77e60520e?w=800']
    },
    stats: {
      volume_24h: 38000,
      trades_24h: 19,
      change_24h: 4.1,
      last_price: 57.60,
      best_bid: 57.20,
      best_ask: 57.90,
      spread: 0.70
    },
    orderBook: {
      bids: [
        { price_per_token: 57.20, total_amount: 550, order_count: 3 },
        { price_per_token: 56.90, total_amount: 700, order_count: 5 }
      ],
      asks: [
        { price_per_token: 57.90, total_amount: 480, order_count: 3 },
        { price_per_token: 58.20, total_amount: 620, order_count: 4 }
      ],
      spread: 0.70,
      mid_price: 57.55
    },
    recentTrades: [
      { id: '1', token_amount: 190, price_per_token: 57.60, total_price: 10944, completed_at: new Date(Date.now() - 6 * 60000).toISOString() }
    ]
  }
};

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

      // Check if this is a mock property
      if (propertyId.startsWith('mock-') && MOCK_DATA[propertyId]) {
        const mockData = MOCK_DATA[propertyId];
        setProperty(mockData.property as Property);
        setStats(mockData.stats as MarketplaceStatistics);
        setOrderBook(mockData.orderBook as OrderBook);
        setRecentTrades(mockData.recentTrades as MarketplaceTrade[]);
      } else {
        // Fetch real property with token_id from treasury
        const { data: propertyData } = await supabase
          .from('properties')
          .select(`
            *,
            treasury:property_treasury_accounts(token_id)
          `)
          .eq('id', propertyId)
          .single();

        if (!propertyData) {
          router.push('/marketplace');
          return;
        }

        // Merge token_id from treasury into property object
        const propertyWithToken = {
          ...propertyData,
          token_id: propertyData.treasury?.[0]?.token_id || propertyData.token_id
        };

        setProperty(propertyWithToken as Property);

        // Fetch market data
        await Promise.all([
          fetchStatistics(),
          fetchOrderBook(),
          fetchRecentTrades()
        ]);
      }

    } catch (error) {
      console.error('Error initializing marketplace page:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    // Skip for mock data
    if (propertyId.startsWith('mock-')) return;
    
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
    // Skip for mock data
    if (propertyId.startsWith('mock-')) return;
    
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
    // Skip for mock data
    if (propertyId.startsWith('mock-')) return;
    
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
                {propertyId.startsWith('mock-') && (
                  <>
                    <span>›</span>
                    <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-xs font-semibold">
                      ✨ Demo
                    </span>
                  </>
                )}
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

