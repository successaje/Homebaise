'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Property } from '@/types/property';
import { MarketplaceStatistics } from '@/types/marketplace';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatNumber, getPropertyTypeLabel } from '@/lib/utils';

interface PropertyWithStats extends Property {
  stats?: MarketplaceStatistics;
}

// Mock data for demonstration
const MOCK_PROPERTIES: PropertyWithStats[] = [
  {
    id: 'mock-1',
    name: 'Lagos Luxury Apartments',
    title: 'Lagos Luxury Apartments',
    description: 'Premium residential complex in Victoria Island',
    location: 'Victoria Island, Lagos, Nigeria',
    property_type: 'residential',
    total_value: 2500000,
    funded_amount_usd: 1875000,
    funded_percent: 75,
    yield_rate: '8.5%',
    status: 'tokenized',
    images: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800'],
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    token_id: '0.0.123456',
    token_symbol: 'LAGOS',
    token_name: 'Lagos Luxury Token',
    token_decimals: 2,
    token_type: 'FUNGIBLE',
    treasury_account_id: '0.0.123457',
    treasury_private_key: null,
    listed_by: 'admin',
    stats: {
      id: 'stat-1',
      property_id: 'mock-1',
      volume_24h: 45000,
      trades_24h: 23,
      high_24h: 52.50,
      low_24h: 48.20,
      change_24h: 5.2,
      volume_7d: 180000,
      trades_7d: 89,
      total_volume: 850000,
      total_trades: 340,
      last_price: 51.75,
      best_bid: 51.50,
      best_ask: 52.00,
      spread: 0.50,
      total_buy_orders: 12,
      total_sell_orders: 8,
      buy_order_volume: 15000,
      sell_order_volume: 12000,
      updated_at: new Date().toISOString()
    }
  },
  {
    id: 'mock-2',
    name: 'Nairobi Commercial Plaza',
    title: 'Nairobi Commercial Plaza',
    description: 'Modern office space in Westlands business district',
    location: 'Westlands, Nairobi, Kenya',
    property_type: 'commercial',
    total_value: 3200000,
    funded_amount_usd: 2880000,
    funded_percent: 90,
    yield_rate: '12.3%',
    status: 'tokenized',
    images: ['https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800'],
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    token_id: '0.0.234567',
    token_symbol: 'NRBI',
    token_name: 'Nairobi Plaza Token',
    token_decimals: 2,
    token_type: 'FUNGIBLE',
    treasury_account_id: '0.0.234568',
    treasury_private_key: null,
    listed_by: 'admin',
    stats: {
      id: 'stat-2',
      property_id: 'mock-2',
      volume_24h: 67000,
      trades_24h: 34,
      high_24h: 78.90,
      low_24h: 74.10,
      change_24h: 3.8,
      volume_7d: 290000,
      trades_7d: 145,
      total_volume: 1200000,
      total_trades: 567,
      last_price: 77.25,
      best_bid: 76.90,
      best_ask: 77.50,
      spread: 0.60,
      total_buy_orders: 18,
      total_sell_orders: 15,
      buy_order_volume: 22000,
      sell_order_volume: 18000,
      updated_at: new Date().toISOString()
    }
  },
  {
    id: 'mock-3',
    name: 'Cape Town Beachfront',
    title: 'Cape Town Beachfront',
    description: 'Exclusive beachfront property with ocean views',
    location: 'Camps Bay, Cape Town, South Africa',
    property_type: 'residential',
    total_value: 4500000,
    funded_amount_usd: 2700000,
    funded_percent: 60,
    yield_rate: '6.8%',
    status: 'tokenized',
    images: ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800'],
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    token_id: '0.0.345678',
    token_symbol: 'CAPE',
    token_name: 'Cape Beach Token',
    token_decimals: 2,
    token_type: 'FUNGIBLE',
    treasury_account_id: '0.0.345679',
    treasury_private_key: null,
    listed_by: 'admin',
    stats: {
      id: 'stat-3',
      property_id: 'mock-3',
      volume_24h: 28000,
      trades_24h: 15,
      high_24h: 95.50,
      low_24h: 92.00,
      change_24h: -1.5,
      volume_7d: 95000,
      trades_7d: 48,
      total_volume: 95000,
      total_trades: 48,
      last_price: 93.20,
      best_bid: 92.80,
      best_ask: 93.60,
      spread: 0.80,
      total_buy_orders: 7,
      total_sell_orders: 5,
      buy_order_volume: 8000,
      sell_order_volume: 6500,
      updated_at: new Date().toISOString()
    }
  },
  {
    id: 'mock-4',
    name: 'Accra Tech Hub',
    title: 'Accra Tech Hub',
    description: 'Modern co-working and office space',
    location: 'Osu, Accra, Ghana',
    property_type: 'commercial',
    total_value: 1800000,
    funded_amount_usd: 1440000,
    funded_percent: 80,
    yield_rate: '10.5%',
    status: 'tokenized',
    images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=800'],
    created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    token_id: '0.0.456789',
    token_symbol: 'TECH',
    token_name: 'Accra Tech Token',
    token_decimals: 2,
    token_type: 'FUNGIBLE',
    treasury_account_id: '0.0.456790',
    treasury_private_key: null,
    listed_by: 'admin',
    stats: {
      id: 'stat-4',
      property_id: 'mock-4',
      volume_24h: 52000,
      trades_24h: 28,
      high_24h: 38.50,
      low_24h: 35.80,
      change_24h: 6.2,
      volume_7d: 210000,
      trades_7d: 112,
      total_volume: 680000,
      total_trades: 456,
      last_price: 37.90,
      best_bid: 37.60,
      best_ask: 38.10,
      spread: 0.50,
      total_buy_orders: 15,
      total_sell_orders: 11,
      buy_order_volume: 18000,
      sell_order_volume: 14000,
      updated_at: new Date().toISOString()
    }
  },
  {
    id: 'mock-5',
    name: 'Kigali Urban Residences',
    title: 'Kigali Urban Residences',
    description: 'Modern apartments in the heart of Kigali',
    location: 'Kigali City, Rwanda',
    property_type: 'residential',
    total_value: 1200000,
    funded_amount_usd: 840000,
    funded_percent: 70,
    yield_rate: '9.2%',
    status: 'tokenized',
    images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'],
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    token_id: '0.0.567890',
    token_symbol: 'KGLI',
    token_name: 'Kigali Urban Token',
    token_decimals: 2,
    token_type: 'FUNGIBLE',
    treasury_account_id: '0.0.567891',
    treasury_private_key: null,
    listed_by: 'admin',
    stats: {
      id: 'stat-5',
      property_id: 'mock-5',
      volume_24h: 15000,
      trades_24h: 8,
      high_24h: 26.80,
      low_24h: 25.20,
      change_24h: 2.1,
      volume_7d: 15000,
      trades_7d: 8,
      total_volume: 15000,
      total_trades: 8,
      last_price: 26.30,
      best_bid: 26.00,
      best_ask: 26.50,
      spread: 0.50,
      total_buy_orders: 5,
      total_sell_orders: 3,
      buy_order_volume: 5000,
      sell_order_volume: 3500,
      updated_at: new Date().toISOString()
    }
  },
  {
    id: 'mock-6',
    name: 'Dar es Salaam Shopping Mall',
    title: 'Dar es Salaam Shopping Mall',
    description: 'Prime retail space in busy shopping district',
    location: 'Mikocheni, Dar es Salaam, Tanzania',
    property_type: 'commercial',
    total_value: 2800000,
    funded_amount_usd: 2240000,
    funded_percent: 80,
    yield_rate: '11.8%',
    status: 'tokenized',
    images: ['https://images.unsplash.com/photo-1519643381401-22c77e60520e?w=800'],
    created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    token_id: '0.0.678901',
    token_symbol: 'DARES',
    token_name: 'DSM Mall Token',
    token_decimals: 2,
    token_type: 'FUNGIBLE',
    treasury_account_id: '0.0.678902',
    treasury_private_key: null,
    listed_by: 'admin',
    stats: {
      id: 'stat-6',
      property_id: 'mock-6',
      volume_24h: 38000,
      trades_24h: 19,
      high_24h: 58.20,
      low_24h: 55.50,
      change_24h: 4.1,
      volume_7d: 145000,
      trades_7d: 73,
      total_volume: 520000,
      total_trades: 267,
      last_price: 57.60,
      best_bid: 57.20,
      best_ask: 57.90,
      spread: 0.70,
      total_buy_orders: 10,
      total_sell_orders: 8,
      buy_order_volume: 12000,
      sell_order_volume: 9500,
      updated_at: new Date().toISOString()
    }
  }
];

export default function MarketplacePage() {
  const [properties, setProperties] = useState<PropertyWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'hot' | 'new'>('all');

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);

      // Fetch tokenized properties with token_id from treasury accounts
      const { data: propertiesData, error } = await supabase
        .from('properties')
        .select(`
          *,
          treasury:property_treasury_accounts!inner(token_id)
        `)
        .eq('status', 'tokenized')
        .order('created_at', { ascending: false });

      let realProperties: PropertyWithStats[] = [];

      if (!error && propertiesData && propertiesData.length > 0) {
        // Fetch statistics for each property
        realProperties = await Promise.all(
          propertiesData.map(async (property) => {
            try {
              const response = await fetch(`/api/marketplace/statistics?property_id=${property.id}`);
              const data = await response.json();
              return {
                ...property,
                token_id: property.treasury?.[0]?.token_id || property.token_id,
                stats: data.statistics
              };
            } catch (error) {
              return {
                ...property,
                token_id: property.treasury?.[0]?.token_id || property.token_id
              };
            }
          })
        );
      }

      // Combine real properties with mock data (mock data shown first for demo)
      const allProperties = [...MOCK_PROPERTIES, ...realProperties];
      setProperties(allProperties);

    } catch (error) {
      console.error('Error fetching properties:', error);
      // On error, just show mock data
      setProperties(MOCK_PROPERTIES);
    } finally {
      setLoading(false);
    }
  };

  const filteredProperties = properties.filter((property) => {
    if (filter === 'hot') {
      return property.stats && property.stats.volume_24h > 0;
    }
    if (filter === 'new') {
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return new Date(property.created_at) > dayAgo;
    }
    return true;
  });

  // Loading Skeleton Component
  const PropertyCardSkeleton = () => (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden animate-pulse">
      {/* Image Skeleton */}
      <div className="h-48 bg-gradient-to-br from-gray-700 to-gray-800"></div>
      
      {/* Content Skeleton */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-700 rounded w-3/4"></div>
          <div className="h-5 bg-gray-700 rounded w-16"></div>
        </div>
        <div className="h-4 bg-gray-700 rounded w-1/2"></div>
        <div className="h-8 bg-gray-700 rounded w-1/3"></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="h-12 bg-gray-700 rounded"></div>
          <div className="h-12 bg-gray-700 rounded"></div>
        </div>
        <div className="h-10 bg-emerald-600/50 rounded"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black">
      {/* Navigation */}
      <nav className="fixed w-full bg-black/80 backdrop-blur-xl border-b border-white/10 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <span className="text-xl font-bold text-white">Homebaise</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/marketplace" className="text-emerald-400 font-medium">Marketplace</Link>
              <Link href="/properties" className="text-gray-300 hover:text-white">Properties</Link>
              <Link href="/dashboard" className="text-gray-300 hover:text-white">Dashboard</Link>
              <Link href="/profile" className="text-gray-300 hover:text-white">Profile</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-24 pb-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          {/* Demo Badge */}
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-full px-4 py-2 mb-4">
            <span className="text-emerald-400 font-semibold text-sm">✨ Live Demo</span>
            <span className="text-gray-400 text-sm">•</span>
            <span className="text-gray-300 text-sm">Real-time trading simulation</span>
          </div>

          <h1 className="text-5xl font-bold text-white mb-4">
            Property Token Marketplace
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            Trade real estate tokens instantly on Hedera&apos;s lightning-fast network
          </p>
          
          {/* Stats Banner */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-8">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-9 bg-gray-700 rounded w-16 mb-2"></div>
                  <div className="h-4 bg-gray-700 rounded w-24"></div>
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold text-white">
                    {properties.length}
                  </div>
                  <div className="text-gray-400 text-sm">Listed Properties</div>
                </>
              )}
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-9 bg-gray-700 rounded w-20 mb-2"></div>
                  <div className="h-4 bg-gray-700 rounded w-20"></div>
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold text-emerald-400">
                    {properties.reduce((sum, p) => sum + (p.stats?.volume_24h || 0), 0).toLocaleString()}
                  </div>
                  <div className="text-gray-400 text-sm">24h Volume</div>
                </>
              )}
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-9 bg-gray-700 rounded w-12 mb-2"></div>
                  <div className="h-4 bg-gray-700 rounded w-16"></div>
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold text-white">
                    {properties.reduce((sum, p) => sum + (p.stats?.trades_24h || 0), 0)}
                  </div>
                  <div className="text-gray-400 text-sm">24h Trades</div>
                </>
              )}
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-9 bg-gray-700 rounded w-24 mb-2"></div>
                  <div className="h-4 bg-gray-700 rounded w-28"></div>
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold text-white">
                    {formatCurrency(properties.reduce((sum, p) => sum + (p.total_value || 0), 0))}
                  </div>
                  <div className="text-gray-400 text-sm">Total Market Cap</div>
                </>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="flex justify-center space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('hot')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                filter === 'hot'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              🔥 Hot
            </button>
            <button
              onClick={() => setFilter('new')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                filter === 'new'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              ✨ New
            </button>
          </div>
        </div>
      </div>

      {/* Properties Grid */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        {loading ? (
          /* Loading State with Skeletons */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <PropertyCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredProperties.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20">
            <div className="relative inline-block mb-6">
              <div className="text-8xl mb-4 animate-bounce">🏠</div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full animate-ping"></div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">
              {filter === 'hot' && 'No Hot Properties Yet'}
              {filter === 'new' && 'No New Listings Yet'}
              {filter === 'all' && 'No Properties Available'}
            </h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              {filter === 'hot' 
                ? 'Properties will appear here once trading activity picks up. Be the first to trade!' 
                : filter === 'new'
                ? 'New tokenized properties will appear here. Check back soon!'
                : 'Properties need to be tokenized before they can be traded on the marketplace.'}
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/properties"
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors"
              >
                Browse All Properties
              </Link>
              {filter !== 'all' && (
                <button
                  onClick={() => setFilter('all')}
                  className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg font-semibold transition-colors"
                >
                  View All Listings
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => {
              const change24h = property.stats?.change_24h || 0;
              const isPositive = change24h >= 0;

              return (
                <Link
                  key={property.id}
                  href={`/marketplace/${property.id}`}
                  className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 hover:border-emerald-500/50 transition-all group"
                >
                  {/* Image */}
                  <div className="relative h-48 bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
                    {property.images && property.images[0] ? (
                      <img
                        src={property.images[0]}
                        alt={property.name || 'Property'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl">
                        🏠
                      </div>
                    )}
                    {property.stats && property.stats.volume_24h > 0 && (
                      <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold animate-pulse">
                        🔥 Hot
                      </div>
                    )}
                    {property.id.startsWith('mock-') && (
                      <div className="absolute top-3 left-3 bg-blue-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold">
                        ✨ Demo
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                        {property.name || property.title}
                      </h3>
                      <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded">
                        {property.token_symbol || 'TOKEN'}
                      </span>
                    </div>

                    <p className="text-gray-400 text-sm mb-4">
                      📍 {property.location}
                    </p>

                    {/* Price Stats */}
                    <div className="mb-4">
                      <div className="flex items-baseline space-x-2 mb-1">
                        <span className="text-2xl font-bold text-white">
                          {property.stats?.last_price 
                            ? formatCurrency(property.stats.last_price)
                            : formatCurrency(property.token_price || 1)
                          }
                        </span>
                        {change24h !== 0 && (
                          <span className={`text-sm font-semibold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                            {isPositive ? '↑' : '↓'} {Math.abs(change24h).toFixed(2)}%
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">per token</div>
                    </div>

                    {/* Market Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-white/5 rounded-lg p-2">
                        <div className="text-xs text-gray-400 mb-1">24h Volume</div>
                        <div className="text-sm font-semibold text-white">
                          {formatNumber(property.stats?.volume_24h || 0)}
                        </div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2">
                        <div className="text-xs text-gray-400 mb-1">24h Trades</div>
                        <div className="text-sm font-semibold text-white">
                          {property.stats?.trades_24h || 0}
                        </div>
                      </div>
                    </div>

                    {/* Spread */}
                    {property.stats?.spread && (
                      <div className="flex justify-between text-xs mb-4">
                        <div>
                          <span className="text-gray-400">Bid: </span>
                          <span className="text-emerald-400 font-semibold">
                            {formatCurrency(property.stats.best_bid || 0)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Ask: </span>
                          <span className="text-red-400 font-semibold">
                            {formatCurrency(property.stats.best_ask || 0)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* CTA */}
                    <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-lg transition-colors">
                      Trade Now →
                    </button>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

