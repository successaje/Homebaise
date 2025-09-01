'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';

interface CertificateData {
  tokenId: string;
  certificateNumber: string;
  metadataUrl: string;
  issuedAt: string;
}

interface CertificateMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number | boolean;
  }>;
  certificate_data: {
    propertyName: string;
    location: string;
    totalValue: number;
    status: string;
    metadata: {
      complianceScore: number;
      kycVerified: boolean;
      legalDocsValidated: boolean;
      ownershipConfirmed: boolean;
      tokenized: boolean;
    };
  };
}

interface PropertyCertificateProps {
  propertyId: string;
  certificateData?: CertificateData;
  onGenerateCertificate?: (verificationData: {
    kycVerified: boolean;
    legalDocsValidated: boolean;
    ownershipConfirmed: boolean;
    tokenized: boolean;
  }) => Promise<void>;
  isGenerating?: boolean;
}

export default function PropertyCertificate({
  certificateData,
  onGenerateCertificate,
  isGenerating = false
}: PropertyCertificateProps) {
  const [metadata, setMetadata] = useState<CertificateMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [verificationData, setVerificationData] = useState({
    kycVerified: false,
    legalDocsValidated: false,
    ownershipConfirmed: false,
    tokenized: false
  });

  const fetchMetadata = useCallback(async () => {
    if (!certificateData?.metadataUrl) return;
    
    setLoading(true);
    try {
      const response = await fetch(certificateData.metadataUrl);
      if (!response.ok) throw new Error('Failed to fetch metadata');
      const data = await response.json();
      setMetadata(data);
    } catch (error) {
      console.error('Error fetching certificate metadata:', error);
      toast.error('Failed to load certificate metadata');
    } finally {
      setLoading(false);
    }
  }, [certificateData?.metadataUrl]);

  useEffect(() => {
    if (certificateData?.metadataUrl) {
      fetchMetadata();
    }
  }, [certificateData, fetchMetadata]);

  const handleGenerateCertificate = async () => {
    if (!onGenerateCertificate) return;
    
    try {
      await onGenerateCertificate(verificationData);
      setShowGenerateForm(false);
      toast.success('Certificate generated successfully!');
    } catch (error) {
      console.error('Error generating certificate:', error);
      toast.error('Failed to generate certificate');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!certificateData && !showGenerateForm) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Certificate Generated</h3>
          <p className="text-gray-600 mb-4">This property hasn&apos;t been verified and certified yet.</p>
          {onGenerateCertificate && (
            <button
              onClick={() => setShowGenerateForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Generate Certificate
            </button>
          )}
        </div>
      </div>
    );
  }

  if (showGenerateForm) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Verification Certificate</h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={verificationData.kycVerified}
                onChange={(e) => setVerificationData(prev => ({ ...prev, kycVerified: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">KYC Verified</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={verificationData.legalDocsValidated}
                onChange={(e) => setVerificationData(prev => ({ ...prev, legalDocsValidated: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Legal Docs Validated</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={verificationData.ownershipConfirmed}
                onChange={(e) => setVerificationData(prev => ({ ...prev, ownershipConfirmed: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Ownership Confirmed</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={verificationData.tokenized}
                onChange={(e) => setVerificationData(prev => ({ ...prev, tokenized: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Tokenized</span>
            </label>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleGenerateCertificate}
              disabled={isGenerating}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isGenerating ? 'Generating...' : 'Generate Certificate'}
            </button>
            <button
              onClick={() => setShowGenerateForm(false)}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!metadata) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center text-gray-500">
          <p>Certificate data not available</p>
        </div>
      </div>
    );
  }

  const complianceScore = metadata.certificate_data.metadata.complianceScore;
  const scoreColor = complianceScore >= 90 ? 'text-green-600' : 
                    complianceScore >= 70 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Certificate Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">Property Verification Certificate</h3>
            <p className="text-blue-100 text-sm">Certificate #{metadata.certificate_data.certificateNumber}</p>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${scoreColor}`}>
              {complianceScore}%
            </div>
            <div className="text-blue-100 text-sm">Compliance Score</div>
          </div>
        </div>
      </div>

      {/* Certificate Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Property Details */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Property Information</h4>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-500">Property Name:</span>
                <p className="font-medium">{metadata.certificate_data.propertyName}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Location:</span>
                <p className="font-medium">{metadata.certificate_data.location}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Total Value:</span>
                <p className="font-medium">${metadata.certificate_data.totalValue.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Verification Status */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Verification Status</h4>
            <div className="space-y-2">
              {metadata.attributes.slice(3, 7).map((attr, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{attr.trait_type}:</span>
                  <span className={`text-sm font-medium ${attr.value ? 'text-green-600' : 'text-red-600'}`}>
                    {attr.value ? '✓ Verified' : '✗ Not Verified'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Certificate Details */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-3">Certificate Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-sm text-gray-500">Token ID:</span>
              <div className="flex items-center space-x-2">
                <p className="font-mono text-sm truncate">{metadata.certificate_data.tokenId}</p>
                <button
                  onClick={() => copyToClipboard(metadata.certificate_data.tokenId, 'Token ID')}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
            <div>
              <span className="text-sm text-gray-500">Issued Date:</span>
              <p className="font-medium">{new Date(metadata.certificate_data.issuedDate).toLocaleDateString()}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Status:</span>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                metadata.certificate_data.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {metadata.certificate_data.status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Certificate Image */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-3">Certificate Preview</h4>
                     <div className="flex justify-center">
             {/* eslint-disable-next-line @next/next/no-img-element */}
             <img 
               src={metadata.image} 
               alt="Certificate Preview" 
               className="max-w-full h-auto rounded-lg shadow-sm"
               style={{ maxHeight: '400px' }}
             />
           </div>
        </div>
      </div>
    </div>
  );
} 