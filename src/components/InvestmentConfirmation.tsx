'use client';

import { useState } from 'react';
import Link from 'next/link';
import MagneticEffect from './MagneticEffect';
import { formatCurrency, formatDate } from '@/lib/utils';

interface InvestmentConfirmationProps {
  investment: {
    id: string;
    propertyName: string;
    amount: number;
    tokens: number;
    tokenPrice: number;
    yieldRate: string;
    expectedMonthlyReturn: number;
    transactionId: string;
    investedAt: string;
  };
  onClose: () => void;
}

export default function InvestmentConfirmation({ investment, onClose }: InvestmentConfirmationProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 max-w-md w-full backdrop-blur-xl">
        {/* Success Icon */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl text-emerald-400">✓</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Investment Successful!</h2>
          <p className="text-gray-400">
            Your investment has been confirmed and tokens will be issued within 24 hours.
          </p>
        </div>

        {/* Investment Details */}
        <div className="space-y-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Property</span>
            <span className="text-white font-medium">{investment.propertyName}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Investment Amount</span>
            <span className="text-white font-semibold">{formatCurrency(investment.amount)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Tokens Purchased</span>
            <span className="text-white font-medium">{investment.tokens.toLocaleString()}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Token Price</span>
            <span className="text-white font-medium">{formatCurrency(investment.tokenPrice)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Expected Monthly Return</span>
            <span className="text-emerald-400 font-semibold">{formatCurrency(investment.expectedMonthlyReturn)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Transaction ID</span>
            <span className="text-gray-400 text-sm font-mono">{investment.transactionId.slice(0, 8)}...</span>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
          <h3 className="text-white font-semibold mb-3">What&apos;s Next?</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-start space-x-2">
              <span className="text-emerald-400">1.</span>
              <span className="text-gray-300">Tokens will be issued to your wallet within 24 hours</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-emerald-400">2.</span>
              <span className="text-gray-300">You&apos;ll receive monthly yield payments starting next month</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-emerald-400">3.</span>
              <span className="text-gray-300">Track your investment performance in your portfolio</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <MagneticEffect>
            <Link href="/portfolio" className="block">
              <button className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 px-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 hover-lift">
                View Portfolio
              </button>
            </Link>
          </MagneticEffect>
          
          <MagneticEffect>
            <Link href="/properties" className="block">
              <button className="w-full border border-white/20 bg-white/5 text-white py-3 px-4 rounded-xl font-semibold hover:bg-white/10 transition-all duration-300 hover-lift">
                Browse More Properties
              </button>
            </Link>
          </MagneticEffect>
          
          <MagneticEffect>
            <button
              onClick={onClose}
              className="w-full text-gray-400 hover:text-white py-2 text-sm transition-colors"
            >
              Close
            </button>
          </MagneticEffect>
        </div>

        {/* Email Confirmation */}
        <div className="mt-6 pt-6 border-t border-white/10 text-center">
          <p className="text-gray-400 text-sm">
            A confirmation email has been sent to your registered email address.
          </p>
        </div>
      </div>
    </div>
  );
} 