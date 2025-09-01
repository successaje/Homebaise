'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getPropertyById, Property } from '@/data/mockProperties';
import { formatNumber, formatCurrency, formatDate, getPropertyTypeLabel, getCountryFlag } from '@/lib/utils';
import MagneticEffect from '@/components/MagneticEffect';
import ScrollAnimations from '@/components/ScrollAnimations';
import PropertyCertificate from '@/components/PropertyCertificate';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'react-hot-toast';

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [certificateData, setCertificateData] = useState<{
    tokenId: string;
    certificateNumber: string;
    metadataUrl: string;
  } | null>(null);
  const [isGeneratingCertificate, setIsGeneratingCertificate] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (params.id) {
      const foundProperty = getPropertyById(params.id as string);
      if (foundProperty) {
        setProperty(foundProperty);
      } else {
        router.push('/properties');
      }
      setLoading(false);
    }
  }, [params.id, router]);

  // Check authentication status
  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!property) {
    return null;
  }

  const getPropertyTypeIcon = (type: Property['propertyType']) => {
    switch (type) {
      case 'residential':
        return '🏠';
      case 'commercial':
        return '🏢';
      case 'agricultural':
        return '🌾';
      case 'mixed-use':
        return '🏗️';
      case 'land':
        return '🌍';
      default:
        return '🏠';
    }
  };

  const getStatusColor = (status: Property['status']) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'funded':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'sold':
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      case 'coming-soon':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const handleGenerateCertificate = async (verificationData: {
    kycVerified: boolean;
    legalDocsValidated: boolean;
    ownershipConfirmed: boolean;
    tokenized: boolean;
  }) => {
    setIsGeneratingCertificate(true);
    try {
      const response = await fetch('/api/generate-certificate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyId: property?.id,
          verificationData
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to generate certificate`);
      }

      const result = await response.json();
      setCertificateData(result.certificate);
    } catch (error) {
      console.error('Error generating certificate:', error);
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        // Handle authentication error specifically
        toast.error('Please log in to generate certificates');
      } else {
        throw error;
      }
    } finally {
      setIsGeneratingCertificate(false);
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
              <Link href="/dashboard" className="text-gray-300 hover:text-white">Dashboard</Link>
              <Link href="/profile" className="text-gray-300 hover:text-white">Profile</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollAnimations animationType="fade-in-up">
            {/* Property Header */}
            <div className="mb-8">
              <div className="flex items-center space-x-2 text-gray-400 text-sm mb-4">
                <Link href="/properties" className="hover:text-white transition-colors">
                  ← Back to Properties
                </Link>
                <span>•</span>
                <span>{getCountryFlag(property.country)} {property.country}</span>
                <span>•</span>
                <span>{getPropertyTypeLabel(property.propertyType)}</span>
              </div>
              
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">{property.name}</h1>
                  <p className="text-gray-400 text-lg flex items-center">
                    <span className="mr-2">📍</span>
                    {property.location}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-4xl">{getPropertyTypeIcon(property.propertyType)}</span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm border ${getStatusColor(property.status)}`}>
                    {property.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Image Gallery */}
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                  <div className="relative h-96 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                    <span className="text-8xl">{getPropertyTypeIcon(property.propertyType)}</span>
                  </div>
                  
                  {/* Image Thumbnails */}
                  {property.images.length > 1 && (
                    <div className="p-4 border-t border-white/10">
                      <div className="flex space-x-2 overflow-x-auto">
                        {property.images.map((image, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedImage(index)}
                            className={`flex-shrink-0 w-16 h-16 rounded-lg border-2 transition-all ${
                              selectedImage === index 
                                ? 'border-emerald-500 bg-emerald-500/20' 
                                : 'border-white/10 bg-white/5 hover:border-white/20'
                            }`}
                          >
                            <div className="w-full h-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                              <span className="text-lg">{getPropertyTypeIcon(property.propertyType)}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h2 className="text-2xl font-bold text-white mb-4">About This Property</h2>
                  <p className="text-gray-300 leading-relaxed">{property.longDescription}</p>
                </div>

                {/* Investment Highlights */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h2 className="text-2xl font-bold text-white mb-4">Investment Highlights</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {property.investmentHighlights.map((highlight, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <span className="text-emerald-400 text-lg">✓</span>
                        <span className="text-gray-300">{highlight}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Property Features */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h2 className="text-2xl font-bold text-white mb-4">Property Features</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {property.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <span className="text-emerald-400">•</span>
                        <span className="text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Amenities */}
                {property.amenities.length > 0 && (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h2 className="text-2xl font-bold text-white mb-4">Amenities</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {property.amenities.map((amenity, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <span className="text-emerald-400">•</span>
                          <span className="text-gray-300">{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Risks */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h2 className="text-2xl font-bold text-white mb-4">Investment Risks</h2>
                  <div className="space-y-3">
                    {property.risks.map((risk, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <span className="text-yellow-400 text-lg">⚠️</span>
                        <span className="text-gray-300">{risk}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Investment Summary */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sticky top-24">
                  <h2 className="text-xl font-bold text-white mb-4">Investment Summary</h2>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Total Value</span>
                      <span className="text-white font-semibold">{formatNumber(property.totalValueUSD)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Token Price</span>
                      <span className="text-white font-semibold">{formatCurrency(property.tokenPriceUSD)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Yield Rate</span>
                      <span className="text-emerald-400 font-semibold">{property.yieldRate}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Expected Return</span>
                      <span className="text-emerald-400 font-semibold">{property.expectedReturn}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Available Tokens</span>
                      <span className="text-white font-semibold">{property.tokensAvailable.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Funding Progress */}
                  <div className="mt-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-400 text-sm">Funding Progress</span>
                      <span className="text-white text-sm font-semibold">{property.fundedPercent}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${property.fundedPercent}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Investment Range */}
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-400 text-sm">Investment Range</span>
                    </div>
                    <div className="text-white font-semibold">
                      {formatNumber(property.minInvestment)} - {formatNumber(property.maxInvestment)}
                    </div>
                  </div>

                  {/* Invest Button */}
                  <MagneticEffect>
                    <Link href={`/properties/${property.id}/invest`}>
                      <button className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-4 px-6 rounded-xl font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 hover-lift mt-6">
                        Invest Now
                      </button>
                    </Link>
                  </MagneticEffect>
                </div>

                {/* Property Details */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Property Details</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Property Size</span>
                      <span className="text-white">{property.propertySize}</span>
                    </div>
                    
                    {property.bedrooms && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Bedrooms</span>
                        <span className="text-white">{property.bedrooms}</span>
                      </div>
                    )}
                    
                    {property.bathrooms && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Bathrooms</span>
                        <span className="text-white">{property.bathrooms}</span>
                      </div>
                    )}
                    
                    {property.yearBuilt && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Year Built</span>
                        <span className="text-white">{property.yearBuilt}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Legal Status</span>
                      <span className="text-white">{property.legalStatus}</span>
                    </div>
                    
                    {property.occupancyRate && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Occupancy Rate</span>
                        <span className="text-white">{property.occupancyRate}%</span>
                      </div>
                    )}
                    
                    {property.rentalIncome && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Annual Rental Income</span>
                        <span className="text-white">{formatNumber(property.rentalIncome)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Appreciation Rate</span>
                      <span className="text-emerald-400">{property.appreciationRate}</span>
                    </div>
                  </div>
                </div>

                {/* Property Manager */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Property Manager</h3>
                  <p className="text-gray-300">{property.propertyManager}</p>
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Closing Date</span>
                      <span className="text-white text-sm">{formatDate(property.closingDate)}</span>
                    </div>
                  </div>
                </div>

                {/* Property Certificate */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Verification Certificate</h3>
                  {!isAuthenticated ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">Authentication Required</h3>
                      <p className="text-gray-400 mb-4">Please log in to generate property certificates.</p>
                      <Link href="/auth" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        Log In
                      </Link>
                    </div>
                  ) : (
                    <PropertyCertificate
                      propertyId={property.id}
                      certificateData={certificateData}
                      onGenerateCertificate={handleGenerateCertificate}
                      isGenerating={isGeneratingCertificate}
                    />
                  )}
                </div>
              </div>
            </div>
          </ScrollAnimations>
        </div>
      </div>
    </div>
  );
} 