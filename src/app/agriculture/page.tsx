'use client';

import { useState } from 'react';
import Link from 'next/link';
import MagneticEffect from '@/components/MagneticEffect';
import ScrollAnimations from '@/components/ScrollAnimations';
import { formatCurrency, formatNumber, getCountryFlag } from '@/lib/utils';

interface AgriculturalProject {
  id: string;
  name: string;
  location: string;
  country: string;
  cropType: string;
  farmSize: string;
  totalValue: number;
  tokenPrice: number;
  fundedPercent: number;
  tokensTotal: number;
  tokensAvailable: number;
  yieldRate: string;
  expectedReturn: string;
  minInvestment: number;
  maxInvestment: number;
  description: string;
  longDescription: string;
  farmer: {
    name: string;
    experience: number;
    rating: number;
    totalFarms: number;
    successRate: number;
    avatar: string;
  };
  season: string;
  harvestDate: string;
  riskLevel: 'low' | 'medium' | 'high';
  sustainability: string[];
  certifications: string[];
  images: string[];
  status: 'active' | 'funded' | 'harvesting' | 'completed';
}

// Mock agricultural projects
const agriculturalProjects: AgriculturalProject[] = [
  {
    id: '1',
    name: 'Kisumu Rice Farm Expansion',
    location: 'Kisumu County, Kenya',
    country: 'Kenya',
    cropType: 'Rice',
    farmSize: '500 hectares',
    totalValue: 1200000,
    tokenPrice: 50,
    fundedPercent: 75,
    tokensTotal: 24000,
    tokensAvailable: 6000,
    yieldRate: '18% APY',
    expectedReturn: '22-28% annually',
    minInvestment: 500,
    maxInvestment: 50000,
    description: 'Expansion of premium rice cultivation with modern irrigation systems',
    longDescription: 'This project expands an existing successful rice farm with modern irrigation, improved seed varieties, and sustainable farming practices. The farm has a proven track record of high yields and strong market demand.',
    farmer: {
      name: 'John Otieno',
      experience: 15,
      rating: 4.8,
      totalFarms: 8,
      successRate: 95,
      avatar: '/images/farmers/john-otieno.jpg'
    },
    season: '2024 Rainy Season',
    harvestDate: '2024-12-15',
    riskLevel: 'medium',
    sustainability: ['Organic Farming', 'Water Conservation', 'Soil Health', 'Biodiversity'],
    certifications: ['Organic Certified', 'Fair Trade', 'Rainforest Alliance'],
    images: ['/images/farms/kisumu-rice-1.jpg', '/images/farms/kisumu-rice-2.jpg'],
    status: 'active'
  },
  {
    id: '2',
    name: 'Ghana Cocoa Cooperative',
    location: 'Ashanti Region, Ghana',
    country: 'Ghana',
    cropType: 'Cocoa',
    farmSize: '800 hectares',
    totalValue: 2000000,
    tokenPrice: 75,
    fundedPercent: 60,
    tokensTotal: 26667,
    tokensAvailable: 10667,
    yieldRate: '15% APY',
    expectedReturn: '18-25% annually',
    minInvestment: 750,
    maxInvestment: 75000,
    description: 'Premium cocoa production with fair trade certification',
    longDescription: 'This cooperative brings together 50 smallholder farmers to produce premium cocoa beans. The project includes training, modern equipment, and direct market access to international buyers.',
    farmer: {
      name: 'Kwame Asante',
      experience: 20,
      rating: 4.9,
      totalFarms: 12,
      successRate: 98,
      avatar: '/images/farmers/kwame-asante.jpg'
    },
    season: '2024 Main Season',
    harvestDate: '2024-11-30',
    riskLevel: 'low',
    sustainability: ['Fair Trade', 'Shade Grown', 'Natural Pest Control', 'Community Development'],
    certifications: ['Fair Trade', 'Organic', 'UTZ Certified'],
    images: ['/images/farms/ghana-cocoa-1.jpg', '/images/farms/ghana-cocoa-2.jpg'],
    status: 'active'
  },
  {
    id: '3',
    name: 'Nigerian Cassava Processing',
    location: 'Ondo State, Nigeria',
    country: 'Nigeria',
    cropType: 'Cassava',
    farmSize: '300 hectares',
    totalValue: 800000,
    tokenPrice: 40,
    fundedPercent: 90,
    tokensTotal: 20000,
    tokensAvailable: 2000,
    yieldRate: '20% APY',
    expectedReturn: '25-32% annually',
    minInvestment: 400,
    maxInvestment: 40000,
    description: 'Modern cassava farming with processing facility',
    longDescription: 'This project combines traditional cassava farming with modern processing technology. The facility produces cassava flour, starch, and other value-added products for both local and export markets.',
    farmer: {
      name: 'Aisha Bello',
      experience: 12,
      rating: 4.7,
      totalFarms: 6,
      successRate: 92,
      avatar: '/images/farmers/aisha-bello.jpg'
    },
    season: '2024 Growing Season',
    harvestDate: '2024-10-20',
    riskLevel: 'medium',
    sustainability: ['Water Efficient', 'Waste Reduction', 'Local Processing', 'Job Creation'],
    certifications: ['ISO 22000', 'HACCP', 'Local Organic'],
    images: ['/images/farms/nigerian-cassava-1.jpg', '/images/farms/nigerian-cassava-2.jpg'],
    status: 'active'
  },
  {
    id: '4',
    name: 'Tanzania Coffee Estate',
    location: 'Kilimanjaro Region, Tanzania',
    country: 'Tanzania',
    cropType: 'Coffee',
    farmSize: '200 hectares',
    totalValue: 1500000,
    tokenPrice: 60,
    fundedPercent: 45,
    tokensTotal: 25000,
    tokensAvailable: 13750,
    yieldRate: '16% APY',
    expectedReturn: '20-26% annually',
    minInvestment: 600,
    maxInvestment: 60000,
    description: 'High-altitude Arabica coffee with specialty certification',
    longDescription: 'Located on the slopes of Mount Kilimanjaro, this estate produces premium Arabica coffee beans. The high altitude and volcanic soil create unique flavor profiles highly sought after by specialty coffee buyers.',
    farmer: {
      name: 'Mama Sarah',
      experience: 25,
      rating: 4.9,
      totalFarms: 15,
      successRate: 96,
      avatar: '/images/farmers/mama-sarah.jpg'
    },
    season: '2024 Coffee Season',
    harvestDate: '2024-09-15',
    riskLevel: 'low',
    sustainability: ['Shade Grown', 'Bird Friendly', 'Water Conservation', 'Carbon Neutral'],
    certifications: ['Rainforest Alliance', 'Bird Friendly', 'Organic'],
    images: ['/images/farms/tanzania-coffee-1.jpg', '/images/farms/tanzania-coffee-2.jpg'],
    status: 'active'
  },
  {
    id: '5',
    name: 'Uganda Vanilla Project',
    location: 'Kampala Region, Uganda',
    country: 'Uganda',
    cropType: 'Vanilla',
    farmSize: '150 hectares',
    totalValue: 900000,
    tokenPrice: 45,
    fundedPercent: 30,
    tokensTotal: 20000,
    tokensAvailable: 14000,
    yieldRate: '22% APY',
    expectedReturn: '28-35% annually',
    minInvestment: 450,
    maxInvestment: 45000,
    description: 'Premium vanilla cultivation with international market access',
    longDescription: 'This project focuses on high-quality vanilla bean production using traditional hand-pollination methods. The vanilla is processed and sold directly to international buyers, bypassing middlemen.',
    farmer: {
      name: 'David Muwonge',
      experience: 18,
      rating: 4.6,
      totalFarms: 9,
      successRate: 89,
      avatar: '/images/farmers/david-muwonge.jpg'
    },
    season: '2024 Vanilla Season',
    harvestDate: '2024-08-30',
    riskLevel: 'high',
    sustainability: ['Traditional Methods', 'Hand Pollination', 'Natural Shade', 'Community Training'],
    certifications: ['Organic', 'Fair Trade', 'Vanilla Alliance'],
    images: ['/images/farms/uganda-vanilla-1.jpg', '/images/farms/uganda-vanilla-2.jpg'],
    status: 'active'
  }
];

export default function AgriculturePage() {
  const [selectedCrop, setSelectedCrop] = useState<string>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedRisk, setSelectedRisk] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const cropTypes = ['all', 'Rice', 'Cocoa', 'Cassava', 'Coffee', 'Vanilla', 'Maize', 'Wheat'];
  const countries = ['all', 'Kenya', 'Ghana', 'Nigeria', 'Tanzania', 'Uganda', 'Ethiopia', 'Rwanda'];
  const riskLevels = ['all', 'low', 'medium', 'high'];

  const filteredProjects = agriculturalProjects.filter(project => {
    const matchesCrop = selectedCrop === 'all' || project.cropType === selectedCrop;
    const matchesCountry = selectedCountry === 'all' || project.country === selectedCountry;
    const matchesRisk = selectedRisk === 'all' || project.riskLevel === selectedRisk;
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCrop && matchesCountry && matchesRisk && matchesSearch;
  });

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'high':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getCropIcon = (crop: string) => {
    switch (crop) {
      case 'Rice':
        return '🌾';
      case 'Cocoa':
        return '🍫';
      case 'Cassava':
        return '🥔';
      case 'Coffee':
        return '☕';
      case 'Vanilla':
        return '🌿';
      case 'Maize':
        return '🌽';
      case 'Wheat':
        return '🌾';
      default:
        return '🌱';
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
              <Link href="/agriculture" className="text-emerald-400 font-medium">Agriculture</Link>
              <Link href="/community" className="text-gray-300 hover:text-white">Community</Link>
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
              <h1 className="text-4xl font-bold text-white mb-4">Agricultural Investment</h1>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Invest in sustainable farming projects across Africa and support local farmers while earning attractive returns
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <div className="text-2xl mb-2">🌾</div>
                <div className="text-2xl font-bold text-white">5</div>
                <div className="text-gray-400 text-sm">Active Projects</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <div className="text-2xl mb-2">👨‍🌾</div>
                <div className="text-2xl font-bold text-white">5</div>
                <div className="text-gray-400 text-sm">Expert Farmers</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <div className="text-2xl mb-2">📈</div>
                <div className="text-2xl font-bold text-emerald-400">18.2%</div>
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
                    placeholder="Search agricultural projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <MagneticEffect>
                  <button className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 hover-lift">
                    Apply as Farmer
                  </button>
                </MagneticEffect>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select
                  value={selectedCrop}
                  onChange={(e) => setSelectedCrop(e.target.value)}
                  className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {cropTypes.map((crop) => (
                    <option key={crop} value={crop}>
                      {crop === 'all' ? 'All Crops' : crop}
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
                  value={selectedRisk}
                  onChange={(e) => setSelectedRisk(e.target.value)}
                  className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {riskLevels.map((risk) => (
                    <option key={risk} value={risk}>
                      {risk === 'all' ? 'All Risk Levels' : risk.charAt(0).toUpperCase() + risk.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <MagneticEffect key={project.id}>
                  <Link href={`/agriculture/${project.id}`}>
                    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 transition-all duration-300 hover-lift group">
                      {/* Project Image */}
                      <div className="h-48 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center relative">
                        <span className="text-6xl">{getCropIcon(project.cropType)}</span>
                        <div className="absolute top-4 right-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${getRiskColor(project.riskLevel)}`}>
                            {project.riskLevel} risk
                          </span>
                        </div>
                        <div className="absolute bottom-4 left-4">
                          <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1">
                            <div className="text-white text-sm font-medium">{project.fundedPercent}% Funded</div>
                            <div className="w-full bg-white/20 rounded-full h-1 mt-1">
                              <div
                                className="bg-emerald-500 h-1 rounded-full transition-all duration-300"
                                style={{ width: `${project.fundedPercent}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Project Details */}
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">
                              {project.name}
                            </h3>
                            <p className="text-gray-400 text-sm flex items-center">
                              <span className="mr-2">📍</span>
                              {project.location}
                            </p>
                          </div>
                          <span className="text-2xl ml-2">{getCropIcon(project.cropType)}</span>
                        </div>

                        <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                          {project.description}
                        </p>

                        {/* Farmer Info */}
                        <div className="flex items-center space-x-3 mb-4 p-3 bg-white/5 rounded-lg">
                          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full flex items-center justify-center">
                            <span className="text-sm">👨‍🌾</span>
                          </div>
                          <div className="flex-1">
                            <div className="text-white text-sm font-medium">{project.farmer.name}</div>
                            <div className="text-gray-400 text-xs">
                              {project.farmer.experience} years • {project.farmer.rating}⭐ • {project.farmer.successRate}% success
                            </div>
                          </div>
                        </div>

                        {/* Investment Details */}
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">Total Value</span>
                            <span className="text-white font-semibold">{formatNumber(project.totalValue)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">Token Price</span>
                            <span className="text-white font-semibold">${project.tokenPrice}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">Yield Rate</span>
                            <span className="text-emerald-400 font-semibold">{project.yieldRate}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">Available Tokens</span>
                            <span className="text-white font-semibold">{project.tokensAvailable.toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Investment Range */}
                        <div className="pt-4 border-t border-white/10">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">Investment Range</span>
                            <span className="text-white">
                              {formatCurrency(project.minInvestment)} - {formatCurrency(project.maxInvestment)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </MagneticEffect>
              ))}
            </div>

            {filteredProjects.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🌾</div>
                <h3 className="text-xl font-semibold text-white mb-2">No projects found</h3>
                <p className="text-gray-400">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            )}

            {/* Why Agricultural Investment */}
            <div className="mt-16 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">Why Invest in Agriculture?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl mb-3">📈</div>
                  <h3 className="text-white font-semibold mb-2">High Returns</h3>
                  <p className="text-gray-400 text-sm">Earn 15-35% annual returns from agricultural investments</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-3">🌱</div>
                  <h3 className="text-white font-semibold mb-2">Sustainable</h3>
                  <p className="text-gray-400 text-sm">Support environmentally friendly farming practices</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-3">👨‍🌾</div>
                  <h3 className="text-white font-semibold mb-2">Empower Farmers</h3>
                  <p className="text-gray-400 text-sm">Help local farmers access capital and modern technology</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-3">🌍</div>
                  <h3 className="text-white font-semibold mb-2">Food Security</h3>
                  <p className="text-gray-400 text-sm">Contribute to Africa&apos;s food security and economic growth</p>
                </div>
              </div>
            </div>
          </ScrollAnimations>
        </div>
      </div>
    </div>
  );
} 