export interface Property {
  id: string;
  name: string;
  location: string;
  country: string;
  city: string;
  propertyType: 'residential' | 'commercial' | 'agricultural' | 'mixed-use' | 'land';
  image: string;
  images: string[];
  totalValueUSD: number;
  tokenPriceUSD: number;
  fundedPercent: number;
  tokensTotal: number;
  tokensAvailable: number;
  description: string;
  longDescription: string;
  yieldRate: string;
  expectedReturn: string;
  minInvestment: number;
  maxInvestment: number;
  propertySize: string;
  bedrooms?: number;
  bathrooms?: number;
  yearBuilt?: number;
  features: string[];
  amenities: string[];
  investmentHighlights: string[];
  risks: string[];
  documents: string[];
  status: 'active' | 'funded' | 'sold' | 'coming-soon';
  createdAt: string;
  closingDate: string;
  propertyManager: string;
  legalStatus: string;
  occupancyRate?: number;
  rentalIncome?: number;
  appreciationRate: string;
}

// Example mock data for properties/farms
export const properties: Property[] = [
  {
    id: "1",
    name: "Lagos Marina Luxury Apartments",
    location: "Victoria Island, Lagos",
    country: "Nigeria",
    city: "Lagos",
    propertyType: "residential",
    image: "/images/lagos-marina.jpg",
    images: [
      "/images/lagos-marina-1.jpg",
      "/images/lagos-marina-2.jpg",
      "/images/lagos-marina-3.jpg",
      "/images/lagos-marina-4.jpg"
    ],
    totalValueUSD: 2500000,
    tokenPriceUSD: 100,
    fundedPercent: 75,
    tokensTotal: 25000,
    tokensAvailable: 6250,
    description: "Premium waterfront apartments in the heart of Lagos business district.",
    longDescription: "This luxury residential development offers 50 premium apartments with stunning ocean views, modern amenities, and 24/7 security. Located in the prestigious Victoria Island area, this property provides excellent rental yields and strong capital appreciation potential.",
    yieldRate: "12% APY",
    expectedReturn: "15-20% annually",
    minInvestment: 1000,
    maxInvestment: 100000,
    propertySize: "15,000 sq ft",
    bedrooms: 50,
    bathrooms: 75,
    yearBuilt: 2023,
    features: ["Ocean View", "24/7 Security", "Swimming Pool", "Gym", "Parking"],
    amenities: ["Concierge Service", "High-Speed Internet", "Air Conditioning", "Modern Kitchen", "Balcony"],
    investmentHighlights: [
      "Prime location in Lagos business district",
      "High rental demand from expatriates",
      "Strong capital appreciation potential",
      "Professional property management",
      "Diversified tenant base"
    ],
    risks: [
      "Currency fluctuation risk",
      "Market volatility",
      "Regulatory changes",
      "Property management risks"
    ],
    documents: ["Property Deed", "Building Permit", "Environmental Assessment", "Financial Projections"],
    status: "active",
    createdAt: "2024-01-15",
    closingDate: "2024-06-30",
    propertyManager: "Lagos Property Management Ltd",
    legalStatus: "Freehold",
    occupancyRate: 95,
    rentalIncome: 250000,
    appreciationRate: "8% annually"
  },
  {
    id: "2",
    name: "Nairobi Tech Hub Office Complex",
    location: "Westlands, Nairobi",
    country: "Kenya",
    city: "Nairobi",
    propertyType: "commercial",
    image: "/images/nairobi-tech-hub.jpg",
    images: [
      "/images/nairobi-tech-hub-1.jpg",
      "/images/nairobi-tech-hub-2.jpg",
      "/images/nairobi-tech-hub-3.jpg"
    ],
    totalValueUSD: 1800000,
    tokenPriceUSD: 50,
    fundedPercent: 60,
    tokensTotal: 36000,
    tokensAvailable: 14400,
    description: "Modern office complex catering to Kenya's booming tech sector.",
    longDescription: "A state-of-the-art office complex designed specifically for technology companies, startups, and innovation hubs. Features flexible workspace solutions, high-speed internet, and collaborative areas.",
    yieldRate: "10% APY",
    expectedReturn: "12-18% annually",
    minInvestment: 500,
    maxInvestment: 50000,
    propertySize: "25,000 sq ft",
    features: ["High-Speed Internet", "Conference Rooms", "Flexible Workspaces", "Security System"],
    amenities: ["Cafeteria", "Meeting Rooms", "Parking", "Reception", "Cleaning Services"],
    investmentHighlights: [
      "Growing tech sector in Nairobi",
      "High demand for quality office space",
      "Long-term lease agreements",
      "Professional tenant base",
      "Modern infrastructure"
    ],
    risks: [
      "Economic downturn impact",
      "Technology sector volatility",
      "Competition from new developments",
      "Infrastructure challenges"
    ],
    documents: ["Commercial Lease", "Building Certificate", "Business License", "Insurance Policy"],
    status: "active",
    createdAt: "2024-02-01",
    closingDate: "2024-08-15",
    propertyManager: "Nairobi Commercial Properties",
    legalStatus: "Leasehold",
    occupancyRate: 88,
    rentalIncome: 180000,
    appreciationRate: "6% annually"
  },
  {
    id: "3",
    name: "Cape Town Vineyard Estate",
    location: "Stellenbosch, Western Cape",
    country: "South Africa",
    city: "Cape Town",
    propertyType: "agricultural",
    image: "/images/cape-town-vineyard.jpg",
    images: [
      "/images/cape-town-vineyard-1.jpg",
      "/images/cape-town-vineyard-2.jpg",
      "/images/cape-town-vineyard-3.jpg"
    ],
    totalValueUSD: 3200000,
    tokenPriceUSD: 200,
    fundedPercent: 45,
    tokensTotal: 16000,
    tokensAvailable: 8800,
    description: "Premium wine-producing vineyard with tourism potential.",
    longDescription: "A 50-hectare vineyard producing premium wines for export markets. Includes wine tasting facilities, restaurant, and accommodation for wine tourism. Established brand with international distribution.",
    yieldRate: "8% APY",
    expectedReturn: "10-15% annually",
    minInvestment: 2000,
    maxInvestment: 200000,
    propertySize: "50 hectares",
    features: ["Vineyard", "Wine Cellar", "Tasting Room", "Restaurant", "Accommodation"],
    amenities: ["Wine Tours", "Restaurant", "Luxury Accommodation", "Event Spaces", "Wine Shop"],
    investmentHighlights: [
      "Established wine brand",
      "International export market",
      "Tourism revenue stream",
      "Premium wine production",
      "Diversified income sources"
    ],
    risks: [
      "Climate change impact",
      "Disease outbreaks",
      "Export market volatility",
      "Tourism seasonality"
    ],
    documents: ["Agricultural License", "Wine Production Permit", "Export Certificates", "Tourism License"],
    status: "active",
    createdAt: "2024-01-20",
    closingDate: "2024-09-30",
    propertyManager: "Stellenbosch Wine Estates",
    legalStatus: "Freehold",
    rentalIncome: 320000,
    appreciationRate: "5% annually"
  },
  {
    id: "4",
    name: "Accra Mixed-Use Development",
    location: "East Legon, Accra",
    country: "Ghana",
    city: "Accra",
    propertyType: "mixed-use",
    image: "/images/accra-mixed-use.jpg",
    images: [
      "/images/accra-mixed-use-1.jpg",
      "/images/accra-mixed-use-2.jpg"
    ],
    totalValueUSD: 4200000,
    tokenPriceUSD: 150,
    fundedPercent: 30,
    tokensTotal: 28000,
    tokensAvailable: 19600,
    description: "Modern mixed-use development combining retail, office, and residential spaces.",
    longDescription: "A comprehensive development featuring ground-floor retail spaces, mid-level offices, and luxury residential units. Located in the fast-growing East Legon area with excellent transport links.",
    yieldRate: "11% APY",
    expectedReturn: "14-20% annually",
    minInvestment: 1500,
    maxInvestment: 150000,
    propertySize: "45,000 sq ft",
    bedrooms: 80,
    bathrooms: 120,
    yearBuilt: 2024,
    features: ["Retail Spaces", "Office Units", "Residential Apartments", "Parking Garage"],
    amenities: ["Shopping Center", "Food Court", "Fitness Center", "Security", "Maintenance"],
    investmentHighlights: [
      "Diversified income streams",
      "Prime location in growing area",
      "Mixed-use zoning benefits",
      "Strong local demand",
      "Modern infrastructure"
    ],
    risks: [
      "Construction delays",
      "Market absorption risk",
      "Economic factors",
      "Competition from similar projects"
    ],
    documents: ["Development Permit", "Zoning Certificate", "Construction License", "Financial Model"],
    status: "active",
    createdAt: "2024-03-01",
    closingDate: "2024-12-31",
    propertyManager: "Accra Development Partners",
    legalStatus: "Freehold",
    rentalIncome: 420000,
    appreciationRate: "7% annually"
  },
  {
    id: "5",
    name: "Kigali Innovation District Land",
    location: "Kigali Special Economic Zone",
    country: "Rwanda",
    city: "Kigali",
    propertyType: "land",
    image: "/images/kigali-land.jpg",
    images: [
      "/images/kigali-land-1.jpg",
      "/images/kigali-land-2.jpg"
    ],
    totalValueUSD: 800000,
    tokenPriceUSD: 25,
    fundedPercent: 90,
    tokensTotal: 32000,
    tokensAvailable: 3200,
    description: "Prime development land in Rwanda's fastest-growing economic zone.",
    longDescription: "Strategic land parcel in the Kigali Special Economic Zone, approved for commercial and industrial development. Excellent infrastructure and government incentives for investors.",
    yieldRate: "15% APY",
    expectedReturn: "20-30% annually",
    minInvestment: 250,
    maxInvestment: 25000,
    propertySize: "10 hectares",
    features: ["Development Ready", "Infrastructure Access", "Government Incentives", "Strategic Location"],
    amenities: ["Road Access", "Utilities", "Security", "Development Support"],
    investmentHighlights: [
      "Government-backed economic zone",
      "Tax incentives for investors",
      "Infrastructure already in place",
      "High growth potential",
      "Strategic location"
    ],
    risks: [
      "Development timeline uncertainty",
      "Regulatory changes",
      "Market timing risk",
      "Infrastructure delays"
    ],
    documents: ["Land Title", "Development Permit", "Environmental Assessment", "Infrastructure Plan"],
    status: "active",
    createdAt: "2024-02-15",
    closingDate: "2024-07-31",
    propertyManager: "Rwanda Investment Authority",
    legalStatus: "Leasehold",
    appreciationRate: "12% annually"
  }
];

export const getPropertyById = (id: string): Property | undefined => {
  return properties.find(property => property.id === id);
};

export const getPropertiesByType = (type: Property['propertyType']): Property[] => {
  return properties.filter(property => property.propertyType === type);
};

export const getPropertiesByCountry = (country: string): Property[] => {
  return properties.filter(property => property.country === country);
};

export const searchProperties = (query: string): Property[] => {
  const lowercaseQuery = query.toLowerCase();
  return properties.filter(property => 
    property.name.toLowerCase().includes(lowercaseQuery) ||
    property.location.toLowerCase().includes(lowercaseQuery) ||
    property.description.toLowerCase().includes(lowercaseQuery) ||
    property.country.toLowerCase().includes(lowercaseQuery) ||
    property.city.toLowerCase().includes(lowercaseQuery)
  );
};
