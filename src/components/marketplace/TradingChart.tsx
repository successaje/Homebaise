'use client';

import { useEffect, useState } from 'react';
import { TimeInterval, TradingChartData } from '@/types/marketplace';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface TradingChartProps {
  propertyId: string;
}

const INTERVALS: { value: TimeInterval; label: string }[] = [
  { value: '1m', label: '1m' },
  { value: '5m', label: '5m' },
  { value: '15m', label: '15m' },
  { value: '1h', label: '1h' },
  { value: '4h', label: '4h' },
  { value: '1d', label: '1D' },
  { value: '1w', label: '1W' },
  { value: '1M', label: '1M' },
];

const CHART_TYPES = [
  { value: 'line', label: 'Line', icon: '📈' },
  { value: 'area', label: 'Area', icon: '📊' },
  { value: 'candlestick', label: 'Candles', icon: '🕯️' },
];

export default function TradingChart({ propertyId }: TradingChartProps) {
  const [chartData, setChartData] = useState<TradingChartData[]>([]);
  const [interval, setInterval] = useState<TimeInterval>('1h');
  const [chartType, setChartType] = useState<'line' | 'area' | 'candlestick' | 'volume'>('area');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChartData();
  }, [propertyId, interval]);

  const fetchChartData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/marketplace/price-history?property_id=${propertyId}&interval=${interval}&limit=100`
      );
      const data = await response.json();
      
      if (data.data) {
        setChartData(data.data);
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatXAxis = (timestamp: number) => {
    const date = new Date(timestamp);
    
    if (interval === '1m' || interval === '5m' || interval === '15m') {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (interval === '1h' || interval === '4h') {
      return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const formatTooltipValue = (value: number | string) => {
    return `$${Number(value).toFixed(2)}`;
  };

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ payload: Record<string, unknown> }>; label?: string }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-black/90 border border-white/20 rounded-lg p-3 text-sm">
          <div className="text-gray-400 mb-2">
            {new Date(String(data.timestamp)).toLocaleString()}
          </div>
          {chartType === 'candlestick' ? (
            <>
              <div className="flex justify-between gap-4">
                <span className="text-gray-400">O:</span>
                <span className="text-white font-semibold">${Number(data.open).toFixed(2)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-400">H:</span>
                <span className="text-emerald-400 font-semibold">${Number(data.high).toFixed(2)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-400">L:</span>
                <span className="text-red-400 font-semibold">${Number(data.low).toFixed(2)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-400">C:</span>
                <span className="text-white font-semibold">${Number(data.close).toFixed(2)}</span>
              </div>
              <div className="flex justify-between gap-4 mt-1 pt-1 border-t border-white/10">
                <span className="text-gray-400">Vol:</span>
                <span className="text-white">{Number(data.volume).toLocaleString()}</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between gap-4">
                <span className="text-gray-400">Price:</span>
                <span className="text-white font-semibold">${Number(data.close).toFixed(2)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-400">Volume:</span>
                <span className="text-white">{Number(data.volume).toLocaleString()}</span>
              </div>
            </>
          )}
        </div>
      );
    }
    return null;
  };

  // Candlestick rendering component
  const CandlestickBar = (props: Record<string, unknown>) => {
    const { x, y, width, height, payload } = props;
    const data = payload as Record<string, unknown>;
    const xNum = Number(x);
    const yNum = Number(y);
    const widthNum = Number(width);
    const heightNum = Number(height);
    const isGreen = Number(data.close) >= Number(data.open);
    const bodyY = isGreen ? yNum + (heightNum - heightNum * (Number(data.close) - Number(data.low)) / (Number(data.high) - Number(data.low))) : yNum + (heightNum - heightNum * (Number(data.open) - Number(data.low)) / (Number(data.high) - Number(data.low)));
    const bodyHeight = Math.abs((Number(data.close) - Number(data.open)) / (Number(data.high) - Number(data.low)) * heightNum);
    
    return (
      <g>
        {/* Wick */}
        <line
          x1={xNum + widthNum / 2}
          y1={yNum}
          x2={xNum + widthNum / 2}
          y2={yNum + heightNum}
          stroke={isGreen ? '#10b981' : '#ef4444'}
          strokeWidth={1}
        />
        {/* Body */}
        <rect
          x={xNum + widthNum * 0.2}
          y={bodyY}
          width={widthNum * 0.6}
          height={Math.max(bodyHeight, 1)}
          fill={isGreen ? '#10b981' : '#ef4444'}
          stroke={isGreen ? '#10b981' : '#ef4444'}
        />
      </g>
    );
  };

  const renderChart = () => {
    if (chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={formatXAxis}
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              domain={['auto', 'auto']}
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="close" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={false}
              animationDuration={300}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    } else if (chartType === 'area') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={formatXAxis}
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              domain={['auto', 'auto']}
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="close" 
              stroke="#10b981" 
              strokeWidth={2}
              fill="url(#colorPrice)"
              animationDuration={300}
            />
          </AreaChart>
        </ResponsiveContainer>
      );
    } else {
      // Candlestick chart
      return (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={formatXAxis}
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              domain={['auto', 'auto']}
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="high" 
              shape={<CandlestickBar />}
              animationDuration={300}
            />
          </BarChart>
        </ResponsiveContainer>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-gray-400">
        <div className="text-6xl mb-4">📊</div>
        <div className="text-lg">No trading data available yet</div>
        <div className="text-sm">Be the first to trade!</div>
      </div>
    );
  }

  return (
    <div>
      {/* Chart Controls */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-white font-semibold">Price Chart</span>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Chart Type Selector */}
          <div className="flex items-center space-x-1 bg-white/5 rounded-lg p-1">
            {CHART_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => setChartType(type.value as 'candlestick' | 'line' | 'volume')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  chartType === type.value
                    ? 'bg-emerald-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {type.icon} {type.label}
              </button>
            ))}
          </div>

          {/* Interval Selector */}
          <div className="flex items-center space-x-1 bg-white/5 rounded-lg p-1">
            {INTERVALS.map((int) => (
              <button
                key={int.value}
                onClick={() => setInterval(int.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  interval === int.value
                    ? 'bg-emerald-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {int.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      {renderChart()}

      {/* Volume Bar Chart */}
      <div className="mt-4">
        <ResponsiveContainer width="100%" height={100}>
          <BarChart data={chartData} margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={formatXAxis}
              stroke="#9ca3af"
              style={{ fontSize: '10px' }}
            />
            <YAxis 
              stroke="#9ca3af"
              style={{ fontSize: '10px' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(0, 0, 0, 0.9)', 
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                fontSize: '12px'
              }}
              labelFormatter={(timestamp) => new Date(timestamp).toLocaleString()}
              formatter={(value: number) => [value.toLocaleString(), 'Volume']}
            />
            <Bar dataKey="volume" fill="#10b981" opacity={0.6} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

