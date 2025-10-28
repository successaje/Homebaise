'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Property } from '@/types/property';
import { formatNumber, formatCurrency, getPropertyTypeLabel, getCountryFlag } from '@/lib/utils';
import MagneticEffect from '@/components/MagneticEffect';
import ScrollAnimations from '@/components/ScrollAnimations';
import InvestmentConfirmation from '@/components/InvestmentConfirmation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { InvestmentService } from '@/lib/investment';
import { getHbarUsdPrice, getAccountBalance, ensureTokenAssociation } from '@/lib/hedera';
import { Client } from '@hashgraph/sdk';
import HederaAccountCreator from '@/components/HederaAccountCreator';

interface InvestmentForm {
  amount: number;
  tokens: number;
  paymentMethod: 'wallet' | 'bank_transfer' | 'card';
  termsAccepted: boolean;
  kycVerified: boolean;
}

export default function InvestPage() {
  const params = useParams();
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [investing, setInvesting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [userProfile, setUserProfile] = useState<{ wallet_address?: string; hedera_private_key?: string; kyc_status?: string; hedera_account_id?: string } | null>(null);
  const [availableTokens, setAvailableTokens] = useState<number>(0);
  const [hbarPrice, setHbarPrice] = useState<number>(0);
  const [hbarEquivalent, setHbarEquivalent] = useState<number>(0);
  const [walletHbarBalance, setWalletHbarBalance] = useState<number>(0);
  const [associationApproved, setAssociationApproved] = useState<boolean>(false);
  const [associating, setAssociating] = useState<boolean>(false);
  const [showHederaCreator, setShowHederaCreator] = useState<boolean>(false);
  const [form, setForm] = useState<InvestmentForm>({
    amount: 0,
    tokens: 0,
    paymentMethod: 'wallet',
    termsAccepted: false,
    kycVerified: false,
  });

  // Computed boolean for KYC verification
  const isKycVerified: boolean = Boolean(form.kycVerified);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        
        // Get property from Supabase
        if (params.id) {
          const { data: propertyData, error } = await supabase
            .from('properties')
            .select('*')
            .eq('id', params.id)
            .single();
            
          if (error || !propertyData) {
            console.error('Error fetching property:', error);
            router.push('/properties');
            return;
          }
          
          // Get token_id from treasury accounts
          try {
            const { data: treasuryData, error: treasuryError } = await supabase
              .from('property_treasury_accounts')
              .select('token_id')
              .eq('property_id', propertyData.id)
              .single();
            
            if (!treasuryError && treasuryData?.token_id) {
              // Add token_id to property data
              propertyData.token_id = treasuryData.token_id;
            }
          } catch (error) {
            console.error('Error fetching treasury data:', error);
          }
          
          setProperty(propertyData as Property);
          
          // Get available tokens from treasury account balance
          try {
            const tokens = await InvestmentService.getAvailableTokens(propertyData.id);
            setAvailableTokens(tokens);
          } catch (error) {
            console.error('Error fetching available tokens from treasury:', error);
            setAvailableTokens(0);
          }
        }

        // Get user session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/auth');
          return;
        }
        setUser(session.user);

        // Get user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          setUserProfile(profile);
          setForm(prev => ({
            ...prev,
            kycVerified: Boolean(profile.kyc_status === 'verified')
          }));

          // Fetch HBAR price and wallet balance
          try {
            const price = await getHbarUsdPrice();
            setHbarPrice(price);
          } catch {}

          try {
            if (profile.wallet_address) {
              const bal = await getAccountBalance(profile.wallet_address);
              setWalletHbarBalance(bal);
            }
          } catch (e) {
            console.error('Failed to fetch Hedera wallet balance', e);
          }
        }
      } catch (error) {
        console.error('Error in invest page initialization:', error);
        router.push('/properties');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [params.id, router]);

  const handleHederaAccountCreated = async (accountId: string, evmAddress: string) => {
    // Refresh user profile to get the new Hedera account details
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          setUserProfile(profile);
          setShowHederaCreator(false);
          
          // Fetch wallet balance for the new account
          try {
            const bal = await getAccountBalance(profile.wallet_address);
            setWalletHbarBalance(bal);
          } catch (e) {
            console.error('Failed to fetch new Hedera wallet balance', e);
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing profile after Hedera account creation:', error);
    }
  };

  const calculateTokens = (amount: number) => {
    // 1:1 ratio - $1 = 1 token
    return amount;
  };

  const calculateAmount = (tokens: number) => {
    // 1:1 ratio - 1 token = $1
    return tokens;
  };
  
  // Get available tokens or 0 if not available
  const getAvailableTokens = async () => {
    if (!property) return 0;
    try {
      return await InvestmentService.getAvailableTokens(property.id);
    } catch (error) {
      console.error('Error fetching available tokens:', error);
      // Fallback calculation
      if (property.total_value && property.token_price) {
        const totalTokens = Math.floor(property.total_value / property.token_price);
        const soldTokens = Math.floor((property.funded_amount_usd || 0) / property.token_price);
        return Math.max(0, totalTokens - soldTokens);
      }
      return 0;
    }
  };

  const handleAmountChange = (amount: number) => {
    const tokens = calculateTokens(amount);
    // Update HBAR equivalent using current price
    setHbarEquivalent(hbarPrice > 0 ? amount / hbarPrice : 0);
    setForm(prev => ({
      ...prev,
      amount,
      tokens
    }));
  };

  const handleTokensChange = (tokens: number) => {
    const amount = calculateAmount(tokens);
    setHbarEquivalent(hbarPrice > 0 ? amount / hbarPrice : 0);
    setForm(prev => ({
      ...prev,
      tokens,
      amount
    }));
  };

  const validateForm = async () => {
    if (!property) {
      alert('Property not found');
      return false;
    }
    
    // Use InvestmentService validation
    const validation = InvestmentService.validateInvestment(
      form.amount,
      form.tokens,
      property
    );
    
    if (!validation.valid) {
      alert(validation.error);
      return false;
    }
    
    // Check available tokens
    if (form.tokens > availableTokens) {
      alert(`Only ${availableTokens.toLocaleString()} tokens available`);
      return false;
    }
    
    if (!form.termsAccepted) {
      alert('Please accept the terms and conditions');
      return false;
    }
    
    if (!isKycVerified) {
      alert('KYC verification is required to invest');
      return false;
    }

    // Verify sufficient HBAR balance
    if (hbarEquivalent > 0 && walletHbarBalance > 0 && hbarEquivalent > walletHbarBalance) {
      alert(`Insufficient HBAR balance. Required: ${hbarEquivalent.toFixed(2)} HBAR, Available: ${walletHbarBalance.toFixed(2)} HBAR`);
      return false;
    }
    
    // Require token association approval before proceeding
    if (!associationApproved) {
      alert('Please associate the property token with your wallet before investing.');
      return false;
    }

    return true;
  };

  const handleInvest = async () => {
    const isValid = await validateForm();
    if (!isValid) return;
    
    setInvesting(true);
    try {
      if (!property || !user) {
        throw new Error('Missing property or user data');
      }

      // Use the proper Hedera investment flow
      const { InvestmentFlow } = await import('@/lib/investment-flow');
      
      // Get operator credentials
      const operatorId = process.env.NEXT_PUBLIC_MY_ACCOUNT_ID || process.env.MY_ACCOUNT_ID;
      const operatorKey = process.env.NEXT_PUBLIC_MY_PRIVATE_KEY || process.env.MY_PRIVATE_KEY;
      
      if (!operatorId || !operatorKey) {
        throw new Error('Missing operator credentials');
      }

      // Create investment flow instance
      const investmentFlow = new InvestmentFlow();
      
      // Execute the investment
      const result = await investmentFlow.executeInvestment(
        property.id,
        user.id,
        form.amount
      );

      if (result.success) {
        // Update available tokens
        const newAvailableTokens = await InvestmentService.getAvailableTokens(property.id);
        setAvailableTokens(newAvailableTokens);
        
        setShowConfirmation(true);
      } else {
        throw new Error(result.error || 'Investment failed');
      }
    } catch (error) {
      console.error('Investment failed:', error);
      alert(`Investment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setInvesting(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-2">Property Not Found</h2>
          <p className="text-gray-400 mb-4">The property you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <Link 
            href="/properties" 
            className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Back to Properties
          </Link>
        </div>
      </div>
    );
  }

  const getPropertyTypeIcon = (type: string | null | undefined) => {
    switch (type) {
      case 'residential':
        return '🏠';
      case 'commercial':
        return '🏢';
      case 'agricultural':
        return '🌾';
      case 'mixed-use':
        return '🏗️';
      case 'land':
        return '🌍';
      default:
        return '🏠';
    }
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
              <Link href="/properties" className="text-gray-300 hover:text-white">Properties</Link>
              <Link href="/dashboard" className="text-gray-300 hover:text-white">Dashboard</Link>
              <Link href="/profile" className="text-gray-300 hover:text-white">Profile</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollAnimations animationType="fade-in-up">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center space-x-2 text-gray-400 text-sm mb-4">
                <Link href={`/properties/${property.id}`} className="hover:text-white transition-colors">
                  ← Back to Property
                </Link>
                <span>•</span>
                <span>Invest</span>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="text-4xl">{getPropertyTypeIcon(property.property_type)}</span>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-1">Invest in {property.name || property.title}</h1>
                  <p className="text-gray-400 flex items-center">
                    <span className="mr-2">📍</span>
                    {property.location}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Investment Form */}
              <div className="space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Investment Details</h2>
                  
                  {/* Investment Amount */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Investment Amount (USD)
                    </label>
                    <input
                      type="number"
                      value={form.amount || ''}
                      onChange={(e) => handleAmountChange(Number(e.target.value))}
                      min={Math.max(10, property.min_investment || 10)}
                      max={property.max_investment || Infinity}
                      step={1}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder={`Min: ${formatCurrency(Math.max(10, property.min_investment || 10))}`}
                    />
                  <div className="flex justify-between text-sm text-gray-400 mt-2">
                    <span>HBAR Price: {hbarPrice ? `$${hbarPrice.toFixed(4)}/HBAR` : '...'}</span>
                    <span>≈ {hbarEquivalent ? hbarEquivalent.toFixed(4) : '0.0000'} HBAR</span>
                  </div>
                    <div className="flex justify-between text-sm text-gray-400 mt-2">
                      <span>Min: {formatCurrency(Math.max(10, property.min_investment || 10))}</span>
                      <span>Max: {formatCurrency(property.max_investment || Infinity)}</span>
                    </div>
                  </div>

                  {/* Tokens */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Tokens to Purchase
                    </label>
                    <input
                      type="number"
                      value={form.tokens || ''}
                      onChange={(e) => handleTokensChange(Number(e.target.value))}
                      min={1}
                      max={availableTokens}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Number of tokens"
                    />
                    <div className="text-sm text-gray-400 mt-2">
                      Available: {availableTokens.toLocaleString()} tokens
                    </div>
                  <div className="text-sm text-gray-400 mt-1">
                    Requires ≈ {hbarEquivalent ? hbarEquivalent.toFixed(4) : '0.0000'} HBAR
                  </div>
                  </div>

                  {/* Payment Method */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Payment Method
                    </label>
                    <div className="space-y-3">
                      {[
                        { value: 'wallet', label: 'Crypto Wallet', icon: '🔗' },
                        { value: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
                        { value: 'card', label: 'Credit/Debit Card', icon: '💳' }
                      ].map((method) => (
                        <label key={method.value} className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value={method.value}
                            checked={form.paymentMethod === method.value}
                            onChange={(e) => setForm(prev => ({ ...prev, paymentMethod: e.target.value as 'wallet' | 'bank_transfer' | 'card' }))}
                            className="text-emerald-500 focus:ring-emerald-500"
                          />
                          <span className="text-2xl">{method.icon}</span>
                          <span className="text-white">{method.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Terms */}
                  <div className="mb-6">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.termsAccepted}
                        onChange={(e) => setForm(prev => ({ ...prev, termsAccepted: e.target.checked }))}
                        className="text-emerald-500 focus:ring-emerald-500 mt-1"
                      />
                      <span className="text-gray-300 text-sm">
                        I agree to the{' '}
                        <Link href="/terms" className="text-emerald-400 hover:text-emerald-300">
                          Terms and Conditions
                        </Link>
                        {' '}and{' '}
                        <Link href="/privacy" className="text-emerald-400 hover:text-emerald-300">
                          Privacy Policy
                        </Link>
                      </span>
                    </label>
                  </div>

                  {/* Hedera Account Setup */}
                  {!userProfile?.wallet_address && (
                    <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white font-medium">Hedera Account Required</div>
                          <div className="text-gray-400 text-sm">You need a Hedera account to invest in tokenized properties</div>
                        </div>
                        <button
                          onClick={() => setShowHederaCreator(true)}
                          className="px-4 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors"
                        >
                          Create Account
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Token Association */}
                  {property?.token_id && userProfile?.wallet_address && (
                    <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white font-medium">Token Association Required</div>
                          <div className="text-gray-400 text-sm">
                            Associate token {property?.token_id || 'N/A'} with your wallet
                          </div>
                          <div className="text-gray-500 text-xs mt-1">
                            Debug: token_id={property?.token_id || 'null'}, wallet_address={userProfile?.wallet_address || 'null'}, property_id={property?.id || 'null'}
                          </div>
                        </div>
                        <button
                          disabled={associating || associationApproved}
                          onClick={async () => {
                            setAssociating(true);
                            try {
                              // Check if we have all required data
                              if (!property?.token_id) {
                                throw new Error('Property token ID not available');
                              }
                              if (!userProfile?.wallet_address) {
                                throw new Error('User Hedera account not found');
                              }
                              if (!userProfile?.hedera_private_key) {
                                throw new Error('User Hedera private key not found');
                              }

                              const operatorId = process.env.NEXT_PUBLIC_MY_ACCOUNT_ID || process.env.MY_ACCOUNT_ID;
                              const operatorKey = process.env.NEXT_PUBLIC_MY_PRIVATE_KEY || process.env.MY_PRIVATE_KEY;
                              if (!operatorId || !operatorKey) throw new Error('Missing operator credentials');
                              
                              const client = Client.forTestnet().setOperator(operatorId, operatorKey);
                              await ensureTokenAssociation({
                                client,
                                userAccountId: userProfile.wallet_address,
                                userPrivateKey: userProfile.hedera_private_key,
                                tokenId: property.token_id
                              });
                              setAssociationApproved(true);
                              alert('Token association successful.');
                            } catch (e: unknown) {
                              const msg = e instanceof Error ? e.message : 'Association failed';
                              alert(msg);
                            } finally {
                              setAssociating(false);
                            }
                          }}
                          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${associationApproved ? 'bg-emerald-600/40 text-white cursor-default' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                        >
                          {associationApproved ? '✓ Associated' : associating ? 'Associating...' : 'Associate Token'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* KYC Warning */}
                  {!isKycVerified && (
                    <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                      <div className="flex items-center space-x-2 text-yellow-400 mb-2">
                        <span>⚠️</span>
                        <span className="font-medium">KYC Verification Required</span>
                      </div>
                      <p className="text-yellow-400/70 text-sm">
                        You need to complete KYC verification before investing. 
                        <Link href="/profile" className="text-yellow-400 hover:text-yellow-300 ml-1">
                          Complete KYC →
                        </Link>
                      </p>
                    </div>
                  )}

                  {/* Invest Button */}
                  <MagneticEffect>
                    <button
                      onClick={handleInvest}
                      disabled={investing || !isKycVerified || !Boolean(form.termsAccepted) || form.amount === 0 || (Boolean(property?.token_id) && !associationApproved)}
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-4 px-6 rounded-xl font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 hover-lift disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {investing ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Processing Investment...</span>
                        </div>
                      ) : (
                        `Invest ${formatCurrency(form.amount)}`
                      )}
                    </button>
                  </MagneticEffect>
                </div>
              </div>


              {/* Investment Summary */}
              <div className="space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Investment Summary</h2>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Investment Amount</span>
                      <span className="text-white font-semibold">{formatCurrency(form.amount)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Tokens to Purchase</span>
                      <span className="text-white font-semibold">{form.tokens.toLocaleString()}</span>
                    </div>
                    
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">HBAR Equivalent</span>
                    <span className="text-white font-semibold">{hbarEquivalent ? `${hbarEquivalent.toFixed(4)} HBAR` : '...'}</span>
                  </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Token Price</span>
                      <span className="text-white font-semibold">$1.00 (1:1 ratio)</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Expected Annual Yield</span>
                      <span className="text-emerald-400 font-semibold">{property.yield_rate || 'N/A'}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Expected Annual Return</span>
                      <span className="text-emerald-400 font-semibold">
                        {property.yield_rate ? formatCurrency(form.amount * (parseFloat(property.yield_rate) / 100)) : 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-white/10">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Payment Method</span>
                      <span className="text-white">
                        {form.paymentMethod === 'wallet' && '🔗 Crypto Wallet'}
                        {form.paymentMethod === 'bank_transfer' && '🏦 Bank Transfer'}
                        {form.paymentMethod === 'card' && '💳 Credit/Debit Card'}
                      </span>
                    </div>
                    {userProfile?.hedera_account_id && (
                      <div className="flex justify-between items-center mt-3">
                        <span className="text-gray-400">Wallet Balance</span>
                        <span className="text-white font-semibold">{walletHbarBalance.toFixed(2)} HBAR</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Property Info */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Property Information</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Property Type</span>
                      <span className="text-white">{getPropertyTypeLabel(property.property_type)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Location</span>
                      <span className="text-white">{getCountryFlag(property.country)} {property.city || property.location || 'N/A'}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Total Value</span>
                      <span className="text-white">{property.total_value ? formatCurrency(property.total_value) : 'N/A'}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Funding Progress</span>
                      <span className="text-white">{property.funded_percent || 0}%</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Total Tokens</span>
                      <span className="text-white">{property.total_value ? property.total_value.toLocaleString() : 'N/A'}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Available Tokens</span>
                      <span className="text-white">{availableTokens.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Investment Timeline */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Investment Timeline</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                      <div>
                        <div className="text-white font-medium">Investment Confirmed</div>
                        <div className="text-gray-400 text-sm">Immediate</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                      <div>
                        <div className="text-white font-medium">Tokens Issued</div>
                        <div className="text-gray-400 text-sm">Within 24 hours</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                      <div>
                        <div className="text-gray-400 font-medium">First Yield Payment</div>
                        <div className="text-gray-500 text-sm">Monthly</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                      <div>
                        <div className="text-gray-400 font-medium">Property Exit</div>
                        <div className="text-gray-500 text-sm">3-5 years</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollAnimations>
        </div>
      </div>

      {/* Investment Confirmation Modal */}
      {showConfirmation && property && (
        <InvestmentConfirmation
          investment={{
            id: 'mock-investment-id',
            propertyName: property.name || property.title || 'Property',
            amount: form.amount,
            tokens: form.tokens,
            tokenPrice: property.token_price || 1.0,
            yieldRate: property.yield_rate || '0',
            expectedMonthlyReturn: form.amount * (parseFloat(property.yield_rate || '0') / 100) / 12,
            transactionId: 'tx_' + Math.random().toString(36).substr(2, 9),
            investedAt: new Date().toISOString(),
          }}
          onClose={() => setShowConfirmation(false)}
        />
      )}


      {/* Hedera Account Creator Modal */}
      {showHederaCreator && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Create Hedera Account</h3>
              <button
                onClick={() => setShowHederaCreator(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <HederaAccountCreator
              onAccountCreated={handleHederaAccountCreated}
              className="w-full"
            />
          </div>
        </div>
      )}
    </div>
  );
} 