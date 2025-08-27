'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import MagneticEffect from './MagneticEffect';

interface HederaAccountCreatorProps {
  onAccountCreated: (accountId: string, evmAddress: string) => void;
  className?: string;
}

interface AccountDetails {
  accountId: string;
  evmAddress: string;
  balance: number;
}

export default function HederaAccountCreator({ onAccountCreated, className = '' }: HederaAccountCreatorProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [accountDetails, setAccountDetails] = useState<AccountDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createAccount = async () => {
    setIsCreating(true);
    setError(null);

    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      // Call the API to create Hedera account
      const response = await fetch('/api/create-hedera-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create account');
      }

      setAccountDetails(result.account);
      setShowDetails(true);
      onAccountCreated(result.account.accountId, result.account.evmAddress);

    } catch (err) {
      console.error('Error creating Hedera account:', err);
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setIsCreating(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
    console.log(`${label} copied to clipboard`);
  };

  if (showDetails && accountDetails) {
    return (
      <div className={`bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 ${className}`}>
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center mr-3">
            <span className="text-white text-sm">✓</span>
          </div>
          <h3 className="text-lg font-semibold text-white">Hedera Account Created Successfully!</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Account ID</label>
            <div className="flex items-center space-x-2">
              <code className="flex-1 px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-emerald-400 font-mono text-sm">
                {accountDetails.accountId}
              </code>
              <MagneticEffect>
                <button
                  onClick={() => copyToClipboard(accountDetails.accountId, 'Account ID')}
                  className="px-3 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                >
                  Copy
                </button>
              </MagneticEffect>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">EVM Address</label>
            <div className="flex items-center space-x-2">
              <code className="flex-1 px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-emerald-400 font-mono text-sm">
                {accountDetails.evmAddress}
              </code>
              <MagneticEffect>
                <button
                  onClick={() => copyToClipboard(accountDetails.evmAddress, 'EVM Address')}
                  className="px-3 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                >
                  Copy
                </button>
              </MagneticEffect>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Initial Balance</label>
            <div className="px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-emerald-400 font-mono text-sm">
              {accountDetails.balance} ℏ (HBAR)
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mt-4">
            <div className="flex items-start">
              <span className="text-yellow-400 mr-2">⚠️</span>
              <div className="text-sm text-yellow-300">
                <p className="font-medium mb-1">Important Security Notice:</p>
                <p>Your private key has been securely stored in your profile. For additional security, consider:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Using a hardware wallet for large transactions</li>
                  <li>Regularly monitoring your account activity</li>
                  <li>Never sharing your private key with anyone</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white/5 border border-white/10 rounded-xl p-6 ${className}`}>
      <div className="flex items-center mb-4">
        <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mr-3">
          <span className="text-white text-sm">🏗️</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Create Hedera Account</h3>
          <p className="text-sm text-gray-400">Get a new Hedera account funded with 20 HBAR</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
          <h4 className="font-medium text-emerald-400 mb-2">What you'll get:</h4>
          <ul className="text-sm text-emerald-300 space-y-1">
            <li>• A new Hedera account with unique Account ID</li>
            <li>• EVM-compatible address for DeFi interactions</li>
            <li>• 20 HBAR initial balance for transactions</li>
            <li>• Private/public key pair for signing</li>
          </ul>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <MagneticEffect>
          <button
            onClick={createAccount}
            disabled={isCreating}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 px-4 rounded-xl font-medium hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 hover-lift disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Creating Account...
              </div>
            ) : (
              'Create Hedera Account'
            )}
          </button>
        </MagneticEffect>

        <p className="text-xs text-gray-500 text-center">
          This process may take a few seconds. Please don't close this page.
        </p>
      </div>
    </div>
  );
} 