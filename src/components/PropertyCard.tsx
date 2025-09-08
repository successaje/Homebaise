'use client';

import Link from 'next/link';
import MagneticEffect from './MagneticEffect';
import { formatCurrency, getPropertyTypeLabel } from '@/lib/utils';
import { Property } from '@/types/property';

interface PropertyCardProps {
  property: Property;
  className?: string;
}

export default function PropertyCard({ property, className = '' }: PropertyCardProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(0)}K`;
    }
    return `$${num.toLocaleString()}`;
  };

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
      case 'certified':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'tokenized':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'funded':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'completed':
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'approved':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'certified':
        return 'Certified';
      case 'tokenized':
        return 'Tokenized';
      case 'funded':
        return 'Funded';
      case 'completed':
        return 'Completed';
      case 'pending':
        return 'Pending';
      case 'approved':
        return 'Approved';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  return (
    <MagneticEffect>
      <Link href={`/properties/${property.id}`}>
        <div className={`bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 transition-all duration-300 hover-lift group ${className}`}>
          {/* Property Image */}
          <div className="relative h-48 overflow-hidden">
            {property.images && property.images.length > 0 ? (
              <img 
                src={property.images[0]} 
                alt={property.name || property.title || 'Property'} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to IPFS if direct image fails
                  const target = e.target as HTMLImageElement;
                  const ipfsCid = property.ipfs_image_cids?.[0];
                  if (ipfsCid) {
                    target.src = `https://ipfs.io/ipfs/${ipfsCid}`;
                  } else {
                    // Show placeholder if no IPFS image available
                    target.style.display = 'none';
                    const placeholder = target.nextElementSibling as HTMLElement;
                    if (placeholder) {
                      placeholder.style.display = 'flex';
                    }
                  }
                }}
              />
            ) : property.ipfs_image_cids && property.ipfs_image_cids.length > 0 ? (
              <img 
                src={`https://ipfs.io/ipfs/${property.ipfs_image_cids[0]}`}
                alt={property.name || property.title || 'Property'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Show placeholder if IPFS image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const placeholder = target.nextElementSibling as HTMLElement;
                  if (placeholder) {
                    placeholder.style.display = 'flex';
                  }
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                <span className="text-4xl">{getPropertyTypeIcon(property.property_type || null)}</span>
              </div>
            )}
            <div className="absolute top-3 left-3">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${getStatusColor(property.status)}`}>
                {getStatusLabel(property.status)}
              </span>
            </div>
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-black/50 text-white border border-white/20">
                {property.funded_percent || 0}% Funded
              </span>
            </div>
            <div className="absolute bottom-3 left-3 right-3">
              <div className="w-full bg-black/50 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${property.funded_percent || 0}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Property Details */}
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-emerald-400 transition-colors">
                  {property.name || property.title || 'Property'}
                </h3>
                <p className="text-gray-400 text-sm flex items-center">
                  <span className="mr-2">📍</span>
                  {property.location || 'Location not specified'}
                </p>
              </div>
              <span className="text-2xl ml-2">{getPropertyTypeIcon(property.property_type || null)}</span>
            </div>

            {/* Description */}
            <p className="text-gray-300 text-sm mb-4 line-clamp-2">
              {property.description || 'No description available'}
            </p>

            {/* Investment Details */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Total Value</span>
                <span className="text-white font-semibold">
                  {property.total_value ? formatNumber(property.total_value) : 'N/A'}
                </span>
              </div>
              
              {property.yield_rate && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Yield Rate</span>
                  <span className="text-emerald-400 font-semibold">{property.yield_rate}%</span>
                </div>
              )}
              
              {property.funded_amount_usd && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Funded Amount</span>
                  <span className="text-white font-semibold">
                    {formatNumber(property.funded_amount_usd)}
                  </span>
                </div>
              )}
              
              {property.token_symbol && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Token Symbol</span>
                  <span className="text-white font-semibold">{property.token_symbol}</span>
                </div>
              )}
            </div>

            {/* Status Indicators */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Status</span>
                <div className="flex items-center space-x-2">
                  {property.certificate_token_id && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      ✓ Certified
                    </span>
                  )}
                  {property.token_id && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      🪙 Tokenized
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Property Features */}
            {property.property_features && property.property_features.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex flex-wrap gap-1">
                  {property.property_features.slice(0, 3).map((feature, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-white/5 text-gray-300 border border-white/10"
                    >
                      {feature}
                    </span>
                  ))}
                  {property.property_features.length > 3 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-white/5 text-gray-300 border border-white/10">
                      +{property.property_features.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </Link>
    </MagneticEffect>
  );
} 