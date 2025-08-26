'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import MagneticEffect from './MagneticEffect';

interface KYCVerificationProps {
  userId: string;
  currentStatus: 'unverified' | 'pending' | 'verified' | null;
  onStatusChange: (status: 'unverified' | 'pending' | 'verified') => void;
}

export default function KYCVerification({ userId, currentStatus, onStatusChange }: KYCVerificationProps) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'idle' | 'uploading' | 'processing' | 'complete'>('idle');

  const startVerification = async () => {
    setLoading(true);
    setStep('uploading');
    
    // Simulate document upload
    await new Promise(resolve => setTimeout(resolve, 2000));
    setStep('processing');
    
    // Update status to pending
    await supabase
      .from('profiles')
      .update({ kyc_status: 'pending' })
      .eq('id', userId);
    
    onStatusChange('pending');
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 3000));
    setStep('complete');
    
    // Update status to verified (in real app, this would be done by admin/automated system)
    await supabase
      .from('profiles')
      .update({ 
        kyc_status: 'verified',
        kyc_verified_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    onStatusChange('verified');
    setLoading(false);
    setStep('idle');
  };

  if (currentStatus === 'verified') {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
        <div className="flex items-center space-x-2">
          <span className="text-emerald-400">✓</span>
          <span className="text-emerald-400 font-medium">KYC Verification Complete</span>
        </div>
        <p className="text-emerald-400/70 text-sm mt-1">
          Your identity has been verified. You can now access all features.
        </p>
      </div>
    );
  }

  if (currentStatus === 'pending') {
    return (
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
        <div className="flex items-center space-x-2">
          <span className="text-yellow-400">⏳</span>
          <span className="text-yellow-400 font-medium">KYC Verification Pending</span>
        </div>
        <p className="text-yellow-400/70 text-sm mt-1">
          Your documents are being reviewed. This usually takes 1-2 business days.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <h3 className="text-white font-medium mb-2">KYC Verification Required</h3>
      <p className="text-gray-400 text-sm mb-4">
        Complete identity verification to access all features and increase your transaction limits.
      </p>
      
      {step === 'uploading' && (
        <div className="mb-4">
          <div className="flex items-center space-x-2 text-blue-400">
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            <span>Uploading documents...</span>
          </div>
        </div>
      )}
      
      {step === 'processing' && (
        <div className="mb-4">
          <div className="flex items-center space-x-2 text-yellow-400">
            <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
            <span>Processing verification...</span>
          </div>
        </div>
      )}
      
      <MagneticEffect>
        <button
          onClick={startVerification}
          disabled={loading}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-2 px-4 rounded-lg font-medium hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 hover-lift disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Start KYC Verification'}
        </button>
      </MagneticEffect>
      
      <p className="text-gray-500 text-xs mt-2">
        This is a simulation. In production, this would require real document upload and verification.
      </p>
    </div>
  );
} 