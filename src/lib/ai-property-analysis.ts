import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface PropertyAnalysisData {
  property: {
    id: string;
    name: string;
    location: string;
    property_type: string;
    total_value: number;
    area_sqm?: number;
    bedrooms?: number;
    bathrooms?: number;
    year_built?: number;
    description: string;
    images?: string[];
    yield_rate?: string;
    funded_amount_usd?: number;
    funded_percent?: number;
    status: string;
  };
  market_data: {
    similar_properties: any[];
    market_trends: {
      price_per_sqm: number;
      average_yield: number;
      market_activity: string;
      price_trend: 'rising' | 'stable' | 'declining';
    };
    location_metrics: {
      population_density: number;
      economic_indicators: string[];
      infrastructure_score: number;
      accessibility_score: number;
    };
  };
  financial_metrics: {
    current_yield: number;
    price_per_sqm: number;
    capitalization_rate: number;
    debt_to_equity_ratio?: number;
    occupancy_rate?: number;
  };
  risk_factors: {
    location_risks: string[];
    market_risks: string[];
    property_risks: string[];
    regulatory_risks: string[];
  };
}

// Mock market data for different African cities
const MOCK_MARKET_DATA = {
  'Lagos, Nigeria': {
    price_per_sqm: 1200,
    average_yield: 8.5,
    market_activity: 'High',
    price_trend: 'rising' as const,
    population_density: 8500,
    economic_indicators: ['Tech Hub', 'Financial Center', 'Port City'],
    infrastructure_score: 7,
    accessibility_score: 8
  },
  'Nairobi, Kenya': {
    price_per_sqm: 1800,
    average_yield: 7.2,
    market_activity: 'High',
    price_trend: 'rising' as const,
    population_density: 4200,
    economic_indicators: ['Tech Hub', 'Regional HQ', 'Aviation Hub'],
    infrastructure_score: 8,
    accessibility_score: 9
  },
  'Cape Town, South Africa': {
    price_per_sqm: 2200,
    average_yield: 6.8,
    market_activity: 'Medium',
    price_trend: 'stable' as const,
    population_density: 1500,
    economic_indicators: ['Tourism', 'Wine Industry', 'Tech'],
    infrastructure_score: 9,
    accessibility_score: 8
  },
  'Accra, Ghana': {
    price_per_sqm: 900,
    average_yield: 9.2,
    market_activity: 'Medium',
    price_trend: 'rising' as const,
    population_density: 3200,
    economic_indicators: ['Oil & Gas', 'Gold Mining', 'Agriculture'],
    infrastructure_score: 6,
    accessibility_score: 7
  },
  'Kigali, Rwanda': {
    price_per_sqm: 650,
    average_yield: 10.5,
    market_activity: 'Growing',
    price_trend: 'rising' as const,
    population_density: 2800,
    economic_indicators: ['Tech Hub', 'Clean City', 'Tourism'],
    infrastructure_score: 8,
    accessibility_score: 7
  },
  'Dar es Salaam, Tanzania': {
    price_per_sqm: 750,
    average_yield: 9.8,
    market_activity: 'Medium',
    price_trend: 'rising' as const,
    population_density: 4100,
    economic_indicators: ['Port City', 'Manufacturing', 'Agriculture'],
    infrastructure_score: 5,
    accessibility_score: 6
  }
};

// Mock similar properties data
const MOCK_SIMILAR_PROPERTIES = {
  'Lagos, Nigeria': [
    { name: 'Victoria Island Luxury', price: 2500000, area: 2000, yield: 8.2, type: 'residential' },
    { name: 'Ikoyi Apartments', price: 1800000, area: 1500, yield: 8.8, type: 'residential' },
    { name: 'Lekki Commercial', price: 3200000, area: 2500, yield: 7.9, type: 'commercial' }
  ],
  'Nairobi, Kenya': [
    { name: 'Westlands Office', price: 2800000, area: 1800, yield: 7.5, type: 'commercial' },
    { name: 'Karen Residential', price: 2200000, area: 1600, yield: 7.8, type: 'residential' },
    { name: 'Kilimani Apartments', price: 1900000, area: 1400, yield: 8.1, type: 'residential' }
  ],
  'Cape Town, South Africa': [
    { name: 'V&A Waterfront', price: 4500000, area: 2000, yield: 6.5, type: 'commercial' },
    { name: 'Camps Bay Villa', price: 3800000, area: 1800, yield: 7.2, type: 'residential' },
    { name: 'Sea Point Apartments', price: 2200000, area: 1200, yield: 6.9, type: 'residential' }
  ],
  'Accra, Ghana': [
    { name: 'East Legon Villa', price: 1800000, area: 2000, yield: 9.5, type: 'residential' },
    { name: 'Airport City Office', price: 2400000, area: 1800, yield: 8.8, type: 'commercial' },
    { name: 'Labone Apartments', price: 1200000, area: 1200, yield: 9.8, type: 'residential' }
  ],
  'Kigali, Rwanda': [
    { name: 'Kacyiru Residential', price: 800000, area: 1500, yield: 11.2, type: 'residential' },
    { name: 'Nyarutarama Villa', price: 1200000, area: 1800, yield: 10.8, type: 'residential' },
    { name: 'CBD Office Space', price: 1500000, area: 1200, yield: 9.5, type: 'commercial' }
  ],
  'Dar es Salaam, Tanzania': [
    { name: 'Masaki Villa', price: 1400000, area: 2000, yield: 10.2, type: 'residential' },
    { name: 'CBD Commercial', price: 1800000, area: 1500, yield: 9.5, type: 'commercial' },
    { name: 'Oyster Bay Apartments', price: 1000000, area: 1200, yield: 10.8, type: 'residential' }
  ]
};

export class PropertyAnalysisService {
  /**
   * Gather comprehensive property data for AI analysis
   */
  static async gatherPropertyAnalysisData(propertyId: string): Promise<PropertyAnalysisData> {
    try {
      console.log(`Fetching property data for ID: ${propertyId}`);
      
      // Fetch property data
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();

      console.log('Property query result:', { property, propertyError });

      if (propertyError) {
        console.error('Property fetch error:', propertyError);
        throw new Error(`Property fetch error: ${propertyError.message}`);
      }

      if (!property) {
        console.error('No property found for ID:', propertyId);
        throw new Error(`No property found with ID: ${propertyId}`);
      }

      // Get market data based on location
      const location = property.location || 'Unknown Location';
      console.log('Property location:', location);
      const marketData = this.getMarketDataForLocation(location);
      const similarProperties = this.getSimilarPropertiesForLocation(location);

      // Calculate financial metrics
      const financialMetrics = this.calculateFinancialMetrics(property);

      // Assess risk factors
      const riskFactors = this.assessRiskFactors(property, location);

      return {
        property: {
          id: property.id,
          name: property.name || 'Unnamed Property',
          location: property.location || 'Unknown Location',
          property_type: property.property_type || 'residential',
          total_value: property.total_value || 0,
          area_sqm: property.area_sqm,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          year_built: property.year_built,
          description: property.description || 'No description available',
          images: property.images || [],
          yield_rate: property.yield_rate,
          funded_amount_usd: property.funded_amount_usd,
          funded_percent: property.funded_percent,
          status: property.status || 'unknown'
        },
        market_data: {
          similar_properties: similarProperties,
          market_trends: marketData,
          location_metrics: {
            population_density: marketData.population_density,
            economic_indicators: marketData.economic_indicators,
            infrastructure_score: marketData.infrastructure_score,
            accessibility_score: marketData.accessibility_score
          }
        },
        financial_metrics: financialMetrics,
        risk_factors: riskFactors
      };
    } catch (error) {
      console.error('Error gathering property analysis data:', error);
      throw error;
    }
  }

  /**
   * Get market data for a specific location
   */
  private static getMarketDataForLocation(location: string) {
    if (!location || typeof location !== 'string') {
      console.log('Invalid location provided, using default Lagos data');
      return MOCK_MARKET_DATA['Lagos, Nigeria'];
    }

    // Try to match location with known cities
    for (const [city, data] of Object.entries(MOCK_MARKET_DATA)) {
      if (location.toLowerCase().includes(city.toLowerCase().split(',')[0])) {
        console.log(`Matched location "${location}" to city "${city}"`);
        return data;
      }
    }

    // Default to Lagos if no match found
    console.log(`No match found for location "${location}", using default Lagos data`);
    return MOCK_MARKET_DATA['Lagos, Nigeria'];
  }

  /**
   * Get similar properties for a location
   */
  private static getSimilarPropertiesForLocation(location: string) {
    if (!location || typeof location !== 'string') {
      console.log('Invalid location provided for similar properties, using default Lagos data');
      return MOCK_SIMILAR_PROPERTIES['Lagos, Nigeria'];
    }

    for (const [city, properties] of Object.entries(MOCK_SIMILAR_PROPERTIES)) {
      if (location.toLowerCase().includes(city.toLowerCase().split(',')[0])) {
        console.log(`Matched location "${location}" to similar properties for "${city}"`);
        return properties;
      }
    }

    console.log(`No similar properties match found for location "${location}", using default Lagos data`);
    return MOCK_SIMILAR_PROPERTIES['Lagos, Nigeria'];
  }

  /**
   * Calculate financial metrics for the property
   */
  private static calculateFinancialMetrics(property: any) {
    const yieldRateStr = property.yield_rate || '0%';
    const yieldRate = parseFloat(yieldRateStr.toString().replace('%', '')) || 0;
    const areaSqm = property.area_sqm || 1000; // Default area
    const totalValue = property.total_value || 0;
    const pricePerSqm = areaSqm > 0 ? totalValue / areaSqm : 0;
    
    // Estimate cap rate (simplified calculation)
    const capRate = yieldRate / 100;

    return {
      current_yield: yieldRate,
      price_per_sqm: pricePerSqm,
      capitalization_rate: capRate,
      debt_to_equity_ratio: 0.3, // Mock value
      occupancy_rate: 0.85 // Mock value
    };
  }

  /**
   * Assess risk factors for the property
   */
  private static assessRiskFactors(property: any, location: string) {
    const locationRisks: string[] = [];
    const marketRisks: string[] = [];
    const propertyRisks: string[] = [];
    const regulatoryRisks: string[] = [];

    // Ensure location is a valid string
    const safeLocation = location || 'unknown';

    // Location-specific risks
    if (safeLocation.toLowerCase().includes('lagos')) {
      locationRisks.push('High population density', 'Traffic congestion', 'Flood risk');
      marketRisks.push('Currency volatility', 'High inflation');
    } else if (safeLocation.toLowerCase().includes('nairobi')) {
      locationRisks.push('Infrastructure development needed');
      marketRisks.push('Regional economic dependency');
    } else if (safeLocation.toLowerCase().includes('cape town')) {
      locationRisks.push('Water scarcity concerns');
      marketRisks.push('Tourism dependency');
    } else if (safeLocation.toLowerCase().includes('accra')) {
      locationRisks.push('Infrastructure gaps');
      marketRisks.push('Oil price dependency');
    } else if (safeLocation.toLowerCase().includes('kigali')) {
      locationRisks.push('Landlocked country');
      marketRisks.push('Small domestic market');
    } else if (safeLocation.toLowerCase().includes('dar es salaam')) {
      locationRisks.push('Infrastructure development');
      marketRisks.push('Port dependency');
    } else {
      // Default risks for unknown locations
      locationRisks.push('Location-specific risks unknown');
      marketRisks.push('Market data limited');
    }

    // Property-specific risks
    if (property.year_built && property.year_built < 2000) {
      propertyRisks.push('Older building may need maintenance');
    }
    if (property.property_type === 'commercial') {
      propertyRisks.push('Tenant dependency risk');
    }
    if (!property.area_sqm) {
      propertyRisks.push('Missing area data');
    }

    // Regulatory risks (common across African markets)
    regulatoryRisks.push('Currency exchange regulations', 'Foreign ownership restrictions', 'Tax policy changes');

    return {
      location_risks: locationRisks,
      market_risks: marketRisks,
      property_risks: propertyRisks,
      regulatory_risks: regulatoryRisks
    };
  }

  /**
   * Generate enhanced prompt for AI analysis with comprehensive data
   */
  static generateEnhancedAnalysisPrompt(analysisData: PropertyAnalysisData): string {
    const { property, market_data, financial_metrics, risk_factors } = analysisData;

    return `
You are an expert real estate analyst specializing in African property markets. Analyze the following property with comprehensive market data and provide detailed valuation and risk assessment.

PROPERTY DETAILS:
- Name: ${property.name}
- Location: ${property.location}
- Type: ${property.property_type}
- Current Listed Value: $${property.total_value.toLocaleString()}
- Area: ${property.area_sqm ? `${property.area_sqm} sqm` : 'Not specified'}
- Bedrooms: ${property.bedrooms || 'Not specified'}
- Bathrooms: ${property.bathrooms || 'Not specified'}
- Year Built: ${property.year_built || 'Not specified'}
- Current Yield: ${property.yield_rate || 'Not specified'}
- Funding Status: ${property.funded_percent || 0}% funded
- Description: ${property.description}

MARKET DATA:
- Price per sqm: $${market_data.market_trends.price_per_sqm}
- Average Market Yield: ${market_data.market_trends.average_yield}%
- Market Activity: ${market_data.market_trends.market_activity}
- Price Trend: ${market_data.market_trends.price_trend}
- Population Density: ${market_data.location_metrics.population_density} per sq km
- Infrastructure Score: ${market_data.location_metrics.infrastructure_score}/10
- Accessibility Score: ${market_data.location_metrics.accessibility_score}/10
- Economic Indicators: ${market_data.location_metrics.economic_indicators.join(', ')}

FINANCIAL METRICS:
- Current Yield: ${financial_metrics.current_yield}%
- Price per sqm: $${financial_metrics.price_per_sqm.toFixed(2)}
- Capitalization Rate: ${(financial_metrics.capitalization_rate * 100).toFixed(2)}%
- Occupancy Rate: ${(financial_metrics.occupancy_rate * 100).toFixed(1)}%

SIMILAR PROPERTIES:
${market_data.similar_properties.map(p => 
  `- ${p.name}: $${p.price.toLocaleString()} (${p.area} sqm, ${p.yield}% yield, ${p.type})`
).join('\n')}

RISK FACTORS:
Location Risks: ${risk_factors.location_risks.join(', ')}
Market Risks: ${risk_factors.market_risks.join(', ')}
Property Risks: ${risk_factors.property_risks.join(', ')}
Regulatory Risks: ${risk_factors.regulatory_risks.join(', ')}

ANALYSIS REQUIREMENTS:
Provide a comprehensive analysis in the following JSON format:

{
  "valuation": {
    "estimated_value": <number>,
    "confidence_score": <number between 0-100>,
    "valuation_range": {
      "low": <number>,
      "high": <number>
    },
    "methodology": "<detailed explanation of valuation approach considering market data>"
  },
  "risk_score": {
    "overall_risk": <number between 1-10>,
    "risk_factors": {
      "location_risk": <number 1-10>,
      "market_risk": <number 1-10>,
      "property_risk": <number 1-10>,
      "liquidity_risk": <number 1-10>
    },
    "risk_analysis": "<detailed risk assessment considering all factors>"
  },
  "market_analysis": {
    "market_outlook": "<market conditions and trends specific to this location>",
    "growth_potential": <number 1-10>,
    "comparable_analysis": "<comparison with similar properties and market positioning>",
    "investment_recommendation": "<buy/hold/sell recommendation with detailed reasoning>"
  },
  "ai_insights": {
    "key_strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
    "potential_concerns": ["<concern 1>", "<concern 2>", "<concern 3>"],
    "optimization_suggestions": ["<suggestion 1>", "<suggestion 2>", "<suggestion 3>"]
  }
}

ANALYSIS GUIDELINES:
1. Consider the specific African market dynamics and economic indicators
2. Factor in infrastructure scores and accessibility metrics
3. Compare with similar properties in the same market
4. Assess tokenization potential and liquidity for this property type
5. Consider regulatory environment and political stability
6. Evaluate currency stability and inflation impact
7. Analyze population density and economic growth potential
8. Consider environmental and climate risks specific to the location
9. Assess property management and maintenance requirements
10. Evaluate exit strategy and resale potential in this market

Provide realistic, data-driven analysis that would be valuable for real estate investors and token holders in African markets.
`;
  }
}
