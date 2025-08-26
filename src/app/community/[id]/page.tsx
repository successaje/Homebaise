'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import MagneticEffect from '@/components/MagneticEffect';
import ScrollAnimations from '@/components/ScrollAnimations';
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils';

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
    bio: string;
    achievements: string[];
  };
  milestones: {
    title: string;
    description: string;
    target: number;
    current: number;
    status: 'pending' | 'in-progress' | 'completed';
  }[];
  images: string[];
  financials: {
    totalBudget: number;
    fundsRaised: number;
    remainingNeeded: number;
    projectedRevenue: number;
    operatingCosts: number;
    netProfit: number;
  };
  impact: {
    jobsCreated: number;
    peopleServed: number;
    environmentalImpact: string;
    socialImpact: string;
    economicImpact: string;
  };
  governance: {
    votingRights: string;
    decisionMaking: string;
    transparency: string;
    reporting: string;
  };
}

// Mock community pools data
const communityPools: CommunityPool[] = [
  {
    id: '1',
    name: 'Lagos Affordable Housing Initiative',
    description: 'Building affordable housing for low-income families in Lagos',
    longDescription: 'This community-driven project aims to build 500 affordable housing units for low-income families in Lagos. The project includes community centers, schools, and healthcare facilities. By pooling resources from community members, we can create sustainable housing solutions that benefit everyone involved.',
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
      avatar: '/images/leaders/adebayo-johnson.jpg',
      bio: 'Dr. Adebayo Johnson is a renowned community development expert with over 15 years of experience in affordable housing projects across Nigeria. He has successfully led multiple community initiatives and has been recognized for his innovative approach to sustainable urban development.',
      achievements: [
        'Community Development Excellence Award 2023',
        'Led 10+ successful housing projects',
        'Created 2,000+ affordable housing units',
        'Mentored 100+ community leaders'
      ]
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
    images: ['/images/community/lagos-housing-1.jpg', '/images/community/lagos-housing-2.jpg'],
    financials: {
      totalBudget: 5000000,
      fundsRaised: 3250000,
      remainingNeeded: 1750000,
      projectedRevenue: 7500000,
      operatingCosts: 2000000,
      netProfit: 5500000
    },
    impact: {
      jobsCreated: 150,
      peopleServed: 2500,
      environmentalImpact: 'Green building practices, renewable energy integration, waste reduction',
      socialImpact: 'Improved living standards, community cohesion, reduced homelessness',
      economicImpact: 'Local job creation, increased property values, economic multiplier effect'
    },
    governance: {
      votingRights: 'One vote per token holder on major decisions',
      decisionMaking: 'Community voting on project milestones and budget allocation',
      transparency: 'Monthly financial reports and progress updates',
      reporting: 'Quarterly impact assessments and annual audits'
    }
  }
];

export default function CommunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [pool, setPool] = useState<CommunityPool | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showJoinModal, setShowJoinModal] = useState(false);

  useEffect(() => {
    const poolId = params.id as string;
    const foundPool = communityPools.find(p => p.id === poolId);
    
    if (foundPool) {
      setPool(foundPool);
    } else {
      router.push('/community');
    }
  }, [params.id, router]);

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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'housing':
        return '🏠';
      case 'infrastructure':
        return '🏗️';
      case 'education':
        return '🎓';
      case 'healthcare':
        return '🏥';
      case 'renewable':
        return '☀️';
      case 'tourism':
        return '🏖️';
      default:
        return '🏘️';
    }
  };

  const getMilestoneStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'in-progress':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'pending':
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  if (!pool) {
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
            {/* Breadcrumb */}
            <div className="mb-8">
              <nav className="flex items-center space-x-2 text-sm text-gray-400">
                <Link href="/" className="hover:text-white transition-colors">Home</Link>
                <span>→</span>
                <Link href="/community" className="hover:text-white transition-colors">Community</Link>
                <span>→</span>
                <span className="text-white">{pool.name}</span>
              </nav>
            </div>

            {/* Project Header */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
              {/* Main Content */}
              <div className="lg:col-span-2">
                <div className="mb-6">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getCategoryColor(pool.category)}`}>
                    {getCategoryIcon(pool.category)} {pool.category}
                  </span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ml-2 ${getStatusColor(pool.status)}`}>
                    {pool.status}
                  </span>
                </div>
                
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                  {pool.name}
                </h1>
                
                <p className="text-xl text-gray-400 mb-8 leading-relaxed">
                  {pool.longDescription}
                </p>

                {/* Project Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-white">{formatNumber(pool.totalValue)}</div>
                    <div className="text-gray-400 text-sm">Total Value</div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-emerald-400">{pool.yieldRate}</div>
                    <div className="text-gray-400 text-sm">Yield Rate</div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-white">{pool.fundedPercent}%</div>
                    <div className="text-gray-400 text-sm">Funded</div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-white">{pool.communityMembers}/{pool.maxMembers}</div>
                    <div className="text-gray-400 text-sm">Members</div>
                  </div>
                </div>

                {/* Join CTA */}
                <MagneticEffect>
                  <button
                    onClick={() => setShowJoinModal(true)}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 hover-lift"
                  >
                    Join Community - Starting from {formatCurrency(pool.minInvestment)}
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
                      <span className="text-white font-semibold">${pool.tokenPrice}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Min Investment</span>
                      <span className="text-white font-semibold">{formatCurrency(pool.minInvestment)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Max Investment</span>
                      <span className="text-white font-semibold">{formatCurrency(pool.maxInvestment)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Expected Return</span>
                      <span className="text-emerald-400 font-semibold">{pool.expectedReturn}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">End Date</span>
                      <span className="text-white font-semibold">{formatDate(pool.endDate)}</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-white/10">
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-gray-400">Funding Progress</span>
                      <span className="text-white">{pool.fundedPercent}%</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${pool.fundedPercent}%` }}
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
                {pool.images.map((image, index) => (
                  <div
                    key={index}
                    className={`h-48 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl flex items-center justify-center cursor-pointer transition-all ${
                      selectedImage === index ? 'ring-2 ring-emerald-500' : 'hover:bg-emerald-500/30'
                    }`}
                    onClick={() => setSelectedImage(index)}
                  >
                    <span className="text-4xl">{getCategoryIcon(pool.category)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Community Leader Profile */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">Community Leader</h2>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-start space-x-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full flex items-center justify-center">
                    <span className="text-2xl">👤</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">{pool.leader.name}</h3>
                    <p className="text-gray-400 mb-4">{pool.leader.bio}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">{pool.leader.experience}</div>
                        <div className="text-gray-400 text-sm">Years Experience</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-emerald-400">{pool.leader.rating}⭐</div>
                        <div className="text-gray-400 text-sm">Rating</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">{pool.leader.role}</div>
                        <div className="text-gray-400 text-sm">Role</div>
                      </div>
                    </div>

                    <h4 className="text-lg font-semibold text-white mb-3">Achievements</h4>
                    <ul className="space-y-2">
                      {pool.leader.achievements.map((achievement, index) => (
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

            {/* Project Milestones */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">Project Milestones</h2>
              <div className="space-y-4">
                {pool.milestones.map((milestone, index) => (
                  <div key={index} className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">{milestone.title}</h3>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${getMilestoneStatusColor(milestone.status)}`}>
                        {milestone.status}
                      </span>
                    </div>
                    <p className="text-gray-400 mb-4">{milestone.description}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span>Target: {formatCurrency(milestone.target)}</span>
                      <span>Current: {formatCurrency(milestone.current)}</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(milestone.current / milestone.target) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Overview */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">Financial Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                  <div className="text-2xl font-bold text-white">{formatCurrency(pool.financials.totalBudget)}</div>
                  <div className="text-gray-400 text-sm">Total Budget</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                  <div className="text-2xl font-bold text-emerald-400">{formatCurrency(pool.financials.fundsRaised)}</div>
                  <div className="text-gray-400 text-sm">Funds Raised</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                  <div className="text-2xl font-bold text-white">{formatCurrency(pool.financials.remainingNeeded)}</div>
                  <div className="text-gray-400 text-sm">Remaining Needed</div>
                </div>
              </div>
            </div>

            {/* Impact Assessment */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">Impact Assessment</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Social Impact</h3>
                  <p className="text-gray-400 mb-4">{pool.impact.socialImpact}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{pool.impact.jobsCreated}</div>
                      <div className="text-gray-400 text-sm">Jobs Created</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-400">{pool.impact.peopleServed}</div>
                      <div className="text-gray-400 text-sm">People Served</div>
                    </div>
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Environmental Impact</h3>
                  <p className="text-gray-400">{pool.impact.environmentalImpact}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Economic Impact</h3>
                  <p className="text-gray-400">{pool.impact.economicImpact}</p>
                </div>
              </div>
            </div>

            {/* Benefits & Requirements */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">Benefits & Requirements</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Benefits</h3>
                  <ul className="space-y-2">
                    {pool.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-center space-x-2 text-gray-300">
                        <span className="text-emerald-400">✓</span>
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Requirements</h3>
                  <ul className="space-y-2">
                    {pool.requirements.map((requirement, index) => (
                      <li key={index} className="flex items-center space-x-2 text-gray-300">
                        <span className="text-blue-400">ℹ️</span>
                        <span>{requirement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Governance */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">Governance</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Voting Rights</h3>
                  <p className="text-gray-400">{pool.governance.votingRights}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Decision Making</h3>
                  <p className="text-gray-400">{pool.governance.decisionMaking}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Transparency</h3>
                  <p className="text-gray-400">{pool.governance.transparency}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Reporting</h3>
                  <p className="text-gray-400">{pool.governance.reporting}</p>
                </div>
              </div>
            </div>
          </ScrollAnimations>
        </div>
      </div>
    </div>
  );
} 