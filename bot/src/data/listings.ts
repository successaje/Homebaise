export interface Listing {
  id: string;
  name: string;
  category: 'property' | 'agriculture' | 'community';
  type: string;
  location: string;
  country: string;
  summary: string;
  targetAmount: number;
  fundedPercent: number;
  yieldRate: number;
  developer: string;
  slug?: string;
}

export const propertyListings: Listing[] = [
  {
    id: 'prop-lagos-harbor',
    name: 'Lagos Harbor Residences',
    category: 'property',
    type: 'Residential',
    location: 'Lekki Phase 1, Lagos',
    country: 'Nigeria',
    summary: '71-unit waterfront development with serviced apartments and co-working hub.',
    targetAmount: 1800000,
    fundedPercent: 58,
    yieldRate: 14.5,
    developer: 'Coastal Build Africa',
    slug: 'lagos-harbor-residences',
  },
  {
    id: 'prop-kigali-tech-park',
    name: 'Kigali Innovation Suites',
    category: 'property',
    type: 'Commercial',
    location: 'Kigali Innovation City',
    country: 'Rwanda',
    summary: 'Flexible office suites for startups with direct access to Kigali Innovation City.',
    targetAmount: 2200000,
    fundedPercent: 62,
    yieldRate: 12.0,
    developer: 'East African Smart Properties',
    slug: 'kigali-innovation-suites',
  },
  {
    id: 'prop-accra-solar',
    name: 'Accra Solar Estate',
    category: 'property',
    type: 'Mixed-Use',
    location: 'East Legon, Accra',
    country: 'Ghana',
    summary: 'Net-zero, solar-powered estate with retail, residential, and wellness amenities.',
    targetAmount: 2500000,
    fundedPercent: 47,
    yieldRate: 15.2,
    developer: 'SunRise Build Partners',
    slug: 'accra-solar-estate',
  },
];

export const agricultureListings: Listing[] = [
  {
    id: 'agri-kenya-rice',
    name: 'Kisumu Rice Farm Expansion',
    category: 'agriculture',
    type: 'Rice Farming',
    location: 'Kisumu County',
    country: 'Kenya',
    summary: 'Modern irrigation upgrade for 500 hectares of premium Kenyan rice.',
    targetAmount: 1200000,
    fundedPercent: 75,
    yieldRate: 18,
    developer: 'Lake Victoria Growers Co-op',
  },
  {
    id: 'agri-ghana-cocoa',
    name: 'Ghana Cocoa Cooperative',
    category: 'agriculture',
    type: 'Cocoa Farming',
    location: 'Ashanti Region',
    country: 'Ghana',
    summary: 'Fair-trade certified cocoa production with export guarantees.',
    targetAmount: 2000000,
    fundedPercent: 60,
    yieldRate: 15,
    developer: 'Ashanti Farmers Union',
  },
  {
    id: 'agri-uganda-vanilla',
    name: 'Uganda Vanilla Collective',
    category: 'agriculture',
    type: 'Vanilla Farming',
    location: 'Kampala Region',
    country: 'Uganda',
    summary: 'Premium vanilla cultivation with direct-to-market supply chain.',
    targetAmount: 900000,
    fundedPercent: 30,
    yieldRate: 22,
    developer: 'Vanilla Growers Network',
  },
];

export const communityListings: Listing[] = [
  {
    id: 'comm-hub-accra',
    name: 'Accra Community Hub',
    category: 'community',
    type: 'Social Infrastructure',
    location: 'Osu, Accra',
    country: 'Ghana',
    summary: 'Shared community space with vocational training labs and micro-retail pods.',
    targetAmount: 650000,
    fundedPercent: 41,
    yieldRate: 9,
    developer: 'Impact Works Africa',
  },
  {
    id: 'comm-health-nairobi',
    name: 'Nairobi Health Campus',
    category: 'community',
    type: 'Healthcare',
    location: 'Kilimani, Nairobi',
    country: 'Kenya',
    summary: 'Primary care and diagnostic center with affordable tele-health services.',
    targetAmount: 950000,
    fundedPercent: 52,
    yieldRate: 10.5,
    developer: 'Healthy Cities Trust',
  },
  {
    id: 'comm-market-lusaka',
    name: 'Lusaka Smart Market',
    category: 'community',
    type: 'Marketplace',
    location: 'Garden Park, Lusaka',
    country: 'Zambia',
    summary: 'Digitized artisan market with blockchain inventory tracking and cold storage.',
    targetAmount: 720000,
    fundedPercent: 38,
    yieldRate: 11.2,
    developer: 'ZamTrade Collective',
  },
];

export interface MarketplaceListing {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  seller: string;
  category: 'primary' | 'secondary';
}

export const marketplaceListings: MarketplaceListing[] = [
  {
    id: 'mkt-secondary-lagos',
    title: 'Lagos Harbor Series A Tokens',
    description: '2,500 fractional tokens from an early investor in Lagos Harbor Residences.',
    price: 105,
    currency: 'USD',
    seller: 'Investor #8842',
    category: 'secondary',
  },
  {
    id: 'mkt-primary-vanilla',
    title: 'Uganda Vanilla Collective - Season B',
    description: 'Fresh issue supporting expansion to 200 hectares of vanilla cultivation.',
    price: 45,
    currency: 'USD',
    seller: 'Vanilla Growers Network',
    category: 'primary',
  },
  {
    id: 'mkt-secondary-kigali',
    title: 'Kigali Innovation Suites Tokens',
    description: '1,200 tokens available from a corporate holder diversifying their portfolio.',
    price: 118,
    currency: 'USD',
    seller: 'Rwanda Tech Fund',
    category: 'secondary',
  },
];

export interface DeveloperProfile {
  id: string;
  name: string;
  focus: string;
  headline: string;
  followers: number;
  activeProjects: number;
}

export const developerProfiles: DeveloperProfile[] = [
  {
    id: 'dev-coastal-build',
    name: 'Coastal Build Africa',
    focus: 'Waterfront and sustainable residential developments',
    headline: 'Delivering net-zero coastal communities across West Africa.',
    followers: 1840,
    activeProjects: 3,
  },
  {
    id: 'dev-sunrise-build',
    name: 'SunRise Build Partners',
    focus: 'Solar-enabled mixed-use estates and smart retail hubs',
    headline: 'Championing renewable-powered, smart real estate.',
    followers: 2125,
    activeProjects: 4,
  },
  {
    id: 'dev-impact-works',
    name: 'Impact Works Africa',
    focus: 'Community health, education, and artisan market infrastructure',
    headline: 'People-first infrastructure for resilient African communities.',
    followers: 1670,
    activeProjects: 5,
  },
];

export interface TokenPair {
  pair: string;
  lastPrice: number;
  change24h: number;
  volume24h: number;
  status: 'bullish' | 'bearish' | 'neutral';
}

export const tokenPairs: TokenPair[] = [
  {
    pair: 'LHR/USDT',
    lastPrice: 112.5,
    change24h: 3.2,
    volume24h: 185000,
    status: 'bullish',
  },
  {
    pair: 'KIS/USDT',
    lastPrice: 97.8,
    change24h: -1.4,
    volume24h: 94000,
    status: 'bearish',
  },
  {
    pair: 'UGV/USDT',
    lastPrice: 54.1,
    change24h: 0.6,
    volume24h: 47600,
    status: 'neutral',
  },
];

