'use client';

import { MarketplaceOrder } from '@/types/marketplace';
import { formatNumber, formatCurrency } from '@/lib/utils';

interface MyOrdersProps {
  orders: MarketplaceOrder[];
  onCancel: (orderId: string) => void;
}

export default function MyOrders({ orders, onCancel }: MyOrdersProps) {
  if (orders.length === 0) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'partially_filled':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'filled':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'cancelled':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-white/10 text-white border-white/20';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div>
      <h3 className="text-white font-semibold mb-4">My Open Orders ({orders.length})</h3>

      <div className="space-y-3">
        {orders.map((order) => {
          const isBuy = order.order_type === 'buy';
          const fillPercentage = (order.filled_amount / order.token_amount) * 100;
          
          return (
            <div
              key={order.id}
              className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    isBuy ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {isBuy ? 'Buy' : 'Sell'}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(order.status)}`}>
                    {order.status.replace('_', ' ')}
                  </span>
                </div>
                
                {(order.status === 'open' || order.status === 'partially_filled') && (
                  <button
                    onClick={() => onCancel(order.id)}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-gray-400 text-xs mb-1">Price</div>
                  <div className="text-white font-semibold">
                    {formatCurrency(order.price_per_token)}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs mb-1">Amount</div>
                  <div className="text-white font-semibold">
                    {formatNumber(order.token_amount)}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs mb-1">Total</div>
                  <div className="text-white font-semibold">
                    {formatCurrency(order.total_price)}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs mb-1">Created</div>
                  <div className="text-white text-xs">
                    {formatDate(order.created_at)}
                  </div>
                </div>
              </div>

              {/* Fill Progress */}
              {order.filled_amount > 0 && (
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-400">Filled</span>
                    <span className="text-white font-medium">
                      {formatNumber(order.filled_amount)} / {formatNumber(order.token_amount)}
                      {' '}({fillPercentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        isBuy ? 'bg-emerald-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${fillPercentage}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Remaining */}
              {order.remaining_amount > 0 && (
                <div className="mt-2 text-xs text-gray-400">
                  Remaining: <span className="text-white font-medium">{formatNumber(order.remaining_amount)}</span> tokens
                </div>
              )}

              {/* Expires */}
              {order.expires_at && (
                <div className="mt-2 text-xs text-gray-400">
                  Expires: {formatDate(order.expires_at)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

