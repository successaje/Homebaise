'use client';

import { Property } from '@/data/mockProperties';
import Link from 'next/link';
import MagneticEffect from './MagneticEffect';
import { formatCurrency } from '@/lib/utils';

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

  return (
    <MagneticEffect>
      <Link href={`/properties/${property.id}`}>
        <div className={`bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 transition-all duration-300 hover-lift group ${className}`}>
          {/* Property Image */}
          <div className="relative h-48 overflow-hidden">
            <div className="w-full h-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
              <span className="text-4xl">{getPropertyTypeIcon(property.propertyType)}</span>
            </div>
            <div className="absolute top-3 left-3">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${getStatusColor(property.status)}`}>
                {property.status}
              </span>
            </div>
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-black/50 text-white border border-white/20">
                {property.fundedPercent}% Funded
              </span>
            </div>
            <div className="absolute bottom-3 left-3 right-3">
              <div className="w-full bg-black/50 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${property.fundedPercent}%` }}
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
                  {property.name}
                </h3>
                <p className="text-gray-400 text-sm flex items-center">
                  <span className="mr-2">📍</span>
                  {property.location}
                </p>
              </div>
              <span className="text-2xl ml-2">{getPropertyTypeIcon(property.propertyType)}</span>
            </div>

            {/* Description */}
            <p className="text-gray-300 text-sm mb-4 line-clamp-2">
              {property.description}
            </p>

            {/* Investment Details */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Total Value</span>
                <span className="text-white font-semibold">{formatNumber(property.totalValueUSD)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Token Price</span>
                <span className="text-white font-semibold">${property.tokenPriceUSD}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Yield Rate</span>
                <span className="text-emerald-400 font-semibold">{property.yieldRate}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Available Tokens</span>
                <span className="text-white font-semibold">{property.tokensAvailable.toLocaleString()}</span>
              </div>
            </div>

            {/* Investment Range */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Investment Range</span>
                <span className="text-white">
                  {formatNumber(property.minInvestment)} - {formatNumber(property.maxInvestment)}
                </span>
              </div>
            </div>

            {/* Property Features */}
            {property.features.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex flex-wrap gap-1">
                  {property.features.slice(0, 3).map((feature, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-white/5 text-gray-300 border border-white/10"
                    >
                      {feature}
                    </span>
                  ))}
                  {property.features.length > 3 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-white/5 text-gray-300 border border-white/10">
                      +{property.features.length - 3} more
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