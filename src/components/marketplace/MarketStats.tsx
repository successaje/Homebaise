'use client';

import { MarketplaceStatistics } from '@/types/marketplace';
import { Property } from '@/types/property';
import { formatNumber, formatCurrency } from '@/lib/utils';

interface MarketStatsProps {
  stats: MarketplaceStatistics;
  property: Property;
}

export default function MarketStats({ stats, property }: MarketStatsProps) {
  const change24h = stats.change_24h || 0;
  const isPositive = change24h >= 0;

  return (
    <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-6">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {/* Last Price */}
        <div>
          <div className="text-gray-400 text-xs mb-1">Last Price</div>
          <div className="text-white text-2xl font-bold">
            {stats.last_price ? formatCurrency(stats.last_price) : '—'}
          </div>
          {change24h !== 0 && (
            <div className={`text-sm font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              {isPositive ? '↑' : '↓'} {Math.abs(change24h).toFixed(2)}%
            </div>
          )}
        </div>

        {/* 24h High */}
        <div>
          <div className="text-gray-400 text-xs mb-1">24h High</div>
          <div className="text-white text-xl font-semibold">
            {stats.high_24h ? formatCurrency(stats.high_24h) : '—'}
          </div>
        </div>

        {/* 24h Low */}
        <div>
          <div className="text-gray-400 text-xs mb-1">24h Low</div>
          <div className="text-white text-xl font-semibold">
            {stats.low_24h ? formatCurrency(stats.low_24h) : '—'}
          </div>
        </div>

        {/* 24h Volume */}
        <div>
          <div className="text-gray-400 text-xs mb-1">24h Volume</div>
          <div className="text-white text-xl font-semibold">
            {formatNumber(stats.volume_24h)}
          </div>
          <div className="text-gray-400 text-xs">
            {stats.trades_24h} trades
          </div>
        </div>

        {/* Best Bid */}
        <div>
          <div className="text-gray-400 text-xs mb-1">Best Bid</div>
          <div className="text-emerald-400 text-xl font-semibold">
            {stats.best_bid ? formatCurrency(stats.best_bid) : '—'}
          </div>
        </div>

        {/* Best Ask */}
        <div>
          <div className="text-gray-400 text-xs mb-1">Best Ask</div>
          <div className="text-red-400 text-xl font-semibold">
            {stats.best_ask ? formatCurrency(stats.best_ask) : '—'}
          </div>
        </div>

        {/* Spread */}
        <div>
          <div className="text-gray-400 text-xs mb-1">Spread</div>
          <div className="text-white text-xl font-semibold">
            {stats.spread ? formatCurrency(stats.spread) : '—'}
          </div>
          {stats.best_bid && stats.best_ask && (
            <div className="text-gray-400 text-xs">
              {((stats.spread || 0) / stats.best_bid * 100).toFixed(2)}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

