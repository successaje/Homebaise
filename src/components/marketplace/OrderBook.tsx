'use client';

import { OrderBook as OrderBookType, OrderType } from '@/types/marketplace';
import { formatNumber, formatCurrency } from '@/lib/utils';

interface OrderBookProps {
  orderBook: OrderBookType | null;
  onPriceClick?: (price: number, type: OrderType) => void;
}

export default function OrderBookComponent({ orderBook, onPriceClick }: OrderBookProps) {
  if (!orderBook) {
    return (
      <div className="flex items-center justify-center h-[400px] text-gray-400">
        <div className="text-center">
          <div className="text-4xl mb-2">📖</div>
          <div>Loading order book...</div>
        </div>
      </div>
    );
  }

  const { bids, asks, spread, mid_price } = orderBook;

  // Calculate max volume for bar visualization
  const maxVolume = Math.max(
    ...bids.map(b => b.total_amount),
    ...asks.map(a => a.total_amount),
    1
  );

  const calculateBarWidth = (amount: number) => {
    return (amount / maxVolume) * 100;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">Order Book</h3>
        {spread !== undefined && (
          <div className="text-xs">
            <span className="text-gray-400">Spread: </span>
            <span className="text-white font-semibold">{formatCurrency(spread)}</span>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="grid grid-cols-3 text-xs text-gray-400 font-medium mb-2 px-2">
        <div className="text-left">Price (USD)</div>
        <div className="text-right">Amount</div>
        <div className="text-right">Total</div>
      </div>

      {/* Asks (Sell Orders) - Red */}
      <div className="space-y-0.5 mb-4">
        {asks.length === 0 ? (
          <div className="text-center text-gray-500 text-xs py-4">No sell orders</div>
        ) : (
          asks.slice(0, 10).reverse().map((ask, index) => (
            <div
              key={`ask-${index}`}
              onClick={() => onPriceClick?.(ask.price_per_token, 'buy')}
              className="relative group cursor-pointer hover:bg-red-500/10 px-2 py-1.5 rounded transition-colors"
            >
              {/* Background bar */}
              <div 
                className="absolute right-0 top-0 h-full bg-red-500/10 rounded transition-all"
                style={{ width: `${calculateBarWidth(ask.total_amount)}%` }}
              />
              
              {/* Content */}
              <div className="relative grid grid-cols-3 text-xs">
                <div className="text-red-400 font-medium">
                  {formatCurrency(ask.price_per_token)}
                </div>
                <div className="text-right text-white">
                  {formatNumber(ask.total_amount)}
                </div>
                <div className="text-right text-gray-400">
                  {formatCurrency(ask.price_per_token * ask.total_amount)}
                </div>
              </div>
              
              {/* Orders count tooltip */}
              <div className="absolute left-0 top-full mt-1 hidden group-hover:block bg-black/90 text-white text-xs px-2 py-1 rounded z-10 whitespace-nowrap">
                {ask.order_count} order{ask.order_count > 1 ? 's' : ''}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Mid Price / Spread */}
      <div className="bg-white/5 rounded-lg py-3 px-2 mb-4">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-400">Mid Price</div>
          <div className="text-white font-bold text-lg">
            {mid_price ? formatCurrency(mid_price) : '—'}
          </div>
        </div>
      </div>

      {/* Bids (Buy Orders) - Green */}
      <div className="space-y-0.5">
        {bids.length === 0 ? (
          <div className="text-center text-gray-500 text-xs py-4">No buy orders</div>
        ) : (
          bids.slice(0, 10).map((bid, index) => (
            <div
              key={`bid-${index}`}
              onClick={() => onPriceClick?.(bid.price_per_token, 'sell')}
              className="relative group cursor-pointer hover:bg-emerald-500/10 px-2 py-1.5 rounded transition-colors"
            >
              {/* Background bar */}
              <div 
                className="absolute right-0 top-0 h-full bg-emerald-500/10 rounded transition-all"
                style={{ width: `${calculateBarWidth(bid.total_amount)}%` }}
              />
              
              {/* Content */}
              <div className="relative grid grid-cols-3 text-xs">
                <div className="text-emerald-400 font-medium">
                  {formatCurrency(bid.price_per_token)}
                </div>
                <div className="text-right text-white">
                  {formatNumber(bid.total_amount)}
                </div>
                <div className="text-right text-gray-400">
                  {formatCurrency(bid.price_per_token * bid.total_amount)}
                </div>
              </div>
              
              {/* Orders count tooltip */}
              <div className="absolute left-0 top-full mt-1 hidden group-hover:block bg-black/90 text-white text-xs px-2 py-1 rounded z-10 whitespace-nowrap">
                {bid.order_count} order{bid.order_count > 1 ? 's' : ''}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Market Depth Summary */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <div className="text-gray-400 mb-1">Total Bids</div>
            <div className="text-emerald-400 font-semibold">
              {formatNumber(bids.reduce((sum, b) => sum + b.total_amount, 0))}
            </div>
            <div className="text-gray-500 text-[10px]">
              {bids.reduce((sum, b) => sum + b.order_count, 0)} orders
            </div>
          </div>
          <div>
            <div className="text-gray-400 mb-1">Total Asks</div>
            <div className="text-red-400 font-semibold">
              {formatNumber(asks.reduce((sum, a) => sum + a.total_amount, 0))}
            </div>
            <div className="text-gray-500 text-[10px]">
              {asks.reduce((sum, a) => sum + a.order_count, 0)} orders
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

