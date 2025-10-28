import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    // Get all cookies and log them for debugging
    const allCookies = cookieStore.getAll();
    console.log('Test auth - All cookies received:', allCookies.map(c => ({ name: c.name, value: c.value?.slice(0, 20) + '...' })));
    
    // Check for Authorization header
    const authHeader = request.headers.get('authorization');
    console.log('Test auth - Authorization header:', authHeader ? 'present' : 'missing');
    
    // Look for Supabase-specific cookies
    const supabaseCookies = allCookies.filter(c => c.name.includes('supabase') || c.name.includes('sb-'));
    console.log('Test auth - Supabase cookies found:', supabaseCookies.map(c => c.name));
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const cookie = cookieStore.get(name);
            console.log(`Test auth - Getting cookie ${name}:`, cookie?.value ? 'exists' : 'missing');
            return cookie?.value;
          },
          set(name: string, value: string, options: Record<string, unknown>) {
            cookieStore.set(name, value, options);
          },
          remove(name: string, options: Record<string, unknown>) {
            cookieStore.delete(name);
          },
        },
      }
    );

    // Try to get the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('Test auth - Session check result:', { 
      session: session?.user?.id, 
      error: sessionError,
      hasSession: !!session 
    });

    // Try to get user directly
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('Test auth - Direct user check result:', { 
      user: user?.id, 
      error: userError,
      hasUser: !!user 
    });

    // If still no user, try to manually extract session from cookies
    if (!user && !session) {
      console.log('Test auth - Attempting manual cookie extraction...');
      
      // Look for the access token cookie
      const accessTokenCookie = allCookies.find(c => c.name.includes('access_token') || c.name.includes('supabase-auth-token'));
      if (accessTokenCookie) {
        console.log('Test auth - Found access token cookie:', accessTokenCookie.name);
        try {
          // Try to parse the token and validate it
          const tokenData = JSON.parse(decodeURIComponent(accessTokenCookie.value));
          console.log('Test auth - Token data structure:', Object.keys(tokenData));
          
          if (tokenData.access_token) {
            // Try to get user with this token
            const { data: { user: tokenUser }, error: tokenError } = await supabase.auth.getUser(tokenData.access_token);
            console.log('Test auth - Token-based auth result:', { 
              user: tokenUser?.id, 
              error: tokenError,
              hasUser: !!tokenUser 
            });
            
            if (tokenUser) {
              return NextResponse.json({
                success: true,
                message: 'Authentication successful via token',
                user: {
                  id: tokenUser.id,
                  email: tokenUser.email
                },
                method: 'token-based',
                cookies: allCookies.length,
                hasAuthHeader: !!authHeader
              });
            }
          }
        } catch (parseError) {
          console.error('Test auth - Failed to parse token cookie:', parseError);
        }
      }
    }

    if (user) {
      return NextResponse.json({
        success: true,
        message: 'Authentication successful',
        user: {
          id: user.id,
          email: user.email
        },
        method: 'session-based',
        cookies: allCookies.length,
        hasAuthHeader: !!authHeader
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'No user found',
        errors: {
          sessionError: sessionError?.message,
          userError: userError?.message
        },
        cookies: allCookies.length,
        hasAuthHeader: !!authHeader,
        supabaseCookies: supabaseCookies.map(c => c.name),
        allCookieNames: allCookies.map(c => c.name)
      }, { status: 401 });
    }

  } catch (error) {
    console.error('Test auth - Unexpected error:', error);
    return NextResponse.json({
      success: false,
      message: 'Unexpected error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 