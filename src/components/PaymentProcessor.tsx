'use client';

import { useState } from 'react';
import MagneticEffect from './MagneticEffect';
import { formatCurrency } from '@/lib/utils';

interface PaymentProcessorProps {
  amount: number;
  paymentMethod: 'wallet' | 'bank_transfer' | 'card';
  onSuccess: (transactionId: string) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

interface PaymentForm {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
  bankAccount: string;
  bankName: string;
  walletAddress: string;
}

export default function PaymentProcessor({ 
  amount, 
  paymentMethod, 
  onSuccess, 
  onError, 
  onCancel 
}: PaymentProcessorProps) {
  const [processing, setProcessing] = useState(false);
  const [form, setForm] = useState<PaymentForm>({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    bankAccount: '',
    bankName: '',
    walletAddress: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Generate mock transaction ID
      const transactionId = 'tx_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      
      onSuccess(transactionId);
    } catch (error) {
      onError('Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const renderPaymentForm = () => {
    switch (paymentMethod) {
      case 'card':
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Card Number
              </label>
              <input
                type="text"
                value={form.cardNumber}
                onChange={(e) => setForm(prev => ({ ...prev, cardNumber: e.target.value }))}
                placeholder="1234 5678 9012 3456"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Expiry Date
                </label>
                <input
                  type="text"
                  value={form.expiryDate}
                  onChange={(e) => setForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                  placeholder="MM/YY"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  CVV
                </label>
                <input
                  type="text"
                  value={form.cvv}
                  onChange={(e) => setForm(prev => ({ ...prev, cvv: e.target.value }))}
                  placeholder="123"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Cardholder Name
              </label>
              <input
                type="text"
                value={form.cardholderName}
                onChange={(e) => setForm(prev => ({ ...prev, cardholderName: e.target.value }))}
                placeholder="John Doe"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                required
              />
            </div>
          </form>
        );

      case 'bank_transfer':
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Bank Name
              </label>
              <input
                type="text"
                value={form.bankName}
                onChange={(e) => setForm(prev => ({ ...prev, bankName: e.target.value }))}
                placeholder="Your Bank Name"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Account Number
              </label>
              <input
                type="text"
                value={form.bankAccount}
                onChange={(e) => setForm(prev => ({ ...prev, bankAccount: e.target.value }))}
                placeholder="1234567890"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                required
              />
            </div>
            
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <h4 className="text-blue-400 font-semibold mb-2">Bank Transfer Instructions</h4>
              <div className="text-sm text-gray-300 space-y-1">
                <p>Account: Homebaise Investments Ltd</p>
                <p>Account Number: 1234567890</p>
                <p>Bank: African Development Bank</p>
                <p>Reference: INV-{Date.now()}</p>
              </div>
            </div>
          </form>
        );

      case 'wallet':
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Wallet Address
              </label>
              <input
                type="text"
                value={form.walletAddress}
                onChange={(e) => setForm(prev => ({ ...prev, walletAddress: e.target.value }))}
                placeholder="0x1234...5678"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                required
              />
            </div>
            
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
              <h4 className="text-emerald-400 font-semibold mb-2">Crypto Payment Details</h4>
              <div className="text-sm text-gray-300 space-y-1">
                <p>Amount: {formatCurrency(amount)}</p>
                <p>Currently Supported: HBAR</p>
                <p>Current Network: Testnet</p>
                <p>Transaction will be processed automatically</p>
              </div>
            </div>
          </form>
        );

      default:
        return null;
    }
  };

  const getPaymentMethodInfo = () => {
    switch (paymentMethod) {
      case 'card':
        return {
          icon: '💳',
          title: 'Credit/Debit Card',
          description: 'Secure payment via Stripe'
        };
      case 'bank_transfer':
        return {
          icon: '🏦',
          title: 'Bank Transfer',
          description: 'Direct bank transfer'
        };
      case 'wallet':
        return {
          icon: '🔗',
          title: 'Crypto Wallet',
          description: 'Pay with cryptocurrency'
        };
      default:
        return { icon: '', title: '', description: '' };
    }
  };

  const paymentInfo = getPaymentMethodInfo();

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 max-w-md w-full backdrop-blur-xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">{paymentInfo.icon}</div>
          <h2 className="text-2xl font-bold text-white mb-2">{paymentInfo.title}</h2>
          <p className="text-gray-400">{paymentInfo.description}</p>
        </div>

        {/* Payment Amount */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
          <div className="text-center">
            <div className="text-gray-400 text-sm mb-1">Payment Amount</div>
            <div className="text-3xl font-bold text-white">{formatCurrency(amount)}</div>
          </div>
        </div>

        {/* Payment Form */}
        {renderPaymentForm()}

        {/* Action Buttons */}
        <div className="mt-6 space-y-3">
          <MagneticEffect>
            <button
              onClick={handleSubmit}
              disabled={processing}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 px-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 hover-lift disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing Payment...</span>
                </div>
              ) : (
                `Pay ${formatCurrency(amount)}`
              )}
            </button>
          </MagneticEffect>
          
          <MagneticEffect>
            <button
              onClick={onCancel}
              disabled={processing}
              className="w-full border border-white/20 bg-white/5 text-white py-3 px-4 rounded-xl font-semibold hover:bg-white/10 transition-all duration-300 hover-lift disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </MagneticEffect>
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-gray-400 text-xs">
            🔒 All payments are encrypted and secure
          </p>
        </div>
      </div>
    </div>
  );
} 