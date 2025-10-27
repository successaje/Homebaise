'use client';

import { MarketplaceTrade } from '@/types/marketplace';
import { formatNumber, formatCurrency } from '@/lib/utils';

interface RecentTradesProps {
  trades: MarketplaceTrade[];
}

export default function RecentTrades({ trades }: RecentTradesProps) {
  if (trades.length === 0) {
    return (
      <div>
        <h3 className="text-white font-semibold mb-4">Recent Trades</h3>
        <div className="flex flex-col items-center justify-center h-[200px] text-gray-400">
          <div className="text-4xl mb-2">💱</div>
          <div className="text-sm">No trades yet</div>
        </div>
      </div>
    );
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div>
      <h3 className="text-white font-semibold mb-4">Recent Trades</h3>

      {/* Header */}
      <div className="grid grid-cols-4 text-xs text-gray-400 font-medium mb-2 px-2">
        <div className="text-left">Price</div>
        <div className="text-right">Amount</div>
        <div className="text-right">Total</div>
        <div className="text-right">Time</div>
      </div>

      {/* Trades List */}
      <div className="space-y-0.5 max-h-[300px] overflow-y-auto custom-scrollbar">
        {trades.map((trade) => {
          const priceChange = trade.price_per_token; // Could compare with previous
          
          return (
            <div
              key={trade.id}
              className="grid grid-cols-4 text-xs px-2 py-2 hover:bg-white/5 rounded transition-colors"
            >
              <div className="text-left">
                <div className="text-white font-medium">
                  {formatCurrency(trade.price_per_token)}
                </div>
              </div>
              <div className="text-right text-white">
                {formatNumber(trade.token_amount)}
              </div>
              <div className="text-right text-gray-400">
                {formatCurrency(trade.total_price)}
              </div>
              <div className="text-right text-gray-500">
                {formatTime(trade.completed_at || trade.created_at)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <div className="text-gray-400 mb-1">Total Trades</div>
            <div className="text-white font-semibold">{trades.length}</div>
          </div>
          <div>
            <div className="text-gray-400 mb-1">Total Volume</div>
            <div className="text-white font-semibold">
              {formatNumber(trades.reduce((sum, t) => sum + t.token_amount, 0))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(16, 185, 129, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(16, 185, 129, 0.7);
        }
      `}</style>
    </div>
  );
}

