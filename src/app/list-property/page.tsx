'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MagneticEffect from '@/components/MagneticEffect';
import ScrollAnimations from '@/components/ScrollAnimations';
import { supabase } from '@/lib/supabase';

interface PropertyForm {
  title: string;
  description: string;
  propertyType: 'residential' | 'commercial' | 'industrial' | 'land' | 'agricultural';
  country: string;
  city: string;
  address: string;
  totalValue: number;
  tokenPrice: number;
  minInvestment: number;
  maxInvestment: number;
  yieldRate: string;
  images: File[];
  documents: File[];
}

export default function ListPropertyPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [form, setForm] = useState<PropertyForm>({
    title: '',
    description: '',
    propertyType: 'residential',
    country: '',
    city: '',
    address: '',
    totalValue: 0,
    tokenPrice: 0,
    minInvestment: 0,
    maxInvestment: 0,
    yieldRate: '',
    images: [],
    documents: []
  });



  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data: profile } = await supabase
          .from('profiles')
          .select('kyc_status')
          .eq('id', user.id)
          .single();
        
        setIsVerified(profile?.kyc_status === 'verified');
      } else {
        router.push('/auth');
      }
    } catch (error) {
      console.error('Error checking user:', error);
      router.push('/auth');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (field: 'images' | 'documents', files: FileList | null) => {
    if (files) {
      const fileArray = Array.from(files);
      setForm(prev => ({ ...prev, [field]: [...prev[field], ...fileArray] }));
    }
  };

  const removeFile = (field: 'images' | 'documents', index: number) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const uploadToIPFS = async (files: File[]): Promise<string[]> => {
    const cids: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(((i + 1) / files.length) * 100);
      
      try {
        // Use Pinata for IPFS upload
        const { uploadFileToIPFSFinal } = await import('@/lib/ipfs');
        const result = await uploadFileToIPFSFinal(file);
        cids.push(result.cid);
      } catch (error) {
        console.error('Error uploading to IPFS:', error);
        throw new Error(`Failed to upload ${file.name} to IPFS`);
      }
    }
    
    return cids;
  };

  const handleSubmit = async () => {
    if (!isVerified) {
      alert('Only verified users can list properties. Please complete KYC verification first.');
      return;
    }

    if (!form.title || !form.description || !form.country || !form.city || !form.address) {
      alert('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      // Upload images to IPFS
      const imageCids = await uploadToIPFS(form.images);
      
      // Upload documents to IPFS
      const documentCids = await uploadToIPFS(form.documents);

      // Create property metadata for IPFS
      const propertyMetadata = {
        ...form,
        images: imageCids,
        documents: documentCids,
        listedBy: user.id,
        listedAt: new Date().toISOString(),
        status: 'pending_review'
      };

      // Upload metadata to IPFS
      const metadataCid = await uploadToIPFS([new File([JSON.stringify(propertyMetadata)], 'metadata.json')]);

      // Save to Supabase
      const { data, error } = await supabase
        .from('properties')
        .insert({
          title: form.title,
          description: form.description,
          property_type: form.propertyType,
          country: form.country,
          city: form.city,
          address: form.address,
          total_value: form.totalValue,
          token_price: form.tokenPrice,
          min_investment: form.minInvestment,
          max_investment: form.maxInvestment,
          yield_rate: form.yieldRate,
          ipfs_metadata_cid: metadataCid[0],
          ipfs_image_cids: imageCids,
          ipfs_document_cids: documentCids,
          listed_by: user.id,
          status: 'pending_review'
        });

      if (error) {
        throw error;
      }

      alert('Property listed successfully! It will be reviewed by our team within 24-48 hours.');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error listing property:', error);
      alert('Error listing property. Please try again.');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className="min-h-screen bg-black particles">
        <nav className="fixed w-full bg-black/80 backdrop-blur-xl border-b border-white/10 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center animate-glow">
                  <span className="text-white font-bold text-sm">H</span>
                </div>
                <span className="text-xl font-bold text-white">Homebaise</span>
              </Link>
            </div>
          </div>
        </nav>

        <div className="pt-24 pb-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
              <div className="text-6xl mb-6">🔒</div>
              <h1 className="text-3xl font-bold text-white mb-4">Verification Required</h1>
              <p className="text-gray-400 mb-6">
                Only verified users can list properties on Homebaise. Please complete KYC verification first.
              </p>
              <MagneticEffect>
                <Link href="/profile">
                  <button className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 hover-lift">
                    Complete KYC Verification
                  </button>
                </Link>
              </MagneticEffect>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black particles">
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
              <span className="text-emerald-400 font-medium">✓ Verified User</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollAnimations animationType="fade-in-up">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-white mb-4">List Your Property</h1>
              <p className="text-gray-400 text-lg">
                Tokenize your real estate asset and make it available for global investment
              </p>
            </div>

            {/* Upload Progress */}
            {isSubmitting && (
              <div className="mb-8 bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-semibold">Uploading to IPFS...</span>
                  <span className="text-emerald-400">{Math.round(uploadProgress)}%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Property Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white font-medium mb-2">Property Title *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g., Lagos Luxury Apartments"
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Property Type *</label>
                  <select
                    value={form.propertyType}
                    onChange={(e) => handleInputChange('propertyType', e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                    <option value="industrial">Industrial</option>
                    <option value="land">Land</option>
                    <option value="agricultural">Agricultural</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Country *</label>
                  <input
                    type="text"
                    value={form.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g., Nigeria"
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">City *</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g., Lagos"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-white font-medium mb-2">Address *</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Full property address"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-white font-medium mb-2">Description *</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Detailed description of the property..."
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Total Property Value *</label>
                  <input
                    type="number"
                    value={form.totalValue}
                    onChange={(e) => handleInputChange('totalValue', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Token Price *</label>
                  <input
                    type="number"
                    value={form.tokenPrice}
                    onChange={(e) => handleInputChange('tokenPrice', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Minimum Investment *</label>
                  <input
                    type="number"
                    value={form.minInvestment}
                    onChange={(e) => handleInputChange('minInvestment', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Maximum Investment *</label>
                  <input
                    type="number"
                    value={form.maxInvestment}
                    onChange={(e) => handleInputChange('maxInvestment', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Yield Rate *</label>
                  <input
                    type="text"
                    value={form.yieldRate}
                    onChange={(e) => handleInputChange('yieldRate', e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g., 12% APY"
                  />
                </div>
              </div>

              {/* File Upload Section */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-white mb-4">Property Images & Documents</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-white font-medium mb-2">Property Images</label>
                    <div className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => handleFileUpload('images', e.target.files)}
                        className="hidden"
                        id="image-upload"
                      />
                      <label htmlFor="image-upload" className="cursor-pointer">
                        <div className="text-4xl mb-2">📸</div>
                        <div className="text-gray-400">Click to upload images</div>
                        <div className="text-gray-500 text-sm">PNG, JPG up to 10MB each</div>
                      </label>
                    </div>
                    
                    {form.images.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {form.images.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                            <span className="text-white text-sm">{file.name}</span>
                            <button
                              onClick={() => removeFile('images', index)}
                              className="text-red-400 hover:text-red-300"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">Legal Documents</label>
                    <div className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center">
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => handleFileUpload('documents', e.target.files)}
                        className="hidden"
                        id="document-upload"
                      />
                      <label htmlFor="document-upload" className="cursor-pointer">
                        <div className="text-4xl mb-2">📄</div>
                        <div className="text-gray-400">Click to upload documents</div>
                        <div className="text-gray-500 text-sm">PDF, DOC up to 20MB each</div>
                      </label>
                    </div>
                    
                    {form.documents.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {form.documents.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                            <span className="text-white text-sm">{file.name}</span>
                            <button
                              onClick={() => removeFile('documents', index)}
                              className="text-red-400 hover:text-red-300"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <MagneticEffect>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 hover-lift disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Listing Property...' : 'List Property'}
                  </button>
                </MagneticEffect>
              </div>
            </div>
          </ScrollAnimations>
        </div>
      </div>
    </div>
  );
}
