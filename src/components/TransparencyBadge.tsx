'use client';

import React from 'react';
import { getHashScanTopicUrl, getHashScanTransactionUrl } from '@/lib/hedera-hcs';

interface TransparencyBadgeProps {
  topicId?: string;
  transactionId?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export default function TransparencyBadge({ 
  topicId, 
  transactionId,
  className = '',
  size = 'md',
  showText = true
}: TransparencyBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-2',
    lg: 'text-base px-4 py-3'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const handleClick = () => {
    if (topicId) {
      window.open(getHashScanTopicUrl(topicId), '_blank');
    } else if (transactionId) {
      window.open(getHashScanTransactionUrl(transactionId), '_blank');
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`
        inline-flex items-center space-x-2
        bg-gradient-to-r from-green-500/20 to-emerald-500/20
        border border-green-500/30
        rounded-full
        text-green-300
        hover:from-green-500/30 hover:to-emerald-500/30
        hover:border-green-500/50
        transition-all duration-300
        ${sizeClasses[size]}
        ${className}
      `}
      title="View on Hedera HashScan - All transactions are verifiable on blockchain"
    >
      <svg 
        className={`${iconSizes[size]} text-green-400`}
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
        />
      </svg>
      {showText && (
        <span className="font-medium">
          Verified on Hedera
        </span>
      )}
    </button>
  );
}

// Compact version for investment records
export function InvestmentTransparencyBadge({ 
  transactionId, 
  topicId,
  className = '' 
}: { 
  transactionId?: string; 
  topicId?: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <TransparencyBadge 
        transactionId={transactionId}
        topicId={topicId}
        size="sm"
        showText={false}
      />
      <span className="text-xs text-gray-400">
        Verifiable on blockchain
      </span>
    </div>
  );
}

// Full transparency section for property pages
export function TransparencySection({ 
  topicId, 
  className = '' 
}: { 
  topicId?: string; 
  className?: string;
}) {
  if (!topicId) return null;

  return (
    <div className={`bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center mr-4">
            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">
              Blockchain Transparency
            </h3>
            <p className="text-gray-300 text-sm">
              All transactions are recorded on Hedera Consensus Service
            </p>
          </div>
        </div>
        
        <div className="flex flex-col items-end space-y-2">
          <TransparencyBadge 
            topicId={topicId}
            size="md"
            showText={true}
          />
          <a
            href={getHashScanTopicUrl(topicId)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            View on HashScan →
          </a>
        </div>
      </div>
    </div>
  );
}
