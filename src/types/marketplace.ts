// Marketplace Types for Property Token Trading

export type OrderType = 'buy' | 'sell';
export type OrderStatus = 'open' | 'partially_filled' | 'filled' | 'cancelled' | 'expired';
export type TradeStatus = 'pending' | 'completed' | 'failed' | 'disputed';
export type TradeType = 'market' | 'limit' | 'atomic_swap';
export type Currency = 'HBAR' | 'USDC' | 'USDT' | 'USD';
export type TimeInterval = '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w' | '1M';

export interface MarketplaceOrder {
  id: string;
  property_id: string;
  token_id: string;
  seller_id?: string;
  buyer_id?: string;
  order_type: OrderType;
  token_amount: number;
  price_per_token: number;
  total_price: number;
  currency: Currency;
  status: OrderStatus;
  filled_amount: number;
  remaining_amount: number;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  filled_at?: string;
  cancelled_at?: string;
  hedera_transaction_id?: string;
  escrow_status: string;
  notes?: string;
  is_public: boolean;
}

export interface MarketplaceTrade {
  id: string;
  property_id: string;
  token_id: string;
  buy_order_id?: string;
  sell_order_id?: string;
  buyer_id: string;
  seller_id: string;
  token_amount: number;
  price_per_token: number;
  total_price: number;
  currency: Currency;
  platform_fee: number;
  buyer_fee: number;
  seller_fee: number;
  hedera_transaction_id: string;
  token_transfer_tx?: string;
  payment_transfer_tx?: string;
  status: TradeStatus;
  created_at: string;
  completed_at?: string;
  trade_type: TradeType;
  notes?: string;
}

export interface PriceHistory {
  id: string;
  property_id: string;
  token_id: string;
  timestamp: string;
  interval: TimeInterval;
  open_price: number;
  high_price: number;
  low_price: number;
  close_price: number;
  volume: number;
  trade_count: number;
  currency: Currency;
  created_at: string;
}

export interface MarketplaceStatistics {
  id: string;
  property_id: string;
  volume_24h: number;
  trades_24h: number;
  high_24h?: number;
  low_24h?: number;
  change_24h?: number;
  volume_7d: number;
  trades_7d: number;
  total_volume: number;
  total_trades: number;
  last_price?: number;
  best_bid?: number;
  best_ask?: number;
  spread?: number;
  total_buy_orders: number;
  total_sell_orders: number;
  buy_order_volume: number;
  sell_order_volume: number;
  updated_at: string;
}

export interface UserTradingStats {
  id: string;
  user_id: string;
  property_id?: string;
  total_trades: number;
  total_volume: number;
  total_bought: number;
  total_buy_value: number;
  total_sold: number;
  total_sell_value: number;
  realized_pnl: number;
  unrealized_pnl: number;
  first_trade_at?: string;
  last_trade_at?: string;
  updated_at: string;
}

export interface OrderBookEntry {
  property_id: string;
  token_id: string;
  order_type: OrderType;
  price_per_token: number;
  total_amount: number;
  order_count: number;
  earliest_order: string;
}

export interface OrderBook {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  spread?: number;
  mid_price?: number;
}

export interface CreateOrderInput {
  property_id: string;
  token_id: string;
  order_type: OrderType;
  token_amount: number;
  price_per_token: number;
  currency?: Currency;
  expires_at?: string;
  notes?: string;
  is_public?: boolean;
}

export interface ExecuteTradeInput {
  buy_order_id?: string;
  sell_order_id?: string;
  property_id: string;
  token_id: string;
  buyer_id: string;
  seller_id: string;
  token_amount: number;
  price_per_token: number;
  currency?: Currency;
  trade_type?: TradeType;
}

export interface MarketplaceAnalytics {
  property_id: string;
  current_price: number;
  price_change_24h: number;
  price_change_7d: number;
  volume_24h: number;
  volume_7d: number;
  trades_24h: number;
  trades_7d: number;
  market_cap: number;
  liquidity_score: number;
  volatility_score: number;
  trend: 'up' | 'down' | 'stable';
}

export interface TradingChartData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PortfolioPosition {
  property_id: string;
  property_name: string;
  token_symbol: string;
  tokens_owned: number;
  average_buy_price: number;
  current_price: number;
  total_invested: number;
  current_value: number;
  unrealized_pnl: number;
  unrealized_pnl_percent: number;
  realized_pnl: number;
  total_pnl: number;
}

export interface MarketDepth {
  price: number;
  amount: number;
  total: number;
  cumulative_amount: number;
  percentage: number;
}

export interface MarketDepthChart {
  bids: MarketDepth[];
  asks: MarketDepth[];
  max_total: number;
}

export interface TradeHistoryItem extends MarketplaceTrade {
  property_name: string;
  token_symbol: string;
  buyer_email?: string;
  seller_email?: string;
}

