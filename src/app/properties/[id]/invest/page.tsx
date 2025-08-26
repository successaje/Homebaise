'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getPropertyById, Property } from '@/data/mockProperties';
import { formatNumber, formatCurrency, getPropertyTypeLabel, getCountryFlag } from '@/lib/utils';
import MagneticEffect from '@/components/MagneticEffect';
import ScrollAnimations from '@/components/ScrollAnimations';
import InvestmentConfirmation from '@/components/InvestmentConfirmation';
import PaymentProcessor from '@/components/PaymentProcessor';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

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
  const [showPaymentProcessor, setShowPaymentProcessor] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [form, setForm] = useState<InvestmentForm>({
    amount: 0,
    tokens: 0,
    paymentMethod: 'wallet',
    termsAccepted: false,
    kycVerified: false,
  });

  useEffect(() => {
    const init = async () => {
      // Get property
      if (params.id) {
        const foundProperty = getPropertyById(params.id as string);
        if (foundProperty) {
          setProperty(foundProperty);
        } else {
          router.push('/properties');
          return;
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
          kycVerified: profile.kyc_status === 'verified'
        }));
      }

      setLoading(false);
    };

    init();
  }, [params.id, router]);

  const calculateTokens = (amount: number) => {
    if (!property) return 0;
    return Math.floor(amount / property.tokenPriceUSD);
  };

  const calculateAmount = (tokens: number) => {
    if (!property) return 0;
    return tokens * property.tokenPriceUSD;
  };

  const handleAmountChange = (amount: number) => {
    const tokens = calculateTokens(amount);
    setForm(prev => ({
      ...prev,
      amount,
      tokens
    }));
  };

  const handleTokensChange = (tokens: number) => {
    const amount = calculateAmount(tokens);
    setForm(prev => ({
      ...prev,
      tokens,
      amount
    }));
  };

  const validateForm = () => {
    if (!property) return false;
    
    if (form.amount < property.minInvestment) {
      alert(`Minimum investment is ${formatCurrency(property.minInvestment)}`);
      return false;
    }
    
    if (form.amount > property.maxInvestment) {
      alert(`Maximum investment is ${formatCurrency(property.maxInvestment)}`);
      return false;
    }
    
    if (form.amount > form.tokens * property.tokenPriceUSD) {
      alert('Insufficient tokens available');
      return false;
    }
    
    if (!form.termsAccepted) {
      alert('Please accept the terms and conditions');
      return false;
    }
    
    if (!form.kycVerified) {
      alert('KYC verification is required to invest');
      return false;
    }
    
    return true;
  };

  const handleInvest = async () => {
    if (!validateForm()) return;
    
    setShowPaymentProcessor(true);
  };

  const handlePaymentSuccess = async (transactionId: string) => {
    setShowPaymentProcessor(false);
    setInvesting(true);
    
    try {
      // Simulate investment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real app, this would:
      // 1. Create investment record in database
      // 2. Update property token availability
      // 3. Send confirmation email
      
      setShowConfirmation(true);
    } catch (error) {
      alert('Investment failed. Please try again.');
    } finally {
      setInvesting(false);
    }
  };

  const handlePaymentError = (error: string) => {
    setShowPaymentProcessor(false);
    alert(error);
  };

  const handlePaymentCancel = () => {
    setShowPaymentProcessor(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!property) {
    return null;
  }

  const getPropertyTypeIcon = (type: Property['propertyType']) => {
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
                <span className="text-4xl">{getPropertyTypeIcon(property.propertyType)}</span>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-1">Invest in {property.name}</h1>
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
                      min={property.minInvestment}
                      max={property.maxInvestment}
                      step={property.tokenPriceUSD}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder={`Min: ${formatCurrency(property.minInvestment)}`}
                    />
                    <div className="flex justify-between text-sm text-gray-400 mt-2">
                      <span>Min: {formatCurrency(property.minInvestment)}</span>
                      <span>Max: {formatCurrency(property.maxInvestment)}</span>
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
                      max={property.tokensAvailable}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Number of tokens"
                    />
                    <div className="text-sm text-gray-400 mt-2">
                      Available: {property.tokensAvailable.toLocaleString()} tokens
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
                            onChange={(e) => setForm(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
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

                  {/* KYC Warning */}
                  {!form.kycVerified && (
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
                      disabled={investing || !form.kycVerified || !form.termsAccepted || form.amount === 0}
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
                      <span className="text-gray-400">Token Price</span>
                      <span className="text-white font-semibold">{formatCurrency(property.tokenPriceUSD)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Expected Annual Yield</span>
                      <span className="text-emerald-400 font-semibold">{property.yieldRate}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Expected Annual Return</span>
                      <span className="text-emerald-400 font-semibold">
                        {formatCurrency(form.amount * (parseFloat(property.yieldRate) / 100))}
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
                  </div>
                </div>

                {/* Property Info */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Property Information</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Property Type</span>
                      <span className="text-white">{getPropertyTypeLabel(property.propertyType)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Location</span>
                      <span className="text-white">{getCountryFlag(property.country)} {property.country}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Total Value</span>
                      <span className="text-white">{formatNumber(property.totalValueUSD)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Funding Progress</span>
                      <span className="text-white">{property.fundedPercent}%</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Available Tokens</span>
                      <span className="text-white">{property.tokensAvailable.toLocaleString()}</span>
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
            propertyName: property.name,
            amount: form.amount,
            tokens: form.tokens,
            tokenPrice: property.tokenPriceUSD,
            yieldRate: property.yieldRate,
            expectedMonthlyReturn: form.amount * (parseFloat(property.yieldRate) / 100) / 12,
            transactionId: 'tx_' + Math.random().toString(36).substr(2, 9),
            investedAt: new Date().toISOString(),
          }}
          onClose={() => setShowConfirmation(false)}
        />
      )}

      {/* Payment Processor Modal */}
      {showPaymentProcessor && property && (
        <PaymentProcessor
          amount={form.amount}
          paymentMethod={form.paymentMethod}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          onCancel={handlePaymentCancel}
        />
      )}
    </div>
  );
} 