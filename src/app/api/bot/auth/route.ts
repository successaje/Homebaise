import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Verify bot authentication
export async function POST(request: NextRequest) {
  try {
    const { userId, platform, chatId } = await request.json();

    const supabase = await createClient();
    
    // Verify user exists and get session token
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, email, phone_number')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Type assertion to ensure profile has the expected properties
    const userProfile = profile as { id: string; email: string; phone_number: string };

    // TODO: Create bot_sessions table in database
    // For now, skip session creation
    const session = null;
    const sessionError = null;

    if (sessionError) {
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    // Generate a session token for API calls
    // In production, this should use proper JWT
    const sessionToken = Buffer.from(JSON.stringify({
      userId,
      platform,
      chatId,
      timestamp: Date.now()
    })).toString('base64');

    return NextResponse.json({
      success: true,
      sessionToken,
      user: {
        id: userProfile.id,
        email: userProfile.email,
      }
    });

  } catch (error) {
    console.error('Bot auth error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

