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

    // Create or update bot session
    const { data: session, error: sessionError } = await supabase
      .from('bot_sessions')
      .upsert({
        user_id: userId,
        platform,
        chat_id: chatId,
        is_active: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'platform,chat_id'
      })
      .select()
      .single();

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
        id: profile.id,
        email: profile.email,
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

