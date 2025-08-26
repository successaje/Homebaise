'use client';

import { useState } from 'react';
import Link from 'next/link';
import MagneticEffect from '@/components/MagneticEffect';
import ScrollAnimations from '@/components/ScrollAnimations';
import { formatCurrency, formatNumber } from '@/lib/utils';

interface RemittanceOption {
  id: string;
  name: string;
  description: string;
  exchangeRate: number;
  fees: number;
  processingTime: string;
  icon: string;
  countries: string[];
}

interface ConversionHistory {
  id: string;
  amount: number;
  currency: string;
  tokensReceived: number;
  propertyName: string;
  status: 'pending' | 'completed' | 'failed';
  date: string;
  transactionId: string;
}

// Mock remittance options
const remittanceOptions: RemittanceOption[] = [
  {
    id: 'western-union',
    name: 'Western Union',
    description: 'Fast and reliable money transfer service',
    exchangeRate: 1.15,
    fees: 2.5,
    processingTime: '1-2 hours',
    icon: '🏦',
    countries: ['Nigeria', 'Kenya', 'Ghana', 'Uganda', 'Tanzania']
  },
  {
    id: 'moneygram',
    name: 'MoneyGram',
    description: 'Global money transfer network',
    exchangeRate: 1.12,
    fees: 3.0,
    processingTime: '2-4 hours',
    icon: '💸',
    countries: ['Nigeria', 'Kenya', 'Ghana', 'South Africa', 'Ethiopia']
  },
  {
    id: 'paypal',
    name: 'PayPal',
    description: 'Digital payment platform',
    exchangeRate: 1.08,
    fees: 1.5,
    processingTime: 'Instant',
    icon: '💳',
    countries: ['Nigeria', 'Kenya', 'Ghana', 'South Africa']
  },
  {
    id: 'bank-transfer',
    name: 'Bank Transfer',
    description: 'Direct bank-to-bank transfer',
    exchangeRate: 1.20,
    fees: 1.0,
    processingTime: '1-3 days',
    icon: '🏛️',
    countries: ['All Countries']
  }
];

// Mock conversion history
const mockConversionHistory: ConversionHistory[] = [
  {
    id: '1',
    amount: 500,
    currency: 'USD',
    tokensReceived: 575,
    propertyName: 'Lagos Marina Luxury Apartments',
    status: 'completed',
    date: '2024-03-15',
    transactionId: 'TX_123456789'
  },
  {
    id: '2',
    amount: 1000,
    currency: 'EUR',
    tokensReceived: 1200,
    propertyName: 'Nairobi Tech Hub Office Complex',
    status: 'completed',
    date: '2024-03-10',
    transactionId: 'TX_987654321'
  },
  {
    id: '3',
    amount: 300,
    currency: 'GBP',
    tokensReceived: 360,
    propertyName: 'Accra Business Center',
    status: 'pending',
    date: '2024-03-14',
    transactionId: 'TX_456789123'
  }
];

export default function RemittancePage() {
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [currency, setCurrency] = useState<string>('USD');
  const [targetCountry, setTargetCountry] = useState<string>('Nigeria');
  const [showConversion, setShowConversion] = useState(false);

  const currencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' }
  ];

  const countries = [
    'Nigeria', 'Kenya', 'Ghana', 'South Africa', 'Uganda', 
    'Tanzania', 'Ethiopia', 'Rwanda', 'Senegal', 'Morocco'
  ];

  const selectedRemittanceOption = remittanceOptions.find(opt => opt.id === selectedOption);

  const calculateTokens = () => {
    if (!selectedRemittanceOption || amount <= 0) return 0;
    const exchangeAmount = amount * selectedRemittanceOption.exchangeRate;
    const fees = (amount * selectedRemittanceOption.fees) / 100;
    const netAmount = exchangeAmount - fees;
    return Math.floor(netAmount / 100); // Assuming 1 token = $100
  };

  const tokensToReceive = calculateTokens();

  const handleConvert = () => {
    if (amount > 0 && selectedOption) {
      setShowConversion(true);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'failed':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
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
              <Link href="/portfolio" className="text-gray-300 hover:text-white">Portfolio</Link>
              <Link href="/analytics" className="text-gray-300 hover:text-white">Analytics</Link>
              <Link href="/blog" className="text-gray-300 hover:text-white">Blog</Link>
              <Link href="/dashboard" className="text-gray-300 hover:text-white">Dashboard</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollAnimations animationType="fade-in-up">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-white mb-4">Diaspora Remittance Conversion</h1>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Convert your remittances to African real estate tokens and build wealth back home
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Conversion Form */}
              <div className="space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Convert Remittance to Tokens</h2>
                  
                  {/* Amount Input */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Remittance Amount
                    </label>
                    <div className="flex space-x-2">
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        {currencies.map((curr) => (
                          <option key={curr.code} value={curr.code}>
                            {curr.symbol} {curr.code}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={amount || ''}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        placeholder="0.00"
                        className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Target Country */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Target Country
                    </label>
                    <select
                      value={targetCountry}
                      onChange={(e) => setTargetCountry(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {countries.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Remittance Options */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Select Remittance Service
                    </label>
                    <div className="space-y-3">
                      {remittanceOptions.map((option) => (
                        <label
                          key={option.id}
                          className={`flex items-center space-x-3 p-4 rounded-xl border cursor-pointer transition-all ${
                            selectedOption === option.id
                              ? 'border-emerald-500 bg-emerald-500/10'
                              : 'border-white/10 bg-white/5 hover:bg-white/10'
                          }`}
                        >
                          <input
                            type="radio"
                            name="remittanceOption"
                            value={option.id}
                            checked={selectedOption === option.id}
                            onChange={(e) => setSelectedOption(e.target.value)}
                            className="text-emerald-500 focus:ring-emerald-500"
                          />
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{option.icon}</span>
                            <div className="flex-1">
                              <div className="text-white font-medium">{option.name}</div>
                              <div className="text-gray-400 text-sm">{option.description}</div>
                              <div className="text-gray-400 text-xs mt-1">
                                Exchange Rate: {option.exchangeRate}x • Fees: {option.fees}% • Time: {option.processingTime}
                              </div>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Conversion Summary */}
                  {selectedOption && amount > 0 && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-6">
                      <h3 className="text-white font-semibold mb-3">Conversion Summary</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Remittance Amount</span>
                          <span className="text-white">{formatCurrency(amount)} {currency}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Exchange Rate</span>
                          <span className="text-white">{selectedRemittanceOption?.exchangeRate}x</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Fees</span>
                          <span className="text-white">{formatCurrency((amount * (selectedRemittanceOption?.fees || 0)) / 100)} {currency}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Net Amount</span>
                          <span className="text-white">{formatCurrency(amount * (selectedRemittanceOption?.exchangeRate || 1) - (amount * (selectedRemittanceOption?.fees || 0)) / 100)} {currency}</span>
                        </div>
                        <div className="border-t border-emerald-500/20 pt-2 mt-2">
                          <div className="flex justify-between">
                            <span className="text-emerald-400 font-semibold">Tokens to Receive</span>
                            <span className="text-emerald-400 font-bold text-lg">{tokensToReceive.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Convert Button */}
                  <MagneticEffect>
                    <button
                      onClick={handleConvert}
                      disabled={!selectedOption || amount <= 0}
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-4 px-6 rounded-xl font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 hover-lift disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Convert to Property Tokens
                    </button>
                  </MagneticEffect>
                </div>
              </div>

              {/* Conversion History & Benefits */}
              <div className="space-y-6">
                {/* Benefits */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Why Convert Remittances?</h3>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">🏠</div>
                      <div>
                        <h4 className="text-white font-medium">Build Wealth Back Home</h4>
                        <p className="text-gray-400 text-sm">Convert your remittances into appreciating real estate assets</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">📈</div>
                      <div>
                        <h4 className="text-white font-medium">Earn Passive Income</h4>
                        <p className="text-gray-400 text-sm">Receive monthly rental income and property appreciation</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">🌍</div>
                      <div>
                        <h4 className="text-white font-medium">Support African Development</h4>
                        <p className="text-gray-400 text-sm">Contribute to economic growth in your home country</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">💱</div>
                      <div>
                        <h4 className="text-white font-medium">Better Exchange Rates</h4>
                        <p className="text-gray-400 text-sm">Get competitive rates and lower fees than traditional transfers</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Conversion History */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Recent Conversions</h3>
                  <div className="space-y-3">
                    {mockConversionHistory.map((conversion) => (
                      <div key={conversion.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-white font-medium">
                            {formatCurrency(conversion.amount)} {conversion.currency}
                          </div>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${getStatusColor(conversion.status)}`}>
                            {conversion.status}
                          </span>
                        </div>
                        <div className="text-gray-400 text-sm mb-2">
                          → {conversion.tokensReceived.toLocaleString()} tokens
                        </div>
                        <div className="text-gray-400 text-xs">
                          {conversion.propertyName} • {conversion.date}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-emerald-400">$2.5M+</div>
                    <div className="text-gray-400 text-sm">Total Converted</div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-emerald-400">15K+</div>
                    <div className="text-gray-400 text-sm">Tokens Issued</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Conversion Success Modal */}
            {showConversion && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 max-w-md w-full backdrop-blur-xl">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl text-emerald-400">✅</span>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Conversion Successful!</h2>
                    <p className="text-gray-400">
                      Your remittance has been converted to {tokensToReceive.toLocaleString()} property tokens.
                    </p>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Amount Converted</span>
                      <span className="text-white font-semibold">{formatCurrency(amount)} {currency}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Tokens Received</span>
                      <span className="text-emerald-400 font-semibold">{tokensToReceive.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Processing Time</span>
                      <span className="text-white">{selectedRemittanceOption?.processingTime}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <MagneticEffect>
                      <Link href="/portfolio" className="block">
                        <button className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 px-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 hover-lift">
                          View Portfolio
                        </button>
                      </Link>
                    </MagneticEffect>
                    
                    <MagneticEffect>
                      <button
                        onClick={() => setShowConversion(false)}
                        className="w-full border border-white/20 bg-white/5 text-white py-3 px-4 rounded-xl font-semibold hover:bg-white/10 transition-all duration-300 hover-lift"
                      >
                        Convert Another
                      </button>
                    </MagneticEffect>
                  </div>
                </div>
              </div>
            )}
          </ScrollAnimations>
        </div>
      </div>
    </div>
  );
} 