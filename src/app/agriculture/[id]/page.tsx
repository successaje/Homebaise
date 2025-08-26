'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import MagneticEffect from '@/components/MagneticEffect';
import ScrollAnimations from '@/components/ScrollAnimations';
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils';

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
    bio: string;
    achievements: string[];
  };
  season: string;
  harvestDate: string;
  riskLevel: 'low' | 'medium' | 'high';
  sustainability: string[];
  certifications: string[];
  images: string[];
  status: 'active' | 'funded' | 'harvesting' | 'completed';
  financials: {
    projectedRevenue: number;
    operatingCosts: number;
    netProfit: number;
    profitMargin: number;
  };
  timeline: {
    phase: string;
    description: string;
    startDate: string;
    endDate: string;
    status: 'completed' | 'in-progress' | 'upcoming';
    budget: number;
  }[];
  marketAnalysis: {
    demand: string;
    supply: string;
    priceTrend: string;
    competition: string;
  };
}

// Mock agricultural projects data
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
      avatar: '/images/farmers/john-otieno.jpg',
      bio: 'John Otieno is a seasoned rice farmer with over 15 years of experience in large-scale rice cultivation. He has successfully managed multiple farms across Kenya and has been recognized for his innovative farming techniques and sustainable practices.',
      achievements: [
        'Best Rice Farmer Award 2023 - Kenya Agricultural Society',
        'Sustainable Farming Excellence Award 2022',
        'Increased yield by 40% through modern irrigation techniques',
        'Mentored 50+ young farmers in sustainable practices'
      ]
    },
    season: '2024 Rainy Season',
    harvestDate: '2024-12-15',
    riskLevel: 'medium',
    sustainability: ['Organic Farming', 'Water Conservation', 'Soil Health', 'Biodiversity'],
    certifications: ['Organic Certified', 'Fair Trade', 'Rainforest Alliance'],
    images: ['/images/farms/kisumu-rice-1.jpg', '/images/farms/kisumu-rice-2.jpg'],
    status: 'active',
    financials: {
      projectedRevenue: 1800000,
      operatingCosts: 800000,
      netProfit: 1000000,
      profitMargin: 55.6
    },
    timeline: [
      {
        phase: 'Land Preparation',
        description: 'Soil testing, land clearing, and irrigation system installation',
        startDate: '2024-01-01',
        endDate: '2024-02-28',
        status: 'completed',
        budget: 150000
      },
      {
        phase: 'Planting Season',
        description: 'Seed planting and initial crop management',
        startDate: '2024-03-01',
        endDate: '2024-04-30',
        status: 'completed',
        budget: 200000
      },
      {
        phase: 'Growth & Maintenance',
        description: 'Crop monitoring, pest control, and irrigation management',
        startDate: '2024-05-01',
        endDate: '2024-11-30',
        status: 'in-progress',
        budget: 300000
      },
      {
        phase: 'Harvest & Processing',
        description: 'Rice harvesting, processing, and market preparation',
        startDate: '2024-12-01',
        endDate: '2024-12-31',
        status: 'upcoming',
        budget: 150000
      }
    ],
    marketAnalysis: {
      demand: 'High and growing demand for premium rice in East Africa',
      supply: 'Limited supply of high-quality rice in the region',
      priceTrend: 'Stable upward trend due to population growth and urbanization',
      competition: 'Moderate competition from imported rice, but local premium rice has competitive advantage'
    }
  }
];

export default function AgricultureDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<AgriculturalProject | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showInvestmentModal, setShowInvestmentModal] = useState(false);

  useEffect(() => {
    const projectId = params.id as string;
    const foundProject = agriculturalProjects.find(p => p.id === projectId);
    
    if (foundProject) {
      setProject(foundProject);
    } else {
      router.push('/agriculture');
    }
  }, [params.id, router]);

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
      default:
        return '🌱';
    }
  };

  const getTimelineStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'in-progress':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'upcoming':
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  if (!project) {
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
            {/* Breadcrumb */}
            <div className="mb-8">
              <nav className="flex items-center space-x-2 text-sm text-gray-400">
                <Link href="/" className="hover:text-white transition-colors">Home</Link>
                <span>→</span>
                <Link href="/agriculture" className="hover:text-white transition-colors">Agriculture</Link>
                <span>→</span>
                <span className="text-white">{project.name}</span>
              </nav>
            </div>

            {/* Project Header */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
              {/* Main Content */}
              <div className="lg:col-span-2">
                <div className="mb-6">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {project.cropType}
                  </span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ml-2 ${getRiskColor(project.riskLevel)}`}>
                    {project.riskLevel} risk
                  </span>
                </div>
                
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                  {project.name}
                </h1>
                
                <p className="text-xl text-gray-400 mb-8 leading-relaxed">
                  {project.longDescription}
                </p>

                {/* Project Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-white">{formatNumber(project.totalValue)}</div>
                    <div className="text-gray-400 text-sm">Total Value</div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-emerald-400">{project.yieldRate}</div>
                    <div className="text-gray-400 text-sm">Yield Rate</div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-white">{project.fundedPercent}%</div>
                    <div className="text-gray-400 text-sm">Funded</div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-white">{project.tokensAvailable.toLocaleString()}</div>
                    <div className="text-gray-400 text-sm">Available Tokens</div>
                  </div>
                </div>

                {/* Investment CTA */}
                <MagneticEffect>
                  <button
                    onClick={() => setShowInvestmentModal(true)}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 hover-lift"
                  >
                    Invest Now - Starting from {formatCurrency(project.minInvestment)}
                  </button>
                </MagneticEffect>
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sticky top-24">
                  <h3 className="text-lg font-bold text-white mb-4">Investment Summary</h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Token Price</span>
                      <span className="text-white font-semibold">${project.tokenPrice}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Min Investment</span>
                      <span className="text-white font-semibold">{formatCurrency(project.minInvestment)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Max Investment</span>
                      <span className="text-white font-semibold">{formatCurrency(project.maxInvestment)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Expected Return</span>
                      <span className="text-emerald-400 font-semibold">{project.expectedReturn}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Harvest Date</span>
                      <span className="text-white font-semibold">{formatDate(project.harvestDate)}</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-white/10">
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-gray-400">Funding Progress</span>
                      <span className="text-white">{project.fundedPercent}%</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${project.fundedPercent}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Project Images */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">Project Gallery</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {project.images.map((image, index) => (
                  <div
                    key={index}
                    className={`h-48 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl flex items-center justify-center cursor-pointer transition-all ${
                      selectedImage === index ? 'ring-2 ring-emerald-500' : 'hover:bg-emerald-500/30'
                    }`}
                    onClick={() => setSelectedImage(index)}
                  >
                    <span className="text-4xl">{getCropIcon(project.cropType)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Farmer Profile */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">Farmer Profile</h2>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-start space-x-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full flex items-center justify-center">
                    <span className="text-2xl">👨‍🌾</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">{project.farmer.name}</h3>
                    <p className="text-gray-400 mb-4">{project.farmer.bio}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">{project.farmer.experience}</div>
                        <div className="text-gray-400 text-sm">Years Experience</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-emerald-400">{project.farmer.rating}⭐</div>
                        <div className="text-gray-400 text-sm">Rating</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">{project.farmer.totalFarms}</div>
                        <div className="text-gray-400 text-sm">Total Farms</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-emerald-400">{project.farmer.successRate}%</div>
                        <div className="text-gray-400 text-sm">Success Rate</div>
                      </div>
                    </div>

                    <h4 className="text-lg font-semibold text-white mb-3">Achievements</h4>
                    <ul className="space-y-2">
                      {project.farmer.achievements.map((achievement, index) => (
                        <li key={index} className="flex items-center space-x-2 text-gray-300">
                          <span className="text-emerald-400">✓</span>
                          <span>{achievement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Project Timeline */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">Project Timeline</h2>
              <div className="space-y-4">
                {project.timeline.map((phase, index) => (
                  <div key={index} className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">{phase.phase}</h3>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${getTimelineStatusColor(phase.status)}`}>
                        {phase.status}
                      </span>
                    </div>
                    <p className="text-gray-400 mb-4">{phase.description}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{formatDate(phase.startDate)} - {formatDate(phase.endDate)}</span>
                      <span>{formatCurrency(phase.budget)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Projections */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">Financial Projections</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                  <div className="text-2xl font-bold text-white">{formatCurrency(project.financials.projectedRevenue)}</div>
                  <div className="text-gray-400 text-sm">Projected Revenue</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                  <div className="text-2xl font-bold text-white">{formatCurrency(project.financials.operatingCosts)}</div>
                  <div className="text-gray-400 text-sm">Operating Costs</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                  <div className="text-2xl font-bold text-emerald-400">{formatCurrency(project.financials.netProfit)}</div>
                  <div className="text-gray-400 text-sm">Net Profit</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                  <div className="text-2xl font-bold text-emerald-400">{project.financials.profitMargin}%</div>
                  <div className="text-gray-400 text-sm">Profit Margin</div>
                </div>
              </div>
            </div>

            {/* Market Analysis */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">Market Analysis</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Demand</h3>
                  <p className="text-gray-400">{project.marketAnalysis.demand}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Supply</h3>
                  <p className="text-gray-400">{project.marketAnalysis.supply}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Price Trend</h3>
                  <p className="text-gray-400">{project.marketAnalysis.priceTrend}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Competition</h3>
                  <p className="text-gray-400">{project.marketAnalysis.competition}</p>
                </div>
              </div>
            </div>

            {/* Sustainability & Certifications */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">Sustainability & Certifications</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Sustainability Practices</h3>
                  <div className="space-y-2">
                    {project.sustainability.map((practice, index) => (
                      <div key={index} className="flex items-center space-x-2 text-gray-300">
                        <span className="text-emerald-400">🌱</span>
                        <span>{practice}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Certifications</h3>
                  <div className="space-y-2">
                    {project.certifications.map((cert, index) => (
                      <div key={index} className="flex items-center space-x-2 text-gray-300">
                        <span className="text-emerald-400">✓</span>
                        <span>{cert}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </ScrollAnimations>
        </div>
      </div>
    </div>
  );
} 