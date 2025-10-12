import { NextRequest, NextResponse } from 'next/server';
import { MarketplaceTradingService } from '@/lib/marketplace-trading';

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
  } catch (error: any) {
    console.error('Error in GET /api/marketplace/orderbook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

