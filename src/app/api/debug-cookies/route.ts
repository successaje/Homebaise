import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    // Get all cookies
    const allCookies = cookieStore.getAll();
    
    // Check for Authorization header
    const authHeader = request.headers.get('authorization');
    
    // Look for Supabase-specific cookies
    const supabaseCookies = allCookies.filter(c => 
      c.name.includes('supabase') || 
      c.name.includes('sb-') || 
      c.name.includes('access_token') ||
      c.name.includes('auth')
    );
    
    // Get cookie details (without exposing sensitive values)
    const cookieDetails = allCookies.map(cookie => ({
      name: cookie.name,
      value: cookie.value ? `${cookie.value.slice(0, 20)}...` : 'empty',
      length: cookie.value?.length || 0,
      isSupabase: cookie.name.includes('supabase') || cookie.name.includes('sb-'),
      isAuth: cookie.name.includes('auth') || cookie.name.includes('token')
    }));
    
    return NextResponse.json({
      success: true,
      message: 'Cookie inspection complete',
      totalCookies: allCookies.length,
      supabaseCookies: supabaseCookies.length,
      hasAuthHeader: !!authHeader,
      cookieDetails,
      supabaseCookieNames: supabaseCookies.map(c => c.name),
      allCookieNames: allCookies.map(c => c.name)
    });

  } catch (error) {
    console.error('Cookie debug error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to inspect cookies',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 