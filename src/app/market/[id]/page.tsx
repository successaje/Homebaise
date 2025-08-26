'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import MagneticEffect from '@/components/MagneticEffect';
import ScrollAnimations from '@/components/ScrollAnimations';
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils';

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
    bio: string;
    totalSales: number;
    successRate: number;
  };
  listingType: 'buy' | 'sell';
  minOrder: number;
  maxOrder: number;
  expiresAt: string;
  status: 'active' | 'filled' | 'expired' | 'cancelled';
  propertyDetails: {
    description: string;
    features: string[];
    amenities: string[];
    images: string[];
    yearBuilt: number;
    squareFootage: number;
    bedrooms: number;
    bathrooms: number;
  };
  financials: {
    annualRent: number;
    operatingExpenses: number;
    netOperatingIncome: number;
    capRate: number;
    cashOnCashReturn: number;
  };
  marketData: {
    priceHistory: {
      date: string;
      price: number;
      volume: number;
    }[];
    tradingHistory: {
      date: string;
      type: 'buy' | 'sell';
      price: number;
      tokens: number;
      buyer: string;
      seller: string;
    }[];
    orderBook: {
      bids: {
        price: number;
        tokens: number;
        total: number;
      }[];
      asks: {
        price: number;
        tokens: number;
        total: number;
      }[];
    };
  };
}

// Mock market listings data
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
      avatar: '/images/users/john-doe.jpg',
      bio: 'Experienced real estate investor with over 10 years in the Nigerian market. Specializes in residential properties and has successfully completed 50+ transactions.',
      totalSales: 50,
      successRate: 98
    },
    listingType: 'sell',
    minOrder: 100,
    maxOrder: 5000,
    expiresAt: '2024-12-31T23:59:59Z',
    status: 'active',
    propertyDetails: {
      description: 'Premium luxury apartment complex located in the heart of Lagos. Features modern amenities, 24/7 security, and stunning city views. Perfect for both residential and investment purposes.',
      features: [
        'Modern architecture with premium finishes',
        '24/7 security and concierge service',
        'Swimming pool and fitness center',
        'Underground parking',
        'High-speed internet and smart home features'
      ],
      amenities: [
        'Swimming Pool',
        'Fitness Center',
        'Concierge Service',
        'Underground Parking',
        'High-Speed Internet',
        'Smart Home Features',
        'Garden Area',
        'BBQ Facilities'
      ],
      images: ['/images/properties/lagos-apartments-1.jpg', '/images/properties/lagos-apartments-2.jpg'],
      yearBuilt: 2022,
      squareFootage: 2500,
      bedrooms: 3,
      bathrooms: 2
    },
    financials: {
      annualRent: 60000,
      operatingExpenses: 15000,
      netOperatingIncome: 45000,
      capRate: 8.6,
      cashOnCashReturn: 12.0
    },
    marketData: {
      priceHistory: [
        { date: '2024-01-01', price: 50.00, volume: 1000 },
        { date: '2024-01-15', price: 51.25, volume: 1500 },
        { date: '2024-02-01', price: 52.50, volume: 2000 },
        { date: '2024-02-15', price: 53.75, volume: 1800 },
        { date: '2024-03-01', price: 52.50, volume: 2200 }
      ],
      tradingHistory: [
        { date: '2024-03-01', type: 'buy', price: 52.50, tokens: 100, buyer: 'Alice Smith', seller: 'John Doe' },
        { date: '2024-02-28', type: 'sell', price: 53.75, tokens: 50, buyer: 'Bob Johnson', seller: 'Alice Smith' },
        { date: '2024-02-27', type: 'buy', price: 53.75, tokens: 200, buyer: 'Carol Wilson', seller: 'John Doe' }
      ],
      orderBook: {
        bids: [
          { price: 52.00, tokens: 500, total: 26000 },
          { price: 51.50, tokens: 750, total: 38625 },
          { price: 51.00, tokens: 1000, total: 51000 }
        ],
        asks: [
          { price: 53.00, tokens: 300, total: 15900 },
          { price: 53.50, tokens: 450, total: 24075 },
          { price: 54.00, tokens: 600, total: 32400 }
        ]
      }
    }
  }
];

export default function MarketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [listing, setListing] = useState<MarketListing | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [tradeAmount, setTradeAmount] = useState('');

  useEffect(() => {
    const listingId = params.id as string;
    const foundListing = marketListings.find(l => l.id === listingId);
    
    if (foundListing) {
      setListing(foundListing);
    } else {
      router.push('/market');
    }
  }, [params.id, router]);

  const getPriceChangeColor = (change: number) => {
    return change >= 0 ? 'text-emerald-400' : 'text-red-400';
  };

  const getPriceChangeIcon = (change: number) => {
    return change >= 0 ? '↗️' : '↘️';
  };

  const getListingTypeColor = (type: string) => {
    return type === 'buy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20';
  };

  const calculateTradeValue = () => {
    const amount = parseFloat(tradeAmount) || 0;
    return amount * (listing?.marketPrice || 0);
  };

  if (!listing) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

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
            {/* Breadcrumb */}
            <div className="mb-8">
              <nav className="flex items-center space-x-2 text-sm text-gray-400">
                <Link href="/" className="hover:text-white transition-colors">Home</Link>
                <span>→</span>
                <Link href="/market" className="hover:text-white transition-colors">Market</Link>
                <span>→</span>
                <span className="text-white">{listing.propertyName}</span>
              </nav>
            </div>

            {/* Listing Header */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
              {/* Main Content */}
              <div className="lg:col-span-2">
                <div className="mb-6">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/10 text-gray-300 border border-white/20">
                    {listing.propertyType}
                  </span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ml-2 ${getListingTypeColor(listing.listingType)}`}>
                    {listing.listingType.toUpperCase()}
                  </span>
                </div>
                
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                  {listing.propertyName}
                </h1>
                
                <p className="text-xl text-gray-400 mb-8 leading-relaxed">
                  {listing.propertyDetails.description}
                </p>

                {/* Price Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-white">{formatCurrency(listing.marketPrice)}</div>
                    <div className="text-gray-400 text-sm">Market Price</div>
                    <div className={`text-sm flex items-center justify-center ${getPriceChangeColor(listing.priceChangePercent)}`}>
                      <span className="mr-1">{getPriceChangeIcon(listing.priceChangePercent)}</span>
                      {listing.priceChangePercent >= 0 ? '+' : ''}{listing.priceChangePercent}%
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-emerald-400">{listing.yieldRate}</div>
                    <div className="text-gray-400 text-sm">Yield Rate</div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-white">{formatCurrency(listing.volume24h)}</div>
                    <div className="text-gray-400 text-sm">24h Volume</div>
                    <div className={`text-sm ${listing.volumeChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {listing.volumeChange >= 0 ? '+' : ''}{listing.volumeChange}%
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-white">{listing.tokensAvailable.toLocaleString()}</div>
                    <div className="text-gray-400 text-sm">Available Tokens</div>
                  </div>
                </div>

                {/* Trade CTA */}
                <MagneticEffect>
                  <button
                    onClick={() => setShowTradeModal(true)}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 hover-lift"
                  >
                    {listing.listingType === 'buy' ? 'Buy Tokens' : 'Sell Tokens'} - {formatCurrency(listing.minOrder)} Min
                  </button>
                </MagneticEffect>
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sticky top-24">
                  <h3 className="text-lg font-bold text-white mb-4">Trading Summary</h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Market Price</span>
                      <span className="text-white font-semibold">{formatCurrency(listing.marketPrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Price Change</span>
                      <span className={`font-semibold ${getPriceChangeColor(listing.priceChangePercent)}`}>
                        {listing.priceChangePercent >= 0 ? '+' : ''}{listing.priceChangePercent}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Min Order</span>
                      <span className="text-white font-semibold">{formatCurrency(listing.minOrder)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Max Order</span>
                      <span className="text-white font-semibold">{formatCurrency(listing.maxOrder)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Market Cap</span>
                      <span className="text-white font-semibold">{formatCurrency(listing.marketCap)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Liquidity</span>
                      <span className="text-emerald-400 font-semibold">{formatCurrency(listing.liquidity)}</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-white/10">
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-gray-400">Available Tokens</span>
                      <span className="text-white">{listing.tokensAvailable.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(listing.tokensAvailable / listing.totalTokens) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Property Images */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">Property Gallery</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {listing.propertyDetails.images.map((image, index) => (
                  <div
                    key={index}
                    className={`h-48 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl flex items-center justify-center cursor-pointer transition-all ${
                      selectedImage === index ? 'ring-2 ring-emerald-500' : 'hover:bg-emerald-500/30'
                    }`}
                    onClick={() => setSelectedImage(index)}
                  >
                    <span className="text-4xl">🏢</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Seller Profile */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">Seller Profile</h2>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-start space-x-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full flex items-center justify-center">
                    <span className="text-2xl">👤</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-bold text-white">{listing.seller.name}</h3>
                      {listing.seller.verified && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          ✓ Verified
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 mb-4">{listing.seller.bio}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-emerald-400">{listing.seller.rating}⭐</div>
                        <div className="text-gray-400 text-sm">Rating</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">{listing.seller.totalSales}</div>
                        <div className="text-gray-400 text-sm">Total Sales</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-emerald-400">{listing.seller.successRate}%</div>
                        <div className="text-gray-400 text-sm">Success Rate</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Property Details */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">Property Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Property Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Year Built</span>
                      <span className="text-white">{listing.propertyDetails.yearBuilt}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Square Footage</span>
                      <span className="text-white">{listing.propertyDetails.squareFootage.toLocaleString()} sq ft</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Bedrooms</span>
                      <span className="text-white">{listing.propertyDetails.bedrooms}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Bathrooms</span>
                      <span className="text-white">{listing.propertyDetails.bathrooms}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Financial Metrics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Annual Rent</span>
                      <span className="text-white">{formatCurrency(listing.financials.annualRent)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Operating Expenses</span>
                      <span className="text-white">{formatCurrency(listing.financials.operatingExpenses)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Cap Rate</span>
                      <span className="text-emerald-400">{listing.financials.capRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Cash on Cash Return</span>
                      <span className="text-emerald-400">{listing.financials.cashOnCashReturn}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Features & Amenities */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">Features & Amenities</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Key Features</h3>
                  <ul className="space-y-2">
                    {listing.propertyDetails.features.map((feature, index) => (
                      <li key={index} className="flex items-center space-x-2 text-gray-300">
                        <span className="text-emerald-400">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Amenities</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {listing.propertyDetails.amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center space-x-2 text-gray-300">
                        <span className="text-emerald-400">🏊</span>
                        <span className="text-sm">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Order Book */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">Order Book</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-emerald-400 mb-4">Bids (Buy Orders)</h3>
                  <div className="space-y-2">
                    {listing.marketData.orderBook.bids.map((bid, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-emerald-500/10 rounded-lg">
                        <span className="text-emerald-400 font-semibold">{formatCurrency(bid.price)}</span>
                        <span className="text-white">{bid.tokens.toLocaleString()} tokens</span>
                        <span className="text-gray-400">{formatCurrency(bid.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-red-400 mb-4">Asks (Sell Orders)</h3>
                  <div className="space-y-2">
                    {listing.marketData.orderBook.asks.map((ask, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-red-500/10 rounded-lg">
                        <span className="text-red-400 font-semibold">{formatCurrency(ask.price)}</span>
                        <span className="text-white">{ask.tokens.toLocaleString()} tokens</span>
                        <span className="text-gray-400">{formatCurrency(ask.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Trades */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">Recent Trades</h2>
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="space-y-3">
                  {listing.marketData.tradingHistory.map((trade, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className={`text-sm px-2 py-1 rounded-full ${
                          trade.type === 'buy' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {trade.type.toUpperCase()}
                        </span>
                        <span className="text-white font-semibold">{formatCurrency(trade.price)}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-white">{trade.tokens.toLocaleString()} tokens</div>
                        <div className="text-gray-400 text-sm">{formatDate(trade.date)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollAnimations>
        </div>
      </div>
    </div>
  );
} 