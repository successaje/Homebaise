'use client';

import { useState, useEffect } from 'react';
import { Property } from '@/types/property';
import { OrderType } from '@/types/marketplace';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';

interface TradeFormProps {
  property: Property;
  activeTab: 'buy' | 'sell';
  setActiveTab: (tab: 'buy' | 'sell') => void;
  selectedPrice: number | null;
  onSuccess: () => void;
  user: any;
}

export default function TradeForm({
  property,
  activeTab,
  setActiveTab,
  selectedPrice,
  onSuccess,
  user
}: TradeFormProps) {
  const [amount, setAmount] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [orderType, setOrderType] = useState<'limit' | 'market'>('limit');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableBalance, setAvailableBalance] = useState<number>(0);

  useEffect(() => {
    if (selectedPrice) {
      setPrice(selectedPrice.toString());
    }
  }, [selectedPrice]);

  useEffect(() => {
    if (user && activeTab === 'sell') {
      fetchAvailableBalance();
    }
  }, [user, activeTab, property.id]);

  const fetchAvailableBalance = async () => {
    if (!user) return;

    try {
      // Get user's total tokens for this property
      const { data: investments } = await supabase
        .from('investments')
        .select('tokens_purchased')
        .eq('investor_id', user.id)
        .eq('property_id', property.id)
        .eq('status', 'completed');

      const totalOwned = investments?.reduce((sum, inv) => sum + inv.tokens_purchased, 0) || 0;

      // Get tokens in open sell orders
      const { data: openOrders } = await supabase
        .from('marketplace_orders')
        .select('remaining_amount')
        .eq('seller_id', user.id)
        .eq('property_id', property.id)
        .in('status', ['open', 'partially_filled']);

      const tokensInOrders = openOrders?.reduce((sum, order) => sum + order.remaining_amount, 0) || 0;

      setAvailableBalance(totalOwned - tokensInOrders);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError('Please sign in to trade');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (orderType === 'limit' && (!price || parseFloat(price) <= 0)) {
      setError('Please enter a valid price');
      return;
    }

    if (activeTab === 'sell' && parseFloat(amount) > availableBalance) {
      setError(`Insufficient balance. You have ${availableBalance} tokens available`);
      return;
    }

    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Please sign in to trade');
        return;
      }

      // Get token_id from property or treasury account
      let tokenId = property.token_id;
      
      if (!tokenId) {
        // Try to get token_id from property_treasury_accounts
        const { data: treasuryData } = await supabase
          .from('property_treasury_accounts')
          .select('token_id')
          .eq('property_id', property.id)
          .single();
        
        if (treasuryData?.token_id) {
          tokenId = treasuryData.token_id;
        }
      }

      if (!tokenId) {
        setError('This property has not been tokenized yet. Please tokenize it first.');
        return;
      }

      const orderData = {
        property_id: property.id,
        token_id: tokenId,
        order_type: activeTab,
        token_amount: parseInt(amount),
        price_per_token: orderType === 'market' ? 0 : parseFloat(price),
        currency: 'HBAR'
      };

      console.log('Creating order with data:', orderData); // Debug log

      const response = await fetch('/api/marketplace/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify(orderData)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Order creation failed:', data);
        throw new Error(data.error || 'Failed to create order');
      }

      // Reset form
      setAmount('');
      if (orderType === 'limit') {
        setPrice('');
      }
      
      onSuccess();
      
      // Show success message
      alert(`${activeTab === 'buy' ? 'Buy' : 'Sell'} order created successfully!`);
      
      // Refresh balance if selling
      if (activeTab === 'sell') {
        fetchAvailableBalance();
      }

    } catch (error: any) {
      console.error('Error creating order:', error);
      setError(error.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    const amountNum = parseFloat(amount) || 0;
    const priceNum = parseFloat(price) || 0;
    return amountNum * priceNum;
  };

  const isMockProperty = property.id?.startsWith('mock-');

  return (
    <div>
      {/* Demo Notice */}
      {isMockProperty && (
        <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-center space-x-2 text-blue-400 text-sm">
            <span className="text-lg">✨</span>
            <div>
              <div className="font-semibold">Demo Mode</div>
              <div className="text-xs text-blue-400/70">
                This is demo data. Actual trading uses real Hedera tokens.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Buy/Sell Tabs */}
      <div className="flex space-x-2 mb-4">
        <button
          onClick={() => setActiveTab('buy')}
          className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
            activeTab === 'buy'
              ? 'bg-emerald-600 text-white'
              : 'bg-white/5 text-gray-400 hover:text-white'
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setActiveTab('sell')}
          className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
            activeTab === 'sell'
              ? 'bg-red-600 text-white'
              : 'bg-white/5 text-gray-400 hover:text-white'
          }`}
        >
          Sell
        </button>
      </div>

      {/* Order Type */}
      <div className="flex space-x-2 mb-4">
        <button
          onClick={() => setOrderType('limit')}
          className={`flex-1 py-2 text-sm rounded-lg font-medium transition-colors ${
            orderType === 'limit'
              ? 'bg-white/10 text-white'
              : 'bg-white/5 text-gray-400 hover:text-white'
          }`}
        >
          Limit
        </button>
        <button
          onClick={() => setOrderType('market')}
          className={`flex-1 py-2 text-sm rounded-lg font-medium transition-colors ${
            orderType === 'market'
              ? 'bg-white/10 text-white'
              : 'bg-white/5 text-gray-400 hover:text-white'
          }`}
        >
          Market
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Price */}
        {orderType === 'limit' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Price (USD per token)
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              step="0.01"
              min="0"
              placeholder="0.00"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        )}

        {/* Amount */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-300">
              Amount (tokens)
            </label>
            {activeTab === 'sell' && user && (
              <div className="text-xs text-gray-400">
                Available: <span className="text-white font-semibold">{availableBalance}</span>
              </div>
            )}
          </div>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            step="1"
            min="1"
            max={activeTab === 'sell' ? availableBalance : undefined}
            placeholder="0"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
          
          {/* Quick amount buttons */}
          {activeTab === 'sell' && availableBalance > 0 && (
            <div className="flex gap-2 mt-2">
              {[25, 50, 75, 100].map((percent) => (
                <button
                  key={percent}
                  type="button"
                  onClick={() => setAmount(Math.floor(availableBalance * percent / 100).toString())}
                  className="flex-1 py-1 text-xs bg-white/5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                >
                  {percent}%
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Total */}
        {orderType === 'limit' && amount && price && (
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Total</span>
              <span className="text-white font-bold text-lg">
                {formatCurrency(calculateTotal())}
              </span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Submit Button */}
        {user ? (
          <button
            type="submit"
            disabled={loading || !amount || (orderType === 'limit' && !price)}
            className={`w-full py-4 rounded-lg font-semibold transition-all ${
              activeTab === 'buy'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </div>
            ) : (
              `${activeTab === 'buy' ? 'Buy' : 'Sell'} ${property.token_symbol || 'Tokens'}`
            )}
          </button>
        ) : (
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-3">Sign in to start trading</p>
            <a
              href="/auth"
              className="inline-block w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors"
            >
              Sign In
            </a>
          </div>
        )}
      </form>

      {/* Trading Info */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="space-y-2 text-xs">
          <div className="flex justify-between text-gray-400">
            <span>Platform Fee</span>
            <span>0.5%</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Settlement</span>
            <span>Instant (Hedera)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

