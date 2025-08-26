'use client';

import { useState } from 'react';
import Link from 'next/link';
import MagneticEffect from '@/components/MagneticEffect';
import ScrollAnimations from '@/components/ScrollAnimations';
import { formatCurrency, formatNumber, getCountryFlag } from '@/lib/utils';

interface CommunityPool {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  location: string;
  country: string;
  category: 'housing' | 'infrastructure' | 'education' | 'healthcare' | 'renewable' | 'tourism';
  totalValue: number;
  tokenPrice: number;
  fundedPercent: number;
  tokensTotal: number;
  tokensAvailable: number;
  minInvestment: number;
  maxInvestment: number;
  yieldRate: string;
  expectedReturn: string;
  communityMembers: number;
  maxMembers: number;
  status: 'forming' | 'active' | 'funded' | 'completed';
  startDate: string;
  endDate: string;
  benefits: string[];
  requirements: string[];
  leader: {
    name: string;
    role: string;
    experience: number;
    rating: number;
    avatar: string;
  };
  milestones: {
    title: string;
    description: string;
    target: number;
    current: number;
    status: 'pending' | 'in-progress' | 'completed';
  }[];
  images: string[];
}

// Mock community pools
const communityPools: CommunityPool[] = [
  {
    id: '1',
    name: 'Lagos Affordable Housing Initiative',
    description: 'Building affordable housing for low-income families in Lagos',
    longDescription: 'This community-driven project aims to build 500 affordable housing units for low-income families in Lagos. The project includes community centers, schools, and healthcare facilities.',
    location: 'Lagos, Nigeria',
    country: 'Nigeria',
    category: 'housing',
    totalValue: 5000000,
    tokenPrice: 25,
    fundedPercent: 65,
    tokensTotal: 200000,
    tokensAvailable: 70000,
    minInvestment: 250,
    maxInvestment: 25000,
    yieldRate: '12% APY',
    expectedReturn: '15-20% annually',
    communityMembers: 342,
    maxMembers: 500,
    status: 'active',
    startDate: '2024-01-15',
    endDate: '2024-12-31',
    benefits: [
      'Affordable housing for families',
      'Community development',
      'Job creation',
      'Social impact returns'
    ],
    requirements: [
      'KYC verification required',
      'Minimum investment: $250',
      'Community participation encouraged'
    ],
    leader: {
      name: 'Dr. Adebayo Johnson',
      role: 'Community Development Expert',
      experience: 15,
      rating: 4.9,
      avatar: '/images/leaders/adebayo-johnson.jpg'
    },
    milestones: [
      {
        title: 'Land Acquisition',
        description: 'Secure land for housing development',
        target: 1000000,
        current: 1000000,
        status: 'completed'
      },
      {
        title: 'Infrastructure Development',
        description: 'Build roads, water, and electricity',
        target: 1500000,
        current: 1200000,
        status: 'in-progress'
      },
      {
        title: 'Housing Construction',
        description: 'Build 500 housing units',
        target: 2500000,
        current: 0,
        status: 'pending'
      }
    ],
    images: ['/images/community/lagos-housing-1.jpg', '/images/community/lagos-housing-2.jpg']
  },
  {
    id: '2',
    name: 'Nairobi Solar Energy Cooperative',
    description: 'Community-owned solar energy project for rural electrification',
    longDescription: 'This cooperative brings together community members to invest in solar energy infrastructure, providing clean electricity to rural areas while generating returns for investors.',
    location: 'Nairobi, Kenya',
    country: 'Kenya',
    category: 'renewable',
    totalValue: 2000000,
    tokenPrice: 20,
    fundedPercent: 45,
    tokensTotal: 100000,
    tokensAvailable: 55000,
    minInvestment: 200,
    maxInvestment: 20000,
    yieldRate: '14% APY',
    expectedReturn: '18-25% annually',
    communityMembers: 156,
    maxMembers: 300,
    status: 'active',
    startDate: '2024-02-01',
    endDate: '2024-11-30',
    benefits: [
      'Clean energy access',
      'Reduced electricity costs',
      'Environmental impact',
      'Technology transfer'
    ],
    requirements: [
      'KYC verification required',
      'Minimum investment: $200',
      'Community meeting attendance'
    ],
    leader: {
      name: 'Sarah Muthoni',
      role: 'Renewable Energy Specialist',
      experience: 12,
      rating: 4.8,
      avatar: '/images/leaders/sarah-muthoni.jpg'
    },
    milestones: [
      {
        title: 'Site Survey',
        description: 'Complete site assessment and planning',
        target: 200000,
        current: 200000,
        status: 'completed'
      },
      {
        title: 'Equipment Procurement',
        description: 'Purchase solar panels and equipment',
        target: 800000,
        current: 600000,
        status: 'in-progress'
      },
      {
        title: 'Installation',
        description: 'Install solar infrastructure',
        target: 1000000,
        current: 0,
        status: 'pending'
      }
    ],
    images: ['/images/community/nairobi-solar-1.jpg', '/images/community/nairobi-solar-2.jpg']
  },
  {
    id: '3',
    name: 'Accra Education Hub',
    description: 'Modern educational facility for underserved communities',
    longDescription: 'This community investment will build a state-of-the-art educational facility including classrooms, libraries, computer labs, and sports facilities for underserved communities in Accra.',
    location: 'Accra, Ghana',
    country: 'Ghana',
    category: 'education',
    totalValue: 3000000,
    tokenPrice: 30,
    fundedPercent: 30,
    tokensTotal: 100000,
    tokensAvailable: 70000,
    minInvestment: 300,
    maxInvestment: 30000,
    yieldRate: '10% APY',
    expectedReturn: '12-18% annually',
    communityMembers: 89,
    maxMembers: 200,
    status: 'forming',
    startDate: '2024-03-01',
    endDate: '2024-12-31',
    benefits: [
      'Quality education access',
      'Skill development',
      'Community empowerment',
      'Long-term social impact'
    ],
    requirements: [
      'KYC verification required',
      'Minimum investment: $300',
      'Educational background check'
    ],
    leader: {
      name: 'Prof. Kwame Mensah',
      role: 'Education Consultant',
      experience: 20,
      rating: 4.7,
      avatar: '/images/leaders/kwame-mensah.jpg'
    },
    milestones: [
      {
        title: 'Land Acquisition',
        description: 'Secure land for educational facility',
        target: 500000,
        current: 300000,
        status: 'in-progress'
      },
      {
        title: 'Design and Planning',
        description: 'Complete architectural design',
        target: 200000,
        current: 0,
        status: 'pending'
      },
      {
        title: 'Construction',
        description: 'Build educational facility',
        target: 2300000,
        current: 0,
        status: 'pending'
      }
    ],
    images: ['/images/community/accra-education-1.jpg', '/images/community/accra-education-2.jpg']
  },
  {
    id: '4',
    name: 'Kampala Healthcare Center',
    description: 'Community-owned healthcare facility with modern equipment',
    longDescription: 'This project will establish a comprehensive healthcare center serving the local community with modern medical equipment, qualified staff, and affordable healthcare services.',
    location: 'Kampala, Uganda',
    country: 'Uganda',
    category: 'healthcare',
    totalValue: 1500000,
    tokenPrice: 15,
    fundedPercent: 80,
    tokensTotal: 100000,
    tokensAvailable: 20000,
    minInvestment: 150,
    maxInvestment: 15000,
    yieldRate: '11% APY',
    expectedReturn: '14-20% annually',
    communityMembers: 245,
    maxMembers: 300,
    status: 'active',
    startDate: '2024-01-01',
    endDate: '2024-10-31',
    benefits: [
      'Accessible healthcare',
      'Modern medical facilities',
      'Community health programs',
      'Employment opportunities'
    ],
    requirements: [
      'KYC verification required',
      'Minimum investment: $150',
      'Health background check'
    ],
    leader: {
      name: 'Dr. Grace Nakimera',
      role: 'Healthcare Administrator',
      experience: 18,
      rating: 4.9,
      avatar: '/images/leaders/grace-nakimera.jpg'
    },
    milestones: [
      {
        title: 'Facility Construction',
        description: 'Build healthcare center',
        target: 800000,
        current: 800000,
        status: 'completed'
      },
      {
        title: 'Equipment Installation',
        description: 'Install medical equipment',
        target: 400000,
        current: 300000,
        status: 'in-progress'
      },
      {
        title: 'Staff Recruitment',
        description: 'Hire qualified medical staff',
        target: 300000,
        current: 0,
        status: 'pending'
      }
    ],
    images: ['/images/community/kampala-healthcare-1.jpg', '/images/community/kampala-healthcare-2.jpg']
  },
  {
    id: '5',
    name: 'Dar es Salaam Tourism Hub',
    description: 'Community-driven tourism development project',
    longDescription: 'This project will develop a tourism hub including hotels, restaurants, cultural centers, and recreational facilities, creating jobs and promoting local culture.',
    location: 'Dar es Salaam, Tanzania',
    country: 'Tanzania',
    category: 'tourism',
    totalValue: 4000000,
    tokenPrice: 40,
    fundedPercent: 25,
    tokensTotal: 100000,
    tokensAvailable: 75000,
    minInvestment: 400,
    maxInvestment: 40000,
    yieldRate: '16% APY',
    expectedReturn: '20-28% annually',
    communityMembers: 67,
    maxMembers: 150,
    status: 'forming',
    startDate: '2024-03-15',
    endDate: '2024-12-31',
    benefits: [
      'Tourism development',
      'Cultural preservation',
      'Job creation',
      'Economic growth'
    ],
    requirements: [
      'KYC verification required',
      'Minimum investment: $400',
      'Tourism industry knowledge preferred'
    ],
    leader: {
      name: 'Ahmed Mwinyi',
      role: 'Tourism Development Expert',
      experience: 14,
      rating: 4.6,
      avatar: '/images/leaders/ahmed-mwinyi.jpg'
    },
    milestones: [
      {
        title: 'Market Research',
        description: 'Complete tourism market analysis',
        target: 100000,
        current: 100000,
        status: 'completed'
      },
      {
        title: 'Land Development',
        description: 'Develop tourism infrastructure',
        target: 1500000,
        current: 500000,
        status: 'in-progress'
      },
      {
        title: 'Facility Construction',
        description: 'Build tourism facilities',
        target: 2400000,
        current: 0,
        status: 'pending'
      }
    ],
    images: ['/images/community/dar-tourism-1.jpg', '/images/community/dar-tourism-2.jpg']
  }
];

export default function CommunityPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'all', label: 'All Categories', icon: '🏘️' },
    { id: 'housing', label: 'Housing', icon: '🏠' },
    { id: 'infrastructure', label: 'Infrastructure', icon: '🏗️' },
    { id: 'education', label: 'Education', icon: '🎓' },
    { id: 'healthcare', label: 'Healthcare', icon: '🏥' },
    { id: 'renewable', label: 'Renewable Energy', icon: '☀️' },
    { id: 'tourism', label: 'Tourism', icon: '🏖️' }
  ];

  const countries = ['all', 'Nigeria', 'Kenya', 'Ghana', 'Uganda', 'Tanzania', 'Ethiopia', 'Rwanda'];
  const statuses = ['all', 'forming', 'active', 'funded', 'completed'];

  const filteredPools = communityPools.filter(pool => {
    const matchesCategory = selectedCategory === 'all' || pool.category === selectedCategory;
    const matchesCountry = selectedCountry === 'all' || pool.country === selectedCountry;
    const matchesStatus = selectedStatus === 'all' || pool.status === selectedStatus;
    const matchesSearch = pool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         pool.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesCountry && matchesStatus && matchesSearch;
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'housing':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'infrastructure':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'education':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'healthcare':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'renewable':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'tourism':
        return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'forming':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'active':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'funded':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'completed':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
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
              <Link href="/community" className="text-emerald-400 font-medium">Community</Link>
              <Link href="/market" className="text-gray-300 hover:text-white">Market</Link>
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
              <h1 className="text-4xl font-bold text-white mb-4">Community Investment Pools</h1>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Join community-driven investment opportunities and create positive social impact while earning returns
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <div className="text-2xl mb-2">👥</div>
                <div className="text-2xl font-bold text-white">5</div>
                <div className="text-gray-400 text-sm">Active Pools</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <div className="text-2xl mb-2">🏘️</div>
                <div className="text-2xl font-bold text-white">899</div>
                <div className="text-gray-400 text-sm">Community Members</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <div className="text-2xl mb-2">📈</div>
                <div className="text-2xl font-bold text-emerald-400">12.6%</div>
                <div className="text-gray-400 text-sm">Average APY</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <div className="text-2xl mb-2">🌍</div>
                <div className="text-2xl font-bold text-white">5</div>
                <div className="text-gray-400 text-sm">Countries</div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search community pools..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <MagneticEffect>
                  <button className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 hover-lift">
                    Create Pool
                  </button>
                </MagneticEffect>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.label}
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
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pools Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPools.map((pool) => (
                <MagneticEffect key={pool.id}>
                  <Link href={`/community/${pool.id}`}>
                    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 transition-all duration-300 hover-lift group">
                      {/* Pool Image */}
                      <div className="h-48 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center relative">
                        <span className="text-6xl">{categories.find(c => c.id === pool.category)?.icon}</span>
                        <div className="absolute top-4 right-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${getStatusColor(pool.status)}`}>
                            {pool.status}
                          </span>
                        </div>
                        <div className="absolute bottom-4 left-4">
                          <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1">
                            <div className="text-white text-sm font-medium">{pool.fundedPercent}% Funded</div>
                            <div className="w-full bg-white/20 rounded-full h-1 mt-1">
                              <div
                                className="bg-emerald-500 h-1 rounded-full transition-all duration-300"
                                style={{ width: `${pool.fundedPercent}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Pool Details */}
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">
                              {pool.name}
                            </h3>
                            <p className="text-gray-400 text-sm flex items-center">
                              <span className="mr-2">📍</span>
                              {pool.location}
                            </p>
                          </div>
                          <span className="text-2xl ml-2">{categories.find(c => c.id === pool.category)?.icon}</span>
                        </div>

                        <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                          {pool.description}
                        </p>

                        {/* Community Info */}
                        <div className="flex items-center justify-between mb-4 p-3 bg-white/5 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full flex items-center justify-center">
                              <span className="text-sm">👥</span>
                            </div>
                            <div>
                              <div className="text-white text-sm font-medium">{pool.communityMembers}/{pool.maxMembers}</div>
                              <div className="text-gray-400 text-xs">Community Members</div>
                            </div>
                          </div>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${getCategoryColor(pool.category)}`}>
                            {pool.category}
                          </span>
                        </div>

                        {/* Investment Details */}
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">Total Value</span>
                            <span className="text-white font-semibold">{formatNumber(pool.totalValue)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">Token Price</span>
                            <span className="text-white font-semibold">${pool.tokenPrice}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">Yield Rate</span>
                            <span className="text-emerald-400 font-semibold">{pool.yieldRate}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">Available Tokens</span>
                            <span className="text-white font-semibold">{pool.tokensAvailable.toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Investment Range */}
                        <div className="pt-4 border-t border-white/10">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">Investment Range</span>
                            <span className="text-white">
                              {formatCurrency(pool.minInvestment)} - {formatCurrency(pool.maxInvestment)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </MagneticEffect>
              ))}
            </div>

            {filteredPools.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">👥</div>
                <h3 className="text-xl font-semibold text-white mb-2">No community pools found</h3>
                <p className="text-gray-400">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            )}

            {/* Why Community Investment */}
            <div className="mt-16 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">Why Community Investment?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl mb-3">🤝</div>
                  <h3 className="text-white font-semibold mb-2">Collective Impact</h3>
                  <p className="text-gray-400 text-sm">Pool resources with community members for greater impact</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-3">💡</div>
                  <h3 className="text-white font-semibold mb-2">Local Knowledge</h3>
                  <p className="text-gray-400 text-sm">Benefit from community expertise and local insights</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-3">🌱</div>
                  <h3 className="text-white font-semibold mb-2">Sustainable Growth</h3>
                  <p className="text-gray-400 text-sm">Support projects that benefit the entire community</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-3">📈</div>
                  <h3 className="text-white font-semibold mb-2">Shared Returns</h3>
                  <p className="text-gray-400 text-sm">Earn returns while creating positive social impact</p>
                </div>
              </div>
            </div>
          </ScrollAnimations>
        </div>
      </div>
    </div>
  );
} 