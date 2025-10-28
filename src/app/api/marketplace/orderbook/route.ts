import { NextRequest, NextResponse } from 'next/server';
import { MarketplaceTradingService } from '@/lib/marketplace-trading';

// Mock order book data
const MOCK_ORDER_BOOKS: Record<string, Record<string, unknown>> = {
  'mock-1': {
    bids: [
      { property_id: 'mock-1', order_type: 'buy', price_per_token: 51.50, total_amount: 500, order_count: 3 },
      { property_id: 'mock-1', order_type: 'buy', price_per_token: 51.25, total_amount: 800, order_count: 5 },
      { property_id: 'mock-1', order_type: 'buy', price_per_token: 51.00, total_amount: 1200, order_count: 7 },
      { property_id: 'mock-1', order_type: 'buy', price_per_token: 50.75, total_amount: 600, order_count: 4 }
    ],
    asks: [
      { property_id: 'mock-1', order_type: 'sell', price_per_token: 52.00, total_amount: 600, order_count: 4 },
      { property_id: 'mock-1', order_type: 'sell', price_per_token: 52.25, total_amount: 900, order_count: 6 },
      { property_id: 'mock-1', order_type: 'sell', price_per_token: 52.50, total_amount: 750, order_count: 5 },
      { property_id: 'mock-1', order_type: 'sell', price_per_token: 52.75, total_amount: 400, order_count: 2 }
    ],
    spread: 0.50,
    mid_price: 51.75
  },
  'mock-2': {
    bids: [
      { property_id: 'mock-2', order_type: 'buy', price_per_token: 76.90, total_amount: 400, order_count: 2 },
      { property_id: 'mock-2', order_type: 'buy', price_per_token: 76.50, total_amount: 650, order_count: 4 },
      { property_id: 'mock-2', order_type: 'buy', price_per_token: 76.00, total_amount: 900, order_count: 6 }
    ],
    asks: [
      { property_id: 'mock-2', order_type: 'sell', price_per_token: 77.50, total_amount: 500, order_count: 3 },
      { property_id: 'mock-2', order_type: 'sell', price_per_token: 78.00, total_amount: 700, order_count: 5 },
      { property_id: 'mock-2', order_type: 'sell', price_per_token: 78.50, total_amount: 450, order_count: 3 }
    ],
    spread: 0.60,
    mid_price: 77.20
  },
  'mock-3': {
    bids: [
      { property_id: 'mock-3', order_type: 'buy', price_per_token: 92.80, total_amount: 300, order_count: 2 },
      { property_id: 'mock-3', order_type: 'buy', price_per_token: 92.50, total_amount: 500, order_count: 3 }
    ],
    asks: [
      { property_id: 'mock-3', order_type: 'sell', price_per_token: 93.60, total_amount: 350, order_count: 2 },
      { property_id: 'mock-3', order_type: 'sell', price_per_token: 94.00, total_amount: 450, order_count: 3 }
    ],
    spread: 0.80,
    mid_price: 93.20
  },
  'mock-4': {
    bids: [
      { property_id: 'mock-4', order_type: 'buy', price_per_token: 37.60, total_amount: 700, order_count: 4 },
      { property_id: 'mock-4', order_type: 'buy', price_per_token: 37.30, total_amount: 950, order_count: 6 }
    ],
    asks: [
      { property_id: 'mock-4', order_type: 'sell', price_per_token: 38.10, total_amount: 600, order_count: 4 },
      { property_id: 'mock-4', order_type: 'sell', price_per_token: 38.40, total_amount: 800, order_count: 5 }
    ],
    spread: 0.50,
    mid_price: 37.85
  },
  'mock-5': {
    bids: [
      { property_id: 'mock-5', order_type: 'buy', price_per_token: 26.00, total_amount: 400, order_count: 2 },
      { property_id: 'mock-5', order_type: 'buy', price_per_token: 25.80, total_amount: 550, order_count: 3 }
    ],
    asks: [
      { property_id: 'mock-5', order_type: 'sell', price_per_token: 26.50, total_amount: 350, order_count: 2 },
      { property_id: 'mock-5', order_type: 'sell', price_per_token: 26.75, total_amount: 500, order_count: 3 }
    ],
    spread: 0.50,
    mid_price: 26.25
  },
  'mock-6': {
    bids: [
      { property_id: 'mock-6', order_type: 'buy', price_per_token: 57.20, total_amount: 550, order_count: 3 },
      { property_id: 'mock-6', order_type: 'buy', price_per_token: 56.90, total_amount: 700, order_count: 5 }
    ],
    asks: [
      { property_id: 'mock-6', order_type: 'sell', price_per_token: 57.90, total_amount: 480, order_count: 3 },
      { property_id: 'mock-6', order_type: 'sell', price_per_token: 58.20, total_amount: 620, order_count: 4 }
    ],
    spread: 0.70,
    mid_price: 57.55
  }
};

// GET /api/marketplace/orderbook - Get order book for a property
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('property_id');

    if (!propertyId) {
      return NextResponse.json(
        { error: 'property_id is required' },
        { status: 400 }
      );
    }

    // Return mock data for demo properties
    if (propertyId.startsWith('mock-') && MOCK_ORDER_BOOKS[propertyId]) {
      const mockOrderBook = MOCK_ORDER_BOOKS[propertyId];
      return NextResponse.json(
        {
          orderBook: mockOrderBook,
          marketDepth: {
            bids: (mockOrderBook as Record<string, unknown>).bids as Record<string, unknown>[],
            asks: (mockOrderBook as Record<string, unknown>).asks as Record<string, unknown>[],
            max_total: Math.max(
              ...((mockOrderBook as Record<string, unknown>).bids as Record<string, unknown>[]).map((b: Record<string, unknown>) => b.total_amount as number),
              ...((mockOrderBook as Record<string, unknown>).asks as Record<string, unknown>[]).map((a: Record<string, unknown>) => a.total_amount as number)
            )
          },
          timestamp: new Date().toISOString()
        },
        { status: 200 }
      );
    }

    const orderBook = await MarketplaceTradingService.getOrderBook(propertyId);
    const marketDepth = await MarketplaceTradingService.getMarketDepth(propertyId);

    return NextResponse.json(
      {
        orderBook,
        marketDepth,
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error in GET /api/marketplace/orderbook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
