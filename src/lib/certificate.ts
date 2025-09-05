import { mintCertificateNFT } from './hedera';
import { uploadToIPFS } from './ipfs';

export interface PropertyCertificate {
  propertyId: string;
  propertyName: string;
  location: string;
  totalValue: number;
  certificateNumber: string;
  issuedDate: string;
  verifiedBy: string;
  certificateType: 'verification' | 'tokenization' | 'compliance';
  status: 'active' | 'suspended' | 'expired';
  metadata: {
    kycVerified: boolean;
    legalDocsValidated: boolean;
    ownershipConfirmed: boolean;
    complianceScore: number;
  };
}

export interface CertificateMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number | boolean;
  }>;
  external_url: string;
  certificate_data: PropertyCertificate;
}

export function generateCertificateNumber(propertyId: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `CERT-${propertyId.substring(0, 8)}-${timestamp}-${random}`.toUpperCase();
}

export function createCertificateMetadata(certificate: PropertyCertificate): CertificateMetadata {
  const statusColor = {
    active: '#10B981',
    suspended: '#F59E0B',
    expired: '#EF4444'
  };

  const complianceScore = certificate.metadata.complianceScore;
  const scoreColor = complianceScore >= 90 ? '#10B981' : 
                    complianceScore >= 70 ? '#F59E0B' : '#EF4444';

  return {
    name: `Property Verification Certificate - ${certificate.propertyName}`,
    description: `Official verification certificate for ${certificate.propertyName} located in ${certificate.location}. This certificate confirms that the property has undergone comprehensive due diligence and meets all platform compliance requirements.`,
    image: `data:image/svg+xml;base64,${Buffer.from(`
      <svg width="400" height="600" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#1F2937;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#374151;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="400" height="600" fill="url(#bg)"/>
        
        <!-- Header -->
        <rect x="20" y="20" width="360" height="80" fill="#3B82F6" rx="8"/>
        <text x="200" y="45" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="16" font-weight="bold">PROPERTY VERIFICATION</text>
        <text x="200" y="65" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="12">CERTIFICATE</text>
        
        <!-- Certificate Number -->
        <text x="200" y="120" text-anchor="middle" fill="#E5E7EB" font-family="Arial, sans-serif" font-size="14" font-weight="bold">Certificate #${certificate.certificateNumber}</text>
        
        <!-- Property Info -->
        <rect x="30" y="140" width="340" height="120" fill="#374151" rx="6"/>
        <text x="200" y="160" text-anchor="middle" fill="#F9FAFB" font-family="Arial, sans-serif" font-size="16" font-weight="bold">${certificate.propertyName}</text>
        <text x="200" y="180" text-anchor="middle" fill="#D1D5DB" font-family="Arial, sans-serif" font-size="12">${certificate.location}</text>
        <text x="200" y="200" text-anchor="middle" fill="#D1D5DB" font-family="Arial, sans-serif" font-size="12">Value: $${certificate.totalValue.toLocaleString()}</text>
        
        <!-- Status Badge -->
        <circle cx="200" cy="230" r="8" fill="${statusColor[certificate.status]}"/>
        <text x="220" y="235" fill="#F9FAFB" font-family="Arial, sans-serif" font-size="12">${certificate.status.toUpperCase()}</text>
        
        <!-- Compliance Score -->
        <text x="200" y="280" text-anchor="middle" fill="#F9FAFB" font-family="Arial, sans-serif" font-size="14" font-weight="bold">Compliance Score</text>
        <circle cx="200" cy="310" r="30" fill="none" stroke="${scoreColor}" stroke-width="4"/>
        <text x="200" y="315" text-anchor="middle" fill="${scoreColor}" font-family="Arial, sans-serif" font-size="16" font-weight="bold">${complianceScore}%</text>
        
        <!-- Verification Checks -->
        <rect x="30" y="360" width="340" height="120" fill="#374151" rx="6"/>
        <text x="200" y="380" text-anchor="middle" fill="#F9FAFB" font-family="Arial, sans-serif" font-size="14" font-weight="bold">Verification Status</text>
        
        <text x="50" y="405" fill="#D1D5DB" font-family="Arial, sans-serif" font-size="11">KYC Verified: ${certificate.metadata.kycVerified ? '✓' : '✗'}</text>
        <text x="50" y="420" fill="#D1D5DB" font-family="Arial, sans-serif" font-size="11">Legal Docs: ${certificate.metadata.legalDocsValidated ? '✓' : '✗'}</text>
        <text x="50" y="435" fill="#D1D5DB" font-family="Arial, sans-serif" font-size="11">Ownership: ${certificate.metadata.ownershipConfirmed ? '✓' : '✗'}</text>
        
        <!-- Footer -->
        <text x="200" y="520" text-anchor="middle" fill="#9CA3AF" font-family="Arial, sans-serif" font-size="10">Issued: ${new Date(certificate.issuedDate).toLocaleDateString()}</text>
        <text x="200" y="535" text-anchor="middle" fill="#9CA3AF" font-family="Arial, sans-serif" font-size="10">Verified by: ${certificate.verifiedBy}</text>
        <text x="200" y="570" text-anchor="middle" fill="#6B7280" font-family="Arial, sans-serif" font-size="8">This certificate is stored on Hedera Hashgraph</text>
      </svg>
    `).toString('base64')}`,
    attributes: [
      { trait_type: 'Certificate Type', value: certificate.certificateType },
      { trait_type: 'Status', value: certificate.status },
      { trait_type: 'Compliance Score', value: complianceScore },
      { trait_type: 'KYC Verified', value: certificate.metadata.kycVerified },
      { trait_type: 'Legal Docs Validated', value: certificate.metadata.legalDocsValidated },
      { trait_type: 'Ownership Confirmed', value: certificate.metadata.ownershipConfirmed },
      { trait_type: 'Property Value', value: `$${certificate.totalValue.toLocaleString()}` },
      { trait_type: 'Location', value: certificate.location },
      { trait_type: 'Issued Date', value: certificate.issuedDate }
    ],
    external_url: `${process.env.NEXT_PUBLIC_APP_URL}/properties/${certificate.propertyId}`,
    certificate_data: certificate
  };
}

export async function generatePropertyCertificate(
  property: {
    id: string;
    name: string;
    location: string;
    total_value: number;
    listed_by: string;
  },
  verificationData: {
    kycVerified: boolean;
    legalDocsValidated: boolean;
    ownershipConfirmed: boolean;
  }
): Promise<{ tokenId: string; certificateNumber: string; metadataUrl: string }> {
  console.log('Starting certificate generation for property:', property.id);
  
  try {
  const certificateNumber = generateCertificateNumber(property.id);
  
  // Calculate compliance score based on verification data
  const complianceScore = [
    verificationData.kycVerified,
    verificationData.legalDocsValidated,
    verificationData.ownershipConfirmed
  ].filter(Boolean).length * 33.33; // 3 checks = 100% max

  const certificate: PropertyCertificate = {
    propertyId: property.id,
    propertyName: property.name,
    location: property.location,
    totalValue: property.total_value,
    certificateNumber,
    issuedDate: new Date().toISOString(),
    verifiedBy: 'HomeBaise Platform',
    certificateType: 'verification',
    status: 'active',
    metadata: {
      ...verificationData,
      complianceScore
    }
  };

  const metadata = createCertificateMetadata(certificate);
  console.log('Created certificate metadata');
  
  // Upload metadata to IPFS
  console.log('Uploading metadata to IPFS...');
  const metadataUrl = await uploadToIPFS(JSON.stringify(metadata, null, 2));
  console.log('Metadata uploaded to IPFS:', metadataUrl);
  
  // Mint NFT from pre-deployed certificate contract
  console.log('Minting NFT from pre-deployed certificate contract...');
  const result = await mintCertificateNFT({
    tokenName: `Property Certificate - ${property.name}`,
    tokenSymbol: 'PROPCERT',
    metadataUrl: metadataUrl
  });
  console.log('Certificate NFT minted:', result.tokenId, 'Serial:', result.serialNumber);

    console.log('Certificate generation completed successfully');
    return {
      tokenId: result.tokenId,
      certificateNumber,
      metadataUrl
    };
  } catch (error) {
    console.error('Error in generatePropertyCertificate:', error);
    throw error;
  }
} 