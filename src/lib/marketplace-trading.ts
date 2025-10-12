/**
 * Marketplace Trading Service
 * Handles order creation, matching, and trade execution with Hedera integration
 */

import { Client, PrivateKey, AccountId, TokenId, TransferTransaction, Hbar } from '@hashgraph/sdk';
import { supabase } from './supabase';
import { ensureTokenAssociation, transferFungible } from './hedera';
import {
  MarketplaceOrder,
  MarketplaceTrade,
  OrderBookEntry,
  OrderBook,
  CreateOrderInput,
  ExecuteTradeInput,
  OrderType,
  MarketDepth,
  MarketDepthChart
} from '@/types/marketplace';

export class MarketplaceTradingService {
  private static client: Client | null = null;

  /**
   * Initialize Hedera client
   */
  private static getClient(): Client {
    if (!this.client) {
      const operatorId = process.env.MY_ACCOUNT_ID || process.env.NEXT_PUBLIC_MY_ACCOUNT_ID;
      const operatorKey = process.env.MY_PRIVATE_KEY || process.env.NEXT_PUBLIC_MY_PRIVATE_KEY;

      if (!operatorId || !operatorKey) {
        throw new Error('Hedera operator credentials not found');
      }

      this.client = Client.forTestnet().setOperator(operatorId, operatorKey);
    }
    return this.client;
  }

  /**
   * Create a new order (buy or sell)
   */
  static async createOrder(
    userId: string,
    input: CreateOrderInput
  ): Promise<{ success: boolean; order?: MarketplaceOrder; error?: string }> {
    try {
      // Validate user has sufficient balance
      if (input.order_type === 'sell') {
        const hasBalance = await this.validateSellerBalance(userId, input.property_id, input.token_amount);
        if (!hasBalance) {
          return { success: false, error: 'Insufficient token balance' };
        }
      }

      // Calculate total price
      const total_price = input.token_amount * input.price_per_token;

      // Create order
      const orderData: any = {
        property_id: input.property_id,
        token_id: input.token_id,
        order_type: input.order_type,
        token_amount: input.token_amount,
        price_per_token: input.price_per_token,
        total_price,
        currency: input.currency || 'HBAR',
        status: 'open',
        filled_amount: 0,
        remaining_amount: input.token_amount,
        expires_at: input.expires_at,
        notes: input.notes,
        is_public: input.is_public ?? true,
      };

      if (input.order_type === 'sell') {
        orderData.seller_id = userId;
      } else {
        orderData.buyer_id = userId;
      }

      const { data: order, error } = await supabase
        .from('marketplace_orders')
        .insert(orderData)
        .select()
        .single();

      if (error) {
        console.error('Error creating order:', error);
        return { success: false, error: error.message };
      }

      // Try to match with existing orders
      await this.tryMatchOrders(order as MarketplaceOrder);

      return { success: true, order: order as MarketplaceOrder };
    } catch (error: any) {
      console.error('Error in createOrder:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cancel an order
   */
  static async cancelOrder(
    userId: string,
    orderId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: order, error: fetchError } = await supabase
        .from('marketplace_orders')
        .select()
        .eq('id', orderId)
        .single();

      if (fetchError || !order) {
        return { success: false, error: 'Order not found' };
      }

      // Verify ownership
      if (order.seller_id !== userId && order.buyer_id !== userId) {
        return { success: false, error: 'Unauthorized' };
      }

      // Can only cancel open or partially filled orders
      if (!['open', 'partially_filled'].includes(order.status)) {
        return { success: false, error: 'Cannot cancel this order' };
      }

      const { error: updateError } = await supabase
        .from('marketplace_orders')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error canceling order:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Try to match orders automatically
   */
  private static async tryMatchOrders(newOrder: MarketplaceOrder): Promise<void> {
    try {
      // Get opposite side orders that can match
      const oppositeType: OrderType = newOrder.order_type === 'buy' ? 'sell' : 'buy';

      const { data: matchingOrders, error } = await supabase
        .from('marketplace_orders')
        .select()
        .eq('property_id', newOrder.property_id)
        .eq('order_type', oppositeType)
        .in('status', ['open', 'partially_filled'])
        .order('price_per_token', { ascending: oppositeType === 'sell' })
        .limit(10);

      if (error || !matchingOrders || matchingOrders.length === 0) {
        return;
      }

      let remainingAmount = newOrder.remaining_amount;

      for (const matchOrder of matchingOrders) {
        if (remainingAmount <= 0) break;

        // Check if prices match
        const canMatch = newOrder.order_type === 'buy'
          ? newOrder.price_per_token >= matchOrder.price_per_token
          : newOrder.price_per_token <= matchOrder.price_per_token;

        if (!canMatch) continue;

        // Calculate trade amount
        const tradeAmount = Math.min(remainingAmount, matchOrder.remaining_amount);
        const tradePrice = matchOrder.price_per_token; // Take maker's price

        // Execute trade
        const tradeInput: ExecuteTradeInput = {
          buy_order_id: newOrder.order_type === 'buy' ? newOrder.id : matchOrder.id,
          sell_order_id: newOrder.order_type === 'sell' ? newOrder.id : matchOrder.id,
          property_id: newOrder.property_id,
          token_id: newOrder.token_id,
          buyer_id: newOrder.order_type === 'buy' ? (newOrder.buyer_id!) : matchOrder.buyer_id!,
          seller_id: newOrder.order_type === 'sell' ? (newOrder.seller_id!) : matchOrder.seller_id!,
          token_amount: tradeAmount,
          price_per_token: tradePrice,
          currency: newOrder.currency,
          trade_type: 'limit'
        };

        await this.executeTrade(tradeInput);
        remainingAmount -= tradeAmount;
      }
    } catch (error) {
      console.error('Error matching orders:', error);
      // Don't throw - order was created successfully
    }
  }

  /**
   * Execute a trade between buyer and seller
   */
  static async executeTrade(
    input: ExecuteTradeInput
  ): Promise<{ success: boolean; trade?: MarketplaceTrade; error?: string }> {
    try {
      const client = this.getClient();

      // Fetch user credentials
      const { data: buyerProfile } = await supabase
        .from('profiles')
        .select('hedera_account_id, hedera_private_key')
        .eq('id', input.buyer_id)
        .single();

      const { data: sellerProfile } = await supabase
        .from('profiles')
        .select('hedera_account_id, hedera_private_key')
        .eq('id', input.seller_id)
        .single();

      if (!buyerProfile?.hedera_account_id || !sellerProfile?.hedera_account_id) {
        return { success: false, error: 'User Hedera accounts not configured' };
      }

      // Calculate fees (e.g., 0.5% platform fee)
      const platformFeeRate = 0.005;
      const totalPrice = input.token_amount * input.price_per_token;
      const platformFee = totalPrice * platformFeeRate;
      const sellerReceives = totalPrice - platformFee;

      // Create pending trade record
      const { data: trade, error: tradeError } = await supabase
        .from('marketplace_trades')
        .insert({
          property_id: input.property_id,
          token_id: input.token_id,
          buy_order_id: input.buy_order_id,
          sell_order_id: input.sell_order_id,
          buyer_id: input.buyer_id,
          seller_id: input.seller_id,
          token_amount: input.token_amount,
          price_per_token: input.price_per_token,
          total_price: totalPrice,
          currency: input.currency || 'HBAR',
          platform_fee: platformFee,
          buyer_fee: 0,
          seller_fee: platformFee,
          status: 'pending',
          trade_type: input.trade_type || 'limit',
          hedera_transaction_id: 'pending'
        })
        .select()
        .single();

      if (tradeError || !trade) {
        return { success: false, error: 'Failed to create trade record' };
      }

      try {
        // Execute atomic swap on Hedera
        // Step 1: Ensure buyer is associated with token
        await ensureTokenAssociation({
          client,
          userAccountId: buyerProfile.hedera_account_id,
          userPrivateKey: buyerProfile.hedera_private_key,
          tokenId: input.token_id
        });

        // Step 2: Transfer tokens from seller to buyer
        const tokenTxId = await transferFungible({
          client,
          tokenId: input.token_id,
          fromAccountId: sellerProfile.hedera_account_id,
          fromPrivateKey: sellerProfile.hedera_private_key,
          toAccountId: buyerProfile.hedera_account_id,
          amountTiny: input.token_amount,
          memo: `Trade ${trade.id}`
        });

        // Step 3: Transfer payment from buyer to seller (in HBAR)
        const paymentTxId = await this.transferPayment(
          client,
          buyerProfile.hedera_account_id,
          buyerProfile.hedera_private_key,
          sellerProfile.hedera_account_id,
          sellerReceives,
          `Payment for trade ${trade.id}`
        );

        // Update trade as completed
        const { data: completedTrade, error: updateError } = await supabase
          .from('marketplace_trades')
          .update({
            status: 'completed',
            hedera_transaction_id: tokenTxId,
            token_transfer_tx: tokenTxId,
            payment_transfer_tx: paymentTxId,
            completed_at: new Date().toISOString()
          })
          .eq('id', trade.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating trade status:', updateError);
        }

        // Update orders
        await this.updateOrderFills(input.buy_order_id, input.sell_order_id, input.token_amount);

        return { success: true, trade: completedTrade as MarketplaceTrade };

      } catch (hederaError: any) {
        // Mark trade as failed
        await supabase
          .from('marketplace_trades')
          .update({ status: 'failed' })
          .eq('id', trade.id);

        return { success: false, error: `Trade execution failed: ${hederaError.message}` };
      }

    } catch (error: any) {
      console.error('Error executing trade:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Transfer payment (HBAR) from buyer to seller
   */
  private static async transferPayment(
    client: Client,
    fromAccountId: string,
    fromPrivateKey: string,
    toAccountId: string,
    amount: number,
    memo: string
  ): Promise<string> {
    const tx = new TransferTransaction()
      .addHbarTransfer(AccountId.fromString(fromAccountId), new Hbar(-amount))
      .addHbarTransfer(AccountId.fromString(toAccountId), new Hbar(amount))
      .setTransactionMemo(memo);

    const signed = await tx.freezeWith(client).sign(PrivateKey.fromString(fromPrivateKey));
    const response = await signed.execute(client);
    const receipt = await response.getReceipt(client);

    if (!receipt.status) throw new Error('Payment transfer failed');
    return response.transactionId.toString();
  }

  /**
   * Update order fill amounts
   */
  private static async updateOrderFills(
    buyOrderId?: string,
    sellOrderId?: string,
    amount?: number
  ): Promise<void> {
    if (!amount) return;

    const orderIds = [buyOrderId, sellOrderId].filter(Boolean);

    for (const orderId of orderIds) {
      const { data: order } = await supabase
        .from('marketplace_orders')
        .select()
        .eq('id', orderId)
        .single();

      if (order) {
        const newFilledAmount = order.filled_amount + amount;
        await supabase
          .from('marketplace_orders')
          .update({ filled_amount: newFilledAmount })
          .eq('id', orderId);
      }
    }
  }

  /**
   * Validate seller has sufficient token balance
   */
  private static async validateSellerBalance(
    userId: string,
    propertyId: string,
    amount: number
  ): Promise<boolean> {
    // Check user's investment balance
    const { data: investments } = await supabase
      .from('investments')
      .select('tokens_purchased')
      .eq('investor_id', userId)
      .eq('property_id', propertyId)
      .eq('status', 'completed');

    if (!investments || investments.length === 0) return false;

    const totalOwned = investments.reduce((sum, inv) => sum + inv.tokens_purchased, 0);

    // Check how many are already in open sell orders
    const { data: openOrders } = await supabase
      .from('marketplace_orders')
      .select('remaining_amount')
      .eq('seller_id', userId)
      .eq('property_id', propertyId)
      .in('status', ['open', 'partially_filled']);

    const totalInOrders = openOrders?.reduce((sum, order) => sum + order.remaining_amount, 0) || 0;

    const availableBalance = totalOwned - totalInOrders;
    return availableBalance >= amount;
  }

  /**
   * Get order book for a property
   */
  static async getOrderBook(propertyId: string): Promise<OrderBook> {
    const { data: orders } = await supabase
      .from('marketplace_order_book')
      .select()
      .eq('property_id', propertyId)
      .order('price_per_token', { ascending: true });

    if (!orders) {
      return { bids: [], asks: [] };
    }

    const bids = orders.filter(o => o.order_type === 'buy') as OrderBookEntry[];
    const asks = orders.filter(o => o.order_type === 'sell') as OrderBookEntry[];

    // Calculate spread and mid price
    const bestBid = bids.length > 0 ? bids[0].price_per_token : 0;
    const bestAsk = asks.length > 0 ? asks[0].price_per_token : 0;
    const spread = bestAsk && bestBid ? bestAsk - bestBid : undefined;
    const mid_price = bestAsk && bestBid ? (bestAsk + bestBid) / 2 : undefined;

    return {
      bids: bids.reverse(), // Highest bid first
      asks,
      spread,
      mid_price
    };
  }

  /**
   * Get market depth chart data
   */
  static async getMarketDepth(propertyId: string): Promise<MarketDepthChart> {
    const orderBook = await this.getOrderBook(propertyId);

    const calculateDepth = (orders: OrderBookEntry[], isAsk: boolean): MarketDepth[] => {
      let cumulative = 0;
      return orders.map(order => {
        cumulative += order.total_amount;
        return {
          price: order.price_per_token,
          amount: order.total_amount,
          total: order.total_amount * order.price_per_token,
          cumulative_amount: cumulative,
          percentage: 0 // Will be calculated after
        };
      });
    };

    const bids = calculateDepth(orderBook.bids, false);
    const asks = calculateDepth(orderBook.asks, true);

    const maxTotal = Math.max(
      ...bids.map(b => b.cumulative_amount),
      ...asks.map(a => a.cumulative_amount)
    );

    // Calculate percentages
    bids.forEach(b => b.percentage = (b.cumulative_amount / maxTotal) * 100);
    asks.forEach(a => a.percentage = (a.cumulative_amount / maxTotal) * 100);

    return { bids, asks, max_total: maxTotal };
  }

  /**
   * Get user's open orders
   */
  static async getUserOrders(
    userId: string,
    propertyId?: string
  ): Promise<MarketplaceOrder[]> {
    let query = supabase
      .from('marketplace_orders')
      .select('*')
      .or(`seller_id.eq.${userId},buyer_id.eq.${userId}`)
      .in('status', ['open', 'partially_filled'])
      .order('created_at', { ascending: false });

    if (propertyId) {
      query = query.eq('property_id', propertyId);
    }

    const { data } = await query;
    return (data as MarketplaceOrder[]) || [];
  }

  /**
   * Get recent trades
   */
  static async getRecentTrades(
    propertyId: string,
    limit: number = 50
  ): Promise<MarketplaceTrade[]> {
    const { data } = await supabase
      .from('marketplace_trades')
      .select('*')
      .eq('property_id', propertyId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(limit);

    return (data as MarketplaceTrade[]) || [];
  }
}

