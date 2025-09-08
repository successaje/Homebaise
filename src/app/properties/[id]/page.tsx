'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { formatNumber, formatCurrency, formatDate, getPropertyTypeLabel, getCountryFlag } from '@/lib/utils';
import { getPropertyTokenBalance } from '@/lib/hedera-treasury';
import MagneticEffect from '@/components/MagneticEffect';
import ScrollAnimations from '@/components/ScrollAnimations';
import PropertyCertificate from '@/components/PropertyCertificate';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'react-hot-toast';
import { Property } from '@/types/property';

// Initialize Supabase client outside component
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Check if environment variables are loaded
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('Missing Supabase environment variables');
}

const PropertyDetailPage = () => {
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
  const [tokenId, setTokenId] = useState<string | null>(null);

  // Helper functions
  const getPropertyTypeIcon = (type: string | null) => {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'funded':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'sold':
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      case 'coming-soon':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'pending_review':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'rejected':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'cancelled':
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'funded':
        return 'Funded';
      case 'sold':
        return 'Sold';
      case 'coming-soon':
        return 'Coming Soon';
      case 'pending':
        return 'Pending';
      case 'pending_review':
        return 'Under Review';
      case 'rejected':
        return 'Rejected';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const getTokenId = () => {
    return tokenId || 'N/A';
  };

  const getTokenHashScanUrl = () => {
    return `https://hashscan.io/testnet/token/${getTokenId()}`;
  };

  const getCertificateHashScanUrl = () => {
    return `https://hashscan.io/testnet/token/0.0.6755654/${property?.certificate_token_id}`;
  };

  useEffect(() => {
    const fetchProperty = async () => {
      if (!params.id) return;
      
      try {
        setLoading(true);
        console.log('Fetching property with ID:', params.id);
        
        // Fetch property data
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .eq('id', params.id)
          .single();

        console.log('Supabase response:', { data, error });

        if (error) {
          console.error('Error fetching property:', error);
          toast.error(`Property not found: ${error.message}`);
          router.push('/properties');
          return;
        }

        if (data) {
          console.log('Property data received:', data);
          
          // Fetch token balance and treasury data
          try {
            const [
              { data: treasuryData, error: treasuryError },
              tokenBalance
            ] = await Promise.all([
              supabase
                .from('property_treasury_accounts')
                .select('token_id, token_balance')
                .eq('property_id', data.id)
                .single(),
              getPropertyTokenBalance(data.id)
            ]);
            
            // Update property with token data
            const updatedProperty = {
              ...data,
              tokens_available: tokenBalance,
              token_id: treasuryData?.token_id || null
            };
            
            setProperty(updatedProperty);
            setTokenId(treasuryData?.token_id || null);
            
            if (treasuryError) {
              console.log('No treasury account found for property:', treasuryError.message);
            }
          } catch (error) {
            console.error('Error fetching token balance or treasury data:', error);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [params.id, router]);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  // Early return for loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading property...</p>
          <p className="text-gray-400 text-sm">ID: {params.id}</p>
        </div>
      </div>
    );
  }

  // Handle case when property is not found
  if (!property) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl">Property not found</p>
          <Link href="/properties" className="text-emerald-400 hover:underline mt-2 inline-block">
            Back to Properties
          </Link>
        </div>
      </div>
    );
  }

  const displayName = property.name || property.title || 'Untitled Property';
  const displayLocation = property.city && property.country ? `${property.city}, ${property.country}` : property.location || 'Location not specified';

  // Helper function to get total image count
  const getTotalImageCount = () => {
    const regularImages = property.images?.length || 0;
    const ipfsImages = property.ipfs_image_cids?.length || 0;
    return regularImages + ipfsImages;
  };

  // Helper function to get image URL by index
  const getImageUrl = (index: number) => {
    const regularImages = property.images?.length || 0;
    if (index < regularImages) {
      return property.images![index];
    } else {
      const ipfsIndex = index - regularImages;
      return `https://gateway.pinata.cloud/ipfs/${property.ipfs_image_cids![ipfsIndex]}`;
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
            <div className="space-y-8">
              <div className="flex items-center space-x-2 text-gray-400 text-sm mb-4">
                <Link href="/properties" className="hover:text-white transition-colors">
                  ← Back to Properties
                </Link>
                <span>•</span>
                <span>{getCountryFlag(property.country)} {property.country}</span>
                <span>•</span>
                <span>{getPropertyTypeLabel(property.property_type)}</span>
              </div>
              
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">{displayName}</h1>
                  <p className="text-gray-400 text-lg flex items-center">
                    <span className="mr-2">📍</span>
                    {displayLocation}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-4xl">{getPropertyTypeIcon(property.property_type || null)}</span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm border ${getStatusColor(property.status)}`}>
                    {getStatusLabel(property.status)}
                  </span>
                  {(property?.status === 'tokenized' || property?.certificate_id || property?.certificate_token_id) && (
                    <a
                      href={property?.certificate_token_id ? getCertificateHashScanUrl() : '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm border bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20 transition-colors"
                      title={property?.certificate_token_id || 'View on HashScan'}
                    >
                      🪙 Tokenized ↗
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Image Gallery */}
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                  {getTotalImageCount() > 0 ? (
                    <>
                      {/* Main Image */}
                      <div className="relative h-96">
                        <img 
                          src={getImageUrl(selectedImage)} 
                          alt={`${displayName} - Image ${selectedImage + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to placeholder if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                        {/* Fallback placeholder */}
                        <div className={`absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center hidden`}>
                          <span className="text-8xl">{getPropertyTypeIcon(property.property_type || null)}</span>
                        </div>
                      </div>
                      
                      {/* Image Thumbnails */}
                      {getTotalImageCount() > 1 && (
                        <div className="p-4 border-t border-white/10">
                          <div className="flex space-x-2 overflow-x-auto">
                            {Array.from({ length: getTotalImageCount() }, (_, index) => (
                              <button
                                key={index}
                                onClick={() => setSelectedImage(index)}
                                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                                  selectedImage === index 
                                    ? 'border-emerald-500' 
                                    : 'border-white/20 hover:border-white/40'
                                }`}
                              >
                                <img 
                                  src={getImageUrl(index)} 
                                  alt={`Thumbnail ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="h-96 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                      <span className="text-8xl">{getPropertyTypeIcon(property.property_type || null)}</span>
                    </div>
                  )}
                </div>

                {/* Property Details */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Property Details</h2>
                  {property.description && (
                    <p className="text-gray-300 mb-6">{property.description}</p>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Property Type</span>
                      <span className="text-white">{getPropertyTypeLabel(property.property_type)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Property Size</span>
                      <span className="text-white">
                        {property.property_details?.size || 'N/A'}
                      </span>
                    </div>
                    
                    {property.property_details?.legal_status && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Legal Status</span>
                        <span className="text-white">{property.property_details.legal_status}</span>
                      </div>
                    )}
                    
                    {property.property_details?.occupancy_rate && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Occupancy Rate</span>
                        <span className="text-white">{property.property_details.occupancy_rate}%</span>
                      </div>
                    )}
                    
                    {property.property_details?.annual_rental_income && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Annual Rental Income</span>
                        <span className="text-white">{formatCurrency(parseFloat(property.property_details.annual_rental_income))}</span>
                      </div>
                    )}
                    
                    {property.property_details?.appreciation_rate && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Appreciation Rate</span>
                        <span className="text-emerald-400">{property.property_details.appreciation_rate}%</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Investment Highlights */}
                {property.investment_highlights && property.investment_highlights.length > 0 && (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h2 className="text-2xl font-bold text-white mb-6">Investment Highlights</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {property.investment_highlights.map((highlight, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <span className="text-emerald-400 text-lg">✓</span>
                          <span className="text-gray-300">{highlight}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Property Features */}
                {property.property_features && property.property_features.length > 0 && (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h2 className="text-2xl font-bold text-white mb-6">Property Features</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {property.property_features.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <span className="text-emerald-400">•</span>
                          <span className="text-gray-300">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Amenities */}
                {property.amenities && property.amenities.length > 0 && (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h2 className="text-2xl font-bold text-white mb-6">Amenities</h2>
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

                {/* Investment Risks */}
                {property.investment_risks && property.investment_risks.length > 0 && (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h2 className="text-2xl font-bold text-white mb-6">Investment Risks</h2>
                    <div className="space-y-3">
                      {property.investment_risks.map((risk, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <span className="text-yellow-400 text-lg">⚠️</span>
                          <span className="text-gray-300">{risk}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Property Manager */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Property Manager</h3>
                  <p className="text-gray-300">{property.property_manager || 'No property manager assigned'}</p>
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Last Updated</span>
                      <span className="text-white text-sm">{formatDate(property.updated_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Debug Information - Remove this in production */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-yellow-400 mb-4">🐛 Debug Info</h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="text-yellow-300">Status:</span> <span className="text-white">{property.status}</span></div>
                      <div><span className="text-yellow-300">Certificate ID:</span> <span className="text-white">{property.certificate_id || 'null'}</span></div>
                      <div><span className="text-yellow-300">Certificate Token ID:</span> <span className="text-white">{property.certificate_token_id || 'null'}</span></div>
                      <div><span className="text-yellow-300">Token ID (from treasury):</span> <span className="text-white">{tokenId || 'null'}</span></div>
                      <div><span className="text-yellow-300">Token Price:</span> <span className="text-white">{property.token_price || 'null'}</span></div>
                      <div><span className="text-yellow-300">Total Value:</span> <span className="text-white">{property.total_value || 'null'}</span></div>
                      <div><span className="text-yellow-300">Yield Rate:</span> <span className="text-white">{property.yield_rate || 'null'}</span></div>
                      <div><span className="text-yellow-300">Appreciation Rate:</span> <span className="text-white">{property.property_details?.appreciation_rate || 'null'}</span></div>
                    </div>
                  </div>
                )}

              </div>

              {/* Right Sidebar */}
              <div className="space-y-6">
                {/* Investment Summary */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sticky top-24">
                  <h2 className="text-xl font-bold text-white mb-4">Investment Summary</h2>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Total Value</span>
                      <span className="text-white">{property.total_value ? formatCurrency(property.total_value) : 'N/A'}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Token Price</span>
                      <span className="text-white font-semibold">$1.00 (1:1 ratio)</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Yield Rate</span>
                      <span className="text-emerald-400 font-semibold">
                        {property.yield_rate ? `${parseFloat(property.yield_rate).toLocaleString('en-US')}%` : 'N/A'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Expected Return</span>
                      <span className="text-emerald-400 font-semibold">
                        {property.yield_rate && property.property_details?.appreciation_rate
                          ? `${(parseFloat(property.yield_rate) + parseFloat(property.property_details.appreciation_rate)).toLocaleString('en-US')}%`
                          : property.yield_rate ? `${parseFloat(property.yield_rate).toLocaleString('en-US')}%` : 'N/A'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Total Tokens</span>
                      <span className="text-white font-semibold">
                        {property.total_value ? property.total_value.toLocaleString() : 'N/A'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Available Tokens</span>
                      <span className="text-white font-semibold">
                        {property.tokens_available ? property.tokens_available.toLocaleString() : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Funding Progress */}
                  <div className="mt-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-400 text-sm">Funding Progress</span>
                      <span className="text-white text-sm font-semibold">{property.funded_percent ? `${property.funded_percent}%` : '0%'}</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${property.funded_percent || 0}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Investment Range */}
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-400 text-sm">Investment Range</span>
                    </div>
                    <div className="text-white font-semibold">
                      {property.min_investment && property.max_investment 
                        ? `${formatNumber(property.min_investment)} - ${formatNumber(property.max_investment)}`
                        : 'N/A'
                      }
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

                {/* Certificate Information */}
                {(property?.status === 'verified' || property?.certificate_id || property?.certificate_token_id) && (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">🪙 Property Certificate</h3>
                    <div className="space-y-3">
                      {(property?.certificate_id || property?.certificate_token_id) ? (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Certificate ID</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-white font-mono text-sm">
                                {property.certificate_token_id || 'N/A'}
                              </span>
                              <a
                                href={property?.certificate_token_id ? getCertificateHashScanUrl() : '#'}
                                target="_blank"
                                rel="noreferrer"
                                className="text-purple-400 hover:text-purple-300"
                                title="View on HashScan"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Status</span>
                            <span className="inline-flex items-center text-emerald-400">
                              <svg className="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 8 8">
                                <circle cx={4} cy={4} r={3} />
                              </svg>
                              Verified
                            </span>
                          </div>
                          {property?.certificate_issued_at && (
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400">Issued</span>
                              <span className="text-white">{formatDate(property.certificate_issued_at)}</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-gray-400">No certificate issued yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Token Information */}
                {(property?.status === 'tokenized' || property?.token_price || tokenId) && (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">🪙 Token Information</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Token ID</span>
                        <span className="text-white font-mono text-sm truncate max-w-32" title={getTokenId()}>
                          {getTokenId()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">HashScan</span>
                        <a
                          href={getTokenHashScanUrl() || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="text-purple-400 hover:text-purple-300 text-sm underline"
                        >
                          View on HashScan ↗
                        </a>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Token Price</span>
                        <span className="text-white">$1.00 (1:1 ratio)</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Min Investment</span>
                        <span className="text-white">{property.min_investment ? formatNumber(property.min_investment) : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Max Investment</span>
                        <span className="text-white">{property.max_investment ? formatNumber(property.max_investment) : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Property Details Sidebar */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Property Details</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Listed By</span>
                      <span className="text-white">{property.listed_by}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Created</span>
                      <span className="text-white text-sm">{formatDate(property.created_at)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Last Updated</span>
                      <span className="text-white text-sm">{formatDate(property.updated_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollAnimations>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailPage;