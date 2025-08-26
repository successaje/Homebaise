'use client';

import { useState, useEffect } from 'react';
import { properties, Property, getPropertiesByType, getPropertiesByCountry, searchProperties } from '@/data/mockProperties';
import PropertyCard from '@/components/PropertyCard';
import MagneticEffect from '@/components/MagneticEffect';
import ScrollAnimations from '@/components/ScrollAnimations';
import { getPropertyTypeLabel, getCountryFlag } from '@/lib/utils';
import Link from 'next/link';

export default function PropertiesPage() {
  const [filteredProperties, setFilteredProperties] = useState<Property[]>(properties);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<Property['propertyType'] | 'all'>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'value' | 'yield' | 'funded'>('name');

  const propertyTypes: Property['propertyType'][] = ['residential', 'commercial', 'agricultural', 'mixed-use', 'land'];
  const countries = Array.from(new Set(properties.map(p => p.country)));

  useEffect(() => {
    let filtered = properties;

    // Apply search filter
    if (searchQuery) {
      filtered = searchProperties(searchQuery);
    }

    // Apply type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(p => p.propertyType === selectedType);
    }

    // Apply country filter
    if (selectedCountry !== 'all') {
      filtered = filtered.filter(p => p.country === selectedCountry);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'value':
          return b.totalValueUSD - a.totalValueUSD;
        case 'yield':
          return parseFloat(b.yieldRate) - parseFloat(a.yieldRate);
        case 'funded':
          return b.fundedPercent - a.fundedPercent;
        default:
          return 0;
      }
    });

    setFilteredProperties(filtered);
  }, [searchQuery, selectedType, selectedCountry, sortBy]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedType('all');
    setSelectedCountry('all');
    setSortBy('name');
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
              <Link href="/dashboard" className="text-gray-300 hover:text-white">Dashboard</Link>
              <Link href="/profile" className="text-gray-300 hover:text-white">Profile</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <ScrollAnimations animationType="fade-in-up">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-white mb-4">
                Discover African Real Estate Opportunities
              </h1>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Invest in tokenized real estate across Africa. From luxury apartments to agricultural land, 
                find opportunities that match your investment goals.
              </p>
            </div>
          </ScrollAnimations>

          {/* Filters */}
          <ScrollAnimations animationType="fade-in-up" delay={200}>
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Search Properties</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, location..."
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                {/* Property Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Property Type</label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value as Property['propertyType'] | 'all')}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="all">All Types</option>
                    {propertyTypes.map(type => (
                      <option key={type} value={type}>{getPropertyTypeLabel(type)}</option>
                    ))}
                  </select>
                </div>

                {/* Country Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Country</label>
                  <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="all">All Countries</option>
                    {countries.map(country => (
                      <option key={country} value={country}>
                        {getCountryFlag(country)} {country}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'name' | 'value' | 'yield' | 'funded')}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="name">Name</option>
                    <option value="value">Total Value</option>
                    <option value="yield">Yield Rate</option>
                    <option value="funded">Funding Progress</option>
                  </select>
                </div>
              </div>

              {/* Clear Filters */}
              <div className="mt-4 flex justify-between items-center">
                <span className="text-gray-400 text-sm">
                  {filteredProperties.length} of {properties.length} properties
                </span>
                <MagneticEffect>
                  <button
                    onClick={clearFilters}
                    className="text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors"
                  >
                    Clear All Filters
                  </button>
                </MagneticEffect>
              </div>
            </div>
          </ScrollAnimations>

          {/* Properties Grid */}
          <ScrollAnimations animationType="fade-in-up" delay={400}>
            {filteredProperties.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProperties.map((property, index) => (
                  <PropertyCard 
                    key={property.id} 
                    property={property}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🏠</div>
                <h3 className="text-xl font-semibold text-white mb-2">No Properties Found</h3>
                <p className="text-gray-400 mb-6">
                  Try adjusting your search criteria or filters to find more properties.
                </p>
                <MagneticEffect>
                  <button
                    onClick={clearFilters}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 hover-lift"
                  >
                    Clear Filters
                  </button>
                </MagneticEffect>
              </div>
            )}
          </ScrollAnimations>
        </div>
      </div>
    </div>
  );
} 