-- Secondary Marketplace for Property Token Trading
-- Created: 2025-10-12
-- Purpose: Enable P2P trading of property tokens with order book, price discovery, and atomic swaps

-- =============================================
-- MARKETPLACE ORDERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.marketplace_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Order Details
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    token_id TEXT NOT NULL, -- Hedera token ID
    
    -- User Info
    seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Order Type
    order_type TEXT NOT NULL CHECK (order_type IN ('buy', 'sell')),
    
    -- Pricing
    token_amount BIGINT NOT NULL CHECK (token_amount > 0),
    price_per_token DECIMAL(20, 8) NOT NULL CHECK (price_per_token > 0),
    total_price DECIMAL(20, 8) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'HBAR' CHECK (currency IN ('HBAR', 'USDC', 'USDT', 'USD')),
    
    -- Order Status
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'partially_filled', 'filled', 'cancelled', 'expired')),
    filled_amount BIGINT DEFAULT 0 CHECK (filled_amount >= 0),
    remaining_amount BIGINT NOT NULL CHECK (remaining_amount >= 0),
    
    -- Time Management
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    filled_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    
    -- Transaction Info
    hedera_transaction_id TEXT, -- For escrow/atomic swap
    escrow_status TEXT DEFAULT 'pending' CHECK (escrow_status IN ('pending', 'locked', 'released', 'refunded')),
    
    -- Metadata
    notes TEXT,
    is_public BOOLEAN DEFAULT true,
    
    -- Indexing
    CONSTRAINT valid_amounts CHECK (filled_amount + remaining_amount = token_amount),
    CONSTRAINT valid_user CHECK (
        (order_type = 'sell' AND seller_id IS NOT NULL AND buyer_id IS NULL) OR
        (order_type = 'buy' AND buyer_id IS NOT NULL AND seller_id IS NULL)
    )
);

-- Indexes for performance
CREATE INDEX idx_marketplace_orders_property ON public.marketplace_orders(property_id);
CREATE INDEX idx_marketplace_orders_seller ON public.marketplace_orders(seller_id);
CREATE INDEX idx_marketplace_orders_buyer ON public.marketplace_orders(buyer_id);
CREATE INDEX idx_marketplace_orders_status ON public.marketplace_orders(status);
CREATE INDEX idx_marketplace_orders_type ON public.marketplace_orders(order_type);
CREATE INDEX idx_marketplace_orders_price ON public.marketplace_orders(price_per_token);
CREATE INDEX idx_marketplace_orders_created ON public.marketplace_orders(created_at DESC);
CREATE INDEX idx_marketplace_orders_active ON public.marketplace_orders(property_id, status, order_type, price_per_token) 
    WHERE status IN ('open', 'partially_filled');

-- =============================================
-- MARKETPLACE TRADES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.marketplace_trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Trade Details
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    token_id TEXT NOT NULL,
    
    -- Order References
    buy_order_id UUID REFERENCES public.marketplace_orders(id) ON DELETE SET NULL,
    sell_order_id UUID REFERENCES public.marketplace_orders(id) ON DELETE SET NULL,
    
    -- Parties
    buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Trade Amounts
    token_amount BIGINT NOT NULL CHECK (token_amount > 0),
    price_per_token DECIMAL(20, 8) NOT NULL CHECK (price_per_token > 0),
    total_price DECIMAL(20, 8) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'HBAR',
    
    -- Fees
    platform_fee DECIMAL(20, 8) DEFAULT 0,
    buyer_fee DECIMAL(20, 8) DEFAULT 0,
    seller_fee DECIMAL(20, 8) DEFAULT 0,
    
    -- Hedera Transactions
    hedera_transaction_id TEXT NOT NULL,
    token_transfer_tx TEXT, -- Token transfer transaction
    payment_transfer_tx TEXT, -- Payment transfer transaction
    
    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'disputed')),
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    -- Trade Type
    trade_type TEXT DEFAULT 'market' CHECK (trade_type IN ('market', 'limit', 'atomic_swap')),
    
    -- Metadata
    notes TEXT
);

-- Indexes for trades
CREATE INDEX idx_marketplace_trades_property ON public.marketplace_trades(property_id);
CREATE INDEX idx_marketplace_trades_buyer ON public.marketplace_trades(buyer_id);
CREATE INDEX idx_marketplace_trades_seller ON public.marketplace_trades(seller_id);
CREATE INDEX idx_marketplace_trades_created ON public.marketplace_trades(created_at DESC);
CREATE INDEX idx_marketplace_trades_completed ON public.marketplace_trades(completed_at DESC);
CREATE INDEX idx_marketplace_trades_status ON public.marketplace_trades(status);

-- =============================================
-- PRICE HISTORY TABLE (for charts)
-- =============================================
CREATE TABLE IF NOT EXISTS public.marketplace_price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Property Reference
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    token_id TEXT NOT NULL,
    
    -- OHLCV Data (Open, High, Low, Close, Volume)
    timestamp TIMESTAMPTZ NOT NULL,
    interval TEXT NOT NULL CHECK (interval IN ('1m', '5m', '15m', '1h', '4h', '1d', '1w', '1M')),
    
    open_price DECIMAL(20, 8) NOT NULL,
    high_price DECIMAL(20, 8) NOT NULL,
    low_price DECIMAL(20, 8) NOT NULL,
    close_price DECIMAL(20, 8) NOT NULL,
    volume BIGINT NOT NULL DEFAULT 0,
    trade_count INTEGER NOT NULL DEFAULT 0,
    
    currency TEXT NOT NULL DEFAULT 'HBAR',
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicates
    CONSTRAINT unique_price_history UNIQUE (property_id, interval, timestamp)
);

-- Indexes for efficient querying
CREATE INDEX idx_price_history_property ON public.marketplace_price_history(property_id);
CREATE INDEX idx_price_history_timestamp ON public.marketplace_price_history(timestamp DESC);
CREATE INDEX idx_price_history_interval ON public.marketplace_price_history(interval);
CREATE INDEX idx_price_history_property_interval ON public.marketplace_price_history(property_id, interval, timestamp DESC);

-- =============================================
-- MARKETPLACE STATISTICS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.marketplace_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    
    -- 24h Stats
    volume_24h BIGINT DEFAULT 0,
    trades_24h INTEGER DEFAULT 0,
    high_24h DECIMAL(20, 8),
    low_24h DECIMAL(20, 8),
    change_24h DECIMAL(10, 4), -- Percentage
    
    -- 7d Stats
    volume_7d BIGINT DEFAULT 0,
    trades_7d INTEGER DEFAULT 0,
    
    -- All-time Stats
    total_volume BIGINT DEFAULT 0,
    total_trades INTEGER DEFAULT 0,
    
    -- Current Market
    last_price DECIMAL(20, 8),
    best_bid DECIMAL(20, 8),
    best_ask DECIMAL(20, 8),
    spread DECIMAL(20, 8),
    
    -- Liquidity
    total_buy_orders INTEGER DEFAULT 0,
    total_sell_orders INTEGER DEFAULT 0,
    buy_order_volume BIGINT DEFAULT 0,
    sell_order_volume BIGINT DEFAULT 0,
    
    -- Updated timestamp
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_property_stats UNIQUE (property_id)
);

CREATE INDEX idx_marketplace_stats_property ON public.marketplace_statistics(property_id);

-- =============================================
-- USER TRADING STATS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.user_trading_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    
    -- Trading Activity
    total_trades INTEGER DEFAULT 0,
    total_volume BIGINT DEFAULT 0,
    
    -- Buy Stats
    total_bought BIGINT DEFAULT 0,
    total_buy_value DECIMAL(20, 8) DEFAULT 0,
    
    -- Sell Stats
    total_sold BIGINT DEFAULT 0,
    total_sell_value DECIMAL(20, 8) DEFAULT 0,
    
    -- P&L
    realized_pnl DECIMAL(20, 8) DEFAULT 0,
    unrealized_pnl DECIMAL(20, 8) DEFAULT 0,
    
    -- Timestamps
    first_trade_at TIMESTAMPTZ,
    last_trade_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_user_property_stats UNIQUE (user_id, property_id)
);

CREATE INDEX idx_user_trading_stats_user ON public.user_trading_stats(user_id);
CREATE INDEX idx_user_trading_stats_property ON public.user_trading_stats(property_id);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to update order amounts
CREATE OR REPLACE FUNCTION update_order_amounts()
RETURNS TRIGGER AS $$
BEGIN
    NEW.remaining_amount := NEW.token_amount - NEW.filled_amount;
    
    -- Update status based on filled amount
    IF NEW.filled_amount = 0 THEN
        NEW.status := 'open';
    ELSIF NEW.filled_amount < NEW.token_amount THEN
        NEW.status := 'partially_filled';
    ELSIF NEW.filled_amount = NEW.token_amount THEN
        NEW.status := 'filled';
        NEW.filled_at := NOW();
    END IF;
    
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_order_amounts
BEFORE INSERT OR UPDATE ON public.marketplace_orders
FOR EACH ROW
EXECUTE FUNCTION update_order_amounts();

-- Function to update price history from trades
CREATE OR REPLACE FUNCTION update_price_history_from_trade()
RETURNS TRIGGER AS $$
DECLARE
    v_interval TEXT;
    v_timestamp TIMESTAMPTZ;
BEGIN
    IF NEW.status = 'completed' THEN
        -- Update for each interval
        FOREACH v_interval IN ARRAY ARRAY['1m', '5m', '15m', '1h', '4h', '1d', '1w', '1M']
        LOOP
            -- Calculate bucket timestamp based on interval
            v_timestamp := CASE v_interval
                WHEN '1m' THEN date_trunc('minute', NEW.completed_at)
                WHEN '5m' THEN date_trunc('hour', NEW.completed_at) + INTERVAL '5 min' * FLOOR(EXTRACT(MINUTE FROM NEW.completed_at) / 5)
                WHEN '15m' THEN date_trunc('hour', NEW.completed_at) + INTERVAL '15 min' * FLOOR(EXTRACT(MINUTE FROM NEW.completed_at) / 15)
                WHEN '1h' THEN date_trunc('hour', NEW.completed_at)
                WHEN '4h' THEN date_trunc('day', NEW.completed_at) + INTERVAL '4 hour' * FLOOR(EXTRACT(HOUR FROM NEW.completed_at) / 4)
                WHEN '1d' THEN date_trunc('day', NEW.completed_at)
                WHEN '1w' THEN date_trunc('week', NEW.completed_at)
                WHEN '1M' THEN date_trunc('month', NEW.completed_at)
            END;
            
            -- Insert or update price history
            INSERT INTO public.marketplace_price_history (
                property_id, token_id, timestamp, interval,
                open_price, high_price, low_price, close_price, volume, trade_count, currency
            )
            VALUES (
                NEW.property_id, NEW.token_id, v_timestamp, v_interval,
                NEW.price_per_token, NEW.price_per_token, NEW.price_per_token, NEW.price_per_token,
                NEW.token_amount, 1, NEW.currency
            )
            ON CONFLICT (property_id, interval, timestamp)
            DO UPDATE SET
                high_price = GREATEST(marketplace_price_history.high_price, NEW.price_per_token),
                low_price = LEAST(marketplace_price_history.low_price, NEW.price_per_token),
                close_price = NEW.price_per_token,
                volume = marketplace_price_history.volume + NEW.token_amount,
                trade_count = marketplace_price_history.trade_count + 1;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_price_history
AFTER INSERT OR UPDATE ON public.marketplace_trades
FOR EACH ROW
EXECUTE FUNCTION update_price_history_from_trade();

-- Function to update marketplace statistics
CREATE OR REPLACE FUNCTION update_marketplace_statistics()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' THEN
        INSERT INTO public.marketplace_statistics (property_id, last_price, updated_at)
        VALUES (NEW.property_id, NEW.price_per_token, NOW())
        ON CONFLICT (property_id)
        DO UPDATE SET
            last_price = NEW.price_per_token,
            total_volume = marketplace_statistics.total_volume + NEW.token_amount,
            total_trades = marketplace_statistics.total_trades + 1,
            updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_marketplace_statistics
AFTER INSERT OR UPDATE ON public.marketplace_trades
FOR EACH ROW
EXECUTE FUNCTION update_marketplace_statistics();

-- =============================================
-- VIEWS
-- =============================================

-- Order book view (best bid/ask)
CREATE OR REPLACE VIEW public.marketplace_order_book AS
SELECT 
    property_id,
    token_id,
    order_type,
    price_per_token,
    SUM(remaining_amount) as total_amount,
    COUNT(*) as order_count,
    MIN(created_at) as earliest_order
FROM public.marketplace_orders
WHERE status IN ('open', 'partially_filled')
    AND (expires_at IS NULL OR expires_at > NOW())
GROUP BY property_id, token_id, order_type, price_per_token
ORDER BY 
    property_id,
    order_type,
    CASE 
        WHEN order_type = 'buy' THEN -price_per_token  -- Best bid (highest price first)
        ELSE price_per_token                            -- Best ask (lowest price first)
    END;

-- Recent trades view
CREATE OR REPLACE VIEW public.marketplace_recent_trades AS
SELECT 
    t.*,
    p.name as property_name,
    buyer.email as buyer_email,
    seller.email as seller_email
FROM public.marketplace_trades t
JOIN public.properties p ON t.property_id = p.id
LEFT JOIN auth.users buyer ON t.buyer_id = buyer.id
LEFT JOIN auth.users seller ON t.seller_id = seller.id
WHERE t.status = 'completed'
ORDER BY t.completed_at DESC;

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.marketplace_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_trading_stats ENABLE ROW LEVEL SECURITY;

-- Orders: Users can see all public orders, and their own private orders
CREATE POLICY "Users can view all public orders"
    ON public.marketplace_orders FOR SELECT
    USING (is_public = true OR seller_id = auth.uid() OR buyer_id = auth.uid());

CREATE POLICY "Users can create their own orders"
    ON public.marketplace_orders FOR INSERT
    WITH CHECK (seller_id = auth.uid() OR buyer_id = auth.uid());

CREATE POLICY "Users can update their own orders"
    ON public.marketplace_orders FOR UPDATE
    USING (seller_id = auth.uid() OR buyer_id = auth.uid());

CREATE POLICY "Users can delete their own orders"
    ON public.marketplace_orders FOR DELETE
    USING (seller_id = auth.uid() OR buyer_id = auth.uid());

-- Trades: Users can see trades they're involved in, or all completed public trades
CREATE POLICY "Users can view relevant trades"
    ON public.marketplace_trades FOR SELECT
    USING (buyer_id = auth.uid() OR seller_id = auth.uid() OR status = 'completed');

-- Price history: Public read access
CREATE POLICY "Price history is publicly readable"
    ON public.marketplace_price_history FOR SELECT
    USING (true);

-- Statistics: Public read access
CREATE POLICY "Statistics are publicly readable"
    ON public.marketplace_statistics FOR SELECT
    USING (true);

-- User stats: Users can only see their own stats
CREATE POLICY "Users can view their own trading stats"
    ON public.user_trading_stats FOR SELECT
    USING (user_id = auth.uid());

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE public.marketplace_orders IS 'Buy and sell orders for property tokens';
COMMENT ON TABLE public.marketplace_trades IS 'Executed trades between buyers and sellers';
COMMENT ON TABLE public.marketplace_price_history IS 'OHLCV price history for charting';
COMMENT ON TABLE public.marketplace_statistics IS 'Aggregated statistics per property';
COMMENT ON TABLE public.user_trading_stats IS 'Individual user trading statistics';

