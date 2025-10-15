'use client';

import { useState } from 'react';
import Link from 'next/link';
import MagneticEffect from '@/components/MagneticEffect';
import ScrollAnimations from '@/components/ScrollAnimations';
import { formatCurrency, formatNumber, getCountryFlag } from '@/lib/utils';

interface MarketListing {
  id: string;
  propertyId: string;
  propertyName: string;
  propertyType: string;
  location: string;
  country: string;
  tokenPrice: number;
  marketPrice: number;
  priceChange: number;
  priceChangePercent: number;
  tokensAvailable: number;
  totalTokens: number;
  volume24h: number;
  volumeChange: number;
  yieldRate: string;
  marketCap: number;
  liquidity: number;
  seller: {
    name: string;
    rating: number;
    verified: boolean;
    avatar: string;
  };
  listingType: 'buy' | 'sell';
  minOrder: number;
  maxOrder: number;
  expiresAt: string;
  status: 'active' | 'filled' | 'expired' | 'cancelled';
}

interface MarketStats {
  totalVolume: number;
  volumeChange: number;
  activeListings: number;
  totalMarketCap: number;
  averageYield: string;
  topGainers: MarketListing[];
  topLosers: MarketListing[];
}

// Mock market listings
const marketListings: MarketListing[] = [
  {
    id: '1',
    propertyId: 'prop-1',
    propertyName: 'Lagos Luxury Apartments',
    propertyType: 'Residential',
    location: 'Lagos, Nigeria',
    country: 'Nigeria',
    tokenPrice: 50,
    marketPrice: 52.50,
    priceChange: 2.50,
    priceChangePercent: 5.0,
    tokensAvailable: 5000,
    totalTokens: 10000,
    volume24h: 125000,
    volumeChange: 15.5,
    yieldRate: '12% APY',
    marketCap: 525000,
    liquidity: 262500,
    seller: {
      name: 'John Doe',
      rating: 4.8,
      verified: true,
      avatar: '/images/users/john-doe.jpg'
    },
    listingType: 'sell',
    minOrder: 100,
    maxOrder: 5000,
    expiresAt: '2024-12-31T23:59:59Z',
    status: 'active'
  },
  {
    id: '2',
    propertyId: 'prop-2',
    propertyName: 'Nairobi Office Complex',
    propertyType: 'Commercial',
    location: 'Nairobi, Kenya',
    country: 'Kenya',
    tokenPrice: 75,
    marketPrice: 71.25,
    priceChange: -3.75,
    priceChangePercent: -5.0,
    tokensAvailable: 3000,
    totalTokens: 8000,
    volume24h: 89000,
    volumeChange: -8.2,
    yieldRate: '15% APY',
    marketCap: 570000,
    liquidity: 213750,
    seller: {
      name: 'Sarah Muthoni',
      rating: 4.9,
      verified: true,
      avatar: '/images/users/sarah-muthoni.jpg'
    },
    listingType: 'buy',
    minOrder: 150,
    maxOrder: 3000,
    expiresAt: '2024-12-31T23:59:59Z',
    status: 'active'
  },
  {
    id: '3',
    propertyId: 'prop-3',
    propertyName: 'Accra Shopping Mall',
    propertyType: 'Retail',
    location: 'Accra, Ghana',
    country: 'Ghana',
    tokenPrice: 60,
    marketPrice: 63.00,
    priceChange: 3.00,
    priceChangePercent: 5.0,
    tokensAvailable: 4000,
    totalTokens: 12000,
    volume24h: 156000,
    volumeChange: 22.1,
    yieldRate: '18% APY',
    marketCap: 756000,
    liquidity: 252000,
    seller: {
      name: 'Kwame Asante',
      rating: 4.7,
      verified: true,
      avatar: '/images/users/kwame-asante.jpg'
    },
    listingType: 'sell',
    minOrder: 120,
    maxOrder: 4000,
    expiresAt: '2024-12-31T23:59:59Z',
    status: 'active'
  },
  {
    id: '4',
    propertyId: 'prop-4',
    propertyName: 'Kampala Industrial Park',
    propertyType: 'Industrial',
    location: 'Kampala, Uganda',
    country: 'Uganda',
    tokenPrice: 40,
    marketPrice: 38.00,
    priceChange: -2.00,
    priceChangePercent: -5.0,
    tokensAvailable: 6000,
    totalTokens: 15000,
    volume24h: 95000,
    volumeChange: -12.5,
    yieldRate: '14% APY',
    marketCap: 570000,
    liquidity: 228000,
    seller: {
      name: 'David Muwonge',
      rating: 4.6,
      verified: false,
      avatar: '/images/users/david-muwonge.jpg'
    },
    listingType: 'buy',
    minOrder: 80,
    maxOrder: 6000,
    expiresAt: '2024-12-31T23:59:59Z',
    status: 'active'
  },
  {
    id: '5',
    propertyId: 'prop-5',
    propertyName: 'Dar es Salaam Hotel',
    propertyType: 'Hospitality',
    location: 'Dar es Salaam, Tanzania',
    country: 'Tanzania',
    tokenPrice: 80,
    marketPrice: 84.00,
    priceChange: 4.00,
    priceChangePercent: 5.0,
    tokensAvailable: 2500,
    totalTokens: 6000,
    volume24h: 168000,
    volumeChange: 18.7,
    yieldRate: '20% APY',
    marketCap: 504000,
    liquidity: 210000,
    seller: {
      name: 'Ahmed Mwinyi',
      rating: 4.8,
      verified: true,
      avatar: '/images/users/ahmed-mwinyi.jpg'
    },
    listingType: 'sell',
    minOrder: 160,
    maxOrder: 2500,
    expiresAt: '2024-12-31T23:59:59Z',
    status: 'active'
  },
  {
    id: '6',
    propertyId: 'prop-6',
    propertyName: 'Addis Ababa Mixed-Use',
    propertyType: 'Mixed-Use',
    location: 'Addis Ababa, Ethiopia',
    country: 'Ethiopia',
    tokenPrice: 55,
    marketPrice: 57.75,
    priceChange: 2.75,
    priceChangePercent: 5.0,
    tokensAvailable: 3500,
    totalTokens: 9000,
    volume24h: 112000,
    volumeChange: 9.3,
    yieldRate: '16% APY',
    marketCap: 519750,
    liquidity: 202125,
    seller: {
      name: 'Tigist Haile',
      rating: 4.9,
      verified: true,
      avatar: '/images/users/tigist-haile.jpg'
    },
    listingType: 'sell',
    minOrder: 110,
    maxOrder: 3500,
    expiresAt: '2024-12-31T23:59:59Z',
    status: 'active'
  }
];

// Mock market stats
const marketStats: MarketStats = {
  totalVolume: 745000,
  volumeChange: 8.2,
  activeListings: 156,
  totalMarketCap: 3444750,
  averageYield: '15.8%',
  topGainers: marketListings.filter(l => l.priceChangePercent > 0).slice(0, 3),
  topLosers: marketListings.filter(l => l.priceChangePercent < 0).slice(0, 3)
};

export default function MarketPage() {
  const [selectedPropertyType, setSelectedPropertyType] = useState<string>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedListingType, setSelectedListingType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('volume');
  const [searchQuery, setSearchQuery] = useState('');

  const propertyTypes = ['all', 'Residential', 'Commercial', 'Retail', 'Industrial', 'Hospitality', 'Mixed-Use'];
  const countries = ['all', 'Nigeria', 'Kenya', 'Ghana', 'Uganda', 'Tanzania', 'Ethiopia', 'Rwanda'];
  const listingTypes = ['all', 'buy', 'sell'];
  const sortOptions = [
    { value: 'volume', label: 'Volume' },
    { value: 'price', label: 'Price' },
    { value: 'change', label: 'Price Change' },
    { value: 'yield', label: 'Yield Rate' },
    { value: 'marketCap', label: 'Market Cap' }
  ];

  const filteredListings = marketListings.filter(listing => {
    const matchesType = selectedPropertyType === 'all' || listing.propertyType === selectedPropertyType;
    const matchesCountry = selectedCountry === 'all' || listing.country === selectedCountry;
    const matchesListingType = selectedListingType === 'all' || listing.listingType === selectedListingType;
    const matchesSearch = listing.propertyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         listing.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesCountry && matchesListingType && matchesSearch;
  });

  const sortedListings = [...filteredListings].sort((a, b) => {
    switch (sortBy) {
      case 'volume':
        return b.volume24h - a.volume24h;
      case 'price':
        return b.marketPrice - a.marketPrice;
      case 'change':
        return b.priceChangePercent - a.priceChangePercent;
      case 'yield':
        return parseFloat(b.yieldRate) - parseFloat(a.yieldRate);
      case 'marketCap':
        return b.marketCap - a.marketCap;
      default:
        return 0;
    }
  });

  const getPriceChangeColor = (change: number) => {
    return change >= 0 ? 'text-emerald-400' : 'text-red-400';
  };

  const getPriceChangeIcon = (change: number) => {
    return change >= 0 ? '↗️' : '↘️';
  };

  const getListingTypeColor = (type: string) => {
    return type === 'buy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20';
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
              <span className="text-xl font-bold text-white">Homebaise</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/properties" className="text-gray-300 hover:text-white">Properties</Link>
              <Link href="/agriculture" className="text-gray-300 hover:text-white">Agriculture</Link>
              <Link href="/community" className="text-gray-300 hover:text-white">Community</Link>
              <Link href="/market" className="text-emerald-400 font-medium">Market</Link>
              <Link href="/portfolio" className="text-gray-300 hover:text-white">Portfolio</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollAnimations animationType="fade-in-up">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-white mb-4">Secondary Market</h1>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Trade property tokens instantly with other investors. Buy, sell, and diversify your real estate portfolio
              </p>
            </div>

            {/* Market Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <div className="text-2xl mb-2">📊</div>
                <div className="text-2xl font-bold text-white">{formatCurrency(marketStats.totalVolume)}</div>
                <div className="text-gray-400 text-sm">24h Volume</div>
                <div className={`text-sm ${marketStats.volumeChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {marketStats.volumeChange >= 0 ? '+' : ''}{marketStats.volumeChange}%
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <div className="text-2xl mb-2">📈</div>
                <div className="text-2xl font-bold text-white">{marketStats.activeListings}</div>
                <div className="text-gray-400 text-sm">Active Listings</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <div className="text-2xl mb-2">💰</div>
                <div className="text-2xl font-bold text-white">{formatCurrency(marketStats.totalMarketCap)}</div>
                <div className="text-gray-400 text-sm">Total Market Cap</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <div className="text-2xl mb-2">🎯</div>
                <div className="text-2xl font-bold text-emerald-400">{marketStats.averageYield}</div>
                <div className="text-gray-400 text-sm">Average Yield</div>
              </div>
            </div>

            {/* Top Movers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Top Gainers */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">🔥 Top Gainers</h3>
                <div className="space-y-3">
                  {marketStats.topGainers.map((listing) => (
                    <div key={listing.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full flex items-center justify-center">
                          <span className="text-sm">🏢</span>
                        </div>
                        <div>
                          <div className="text-white text-sm font-medium">{listing.propertyName}</div>
                          <div className="text-gray-400 text-xs">{listing.location}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-emerald-400 font-semibold">+{listing.priceChangePercent}%</div>
                        <div className="text-white text-sm">{formatCurrency(listing.marketPrice)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Losers */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">📉 Top Losers</h3>
                <div className="space-y-3">
                  {marketStats.topLosers.map((listing) => (
                    <div key={listing.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-full flex items-center justify-center">
                          <span className="text-sm">🏢</span>
                        </div>
                        <div>
                          <div className="text-white text-sm font-medium">{listing.propertyName}</div>
                          <div className="text-gray-400 text-xs">{listing.location}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-red-400 font-semibold">{listing.priceChangePercent}%</div>
                        <div className="text-white text-sm">{formatCurrency(listing.marketPrice)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search properties..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <MagneticEffect>
                  <button className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 hover-lift">
                    Create Listing
                  </button>
                </MagneticEffect>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <select
                  value={selectedPropertyType}
                  onChange={(e) => setSelectedPropertyType(e.target.value)}
                  className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {propertyTypes.map((type) => (
                    <option key={type} value={type}>
                      {type === 'all' ? 'All Types' : type}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {countries.map((country) => (
                    <option key={country} value={country}>
                      {country === 'all' ? 'All Countries' : country}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedListingType}
                  onChange={(e) => setSelectedListingType(e.target.value)}
                  className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {listingTypes.map((type) => (
                    <option key={type} value={type}>
                      {type === 'all' ? 'All Orders' : type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      Sort by {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Market Listings */}
            <div className="space-y-4">
              {sortedListings.map((listing) => (
                // <MagneticEffect key={listing.id}>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 hover-lift">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                      {/* Property Info */}
                      <div className="lg:col-span-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl flex items-center justify-center">
                            <span className="text-lg">🏢</span>
                          </div>
                          <div>
                            <h3 className="text-white font-semibold">{listing.propertyName}</h3>
                            <p className="text-gray-400 text-sm">{listing.location}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-xs bg-white/10 px-2 py-1 rounded-full text-gray-300">
                                {listing.propertyType}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded-full border ${getListingTypeColor(listing.listingType)}`}>
                                {listing.listingType.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Price Info */}
                      <div className="lg:col-span-2">
                        <div className="text-center">
                          <div className="text-white font-semibold">{formatCurrency(listing.marketPrice)}</div>
                          <div className={`text-sm flex items-center justify-center ${getPriceChangeColor(listing.priceChangePercent)}`}>
                            <span className="mr-1">{getPriceChangeIcon(listing.priceChangePercent)}</span>
                            {listing.priceChangePercent >= 0 ? '+' : ''}{listing.priceChangePercent}%
                          </div>
                          <div className="text-gray-400 text-xs">${listing.priceChange.toFixed(2)}</div>
                        </div>
                      </div>

                      {/* Volume & Market Cap */}
                      <div className="lg:col-span-2">
                        <div className="text-center">
                          <div className="text-white font-semibold">{formatCurrency(listing.volume24h)}</div>
                          <div className="text-gray-400 text-xs">24h Volume</div>
                          <div className={`text-xs ${listing.volumeChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {listing.volumeChange >= 0 ? '+' : ''}{listing.volumeChange}%
                          </div>
                        </div>
                      </div>

                      {/* Yield & Liquidity */}
                      <div className="lg:col-span-2">
                        <div className="text-center">
                          <div className="text-emerald-400 font-semibold">{listing.yieldRate}</div>
                          <div className="text-gray-400 text-xs">Yield Rate</div>
                          <div className="text-white text-xs">{formatCurrency(listing.liquidity)}</div>
                        </div>
                      </div>

                      {/* Available Tokens */}
                      <div className="lg:col-span-2">
                        <div className="text-center">
                          <div className="text-white font-semibold">{listing.tokensAvailable.toLocaleString()}</div>
                          <div className="text-gray-400 text-xs">Available Tokens</div>
                          <div className="text-white text-xs">{formatCurrency(listing.marketCap)}</div>
                        </div>
                      </div>

                      {/* Action */}
                      <div className="lg:col-span-1">
                        <div className="flex flex-col space-y-2">
                          <MagneticEffect>
                            <button className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300">
                              {listing.listingType === 'buy' ? 'Buy' : 'Sell'}
                            </button>
                          </MagneticEffect>
                          <button className="text-gray-400 text-sm hover:text-white transition-colors">
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                // {/* </MagneticEffect> */}
              ))}
            </div>

            {sortedListings.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-semibold text-white mb-2">No listings found</h3>
                <p className="text-gray-400">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            )}

            {/* Market Features */}
            <div className="mt-16 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">Market Features</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl mb-3">⚡</div>
                  <h3 className="text-white font-semibold mb-2">Instant Trading</h3>
                  <p className="text-gray-400 text-sm">Buy and sell property tokens instantly with no waiting periods</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-3">🔒</div>
                  <h3 className="text-white font-semibold mb-2">Secure Transactions</h3>
                  <p className="text-gray-400 text-sm">All trades are secured with blockchain technology and smart contracts</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-3">📊</div>
                  <h3 className="text-white font-semibold mb-2">Real-time Data</h3>
                  <p className="text-gray-400 text-sm">Live market data, price charts, and trading volume updates</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-3">💼</div>
                  <h3 className="text-white font-semibold mb-2">Portfolio Management</h3>
                  <p className="text-gray-400 text-sm">Track your investments and manage your real estate portfolio</p>
                </div>
              </div>
            </div>
          </ScrollAnimations>
        </div>
      </div>
    </div>
  );
} 