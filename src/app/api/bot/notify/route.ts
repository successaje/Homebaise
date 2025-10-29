import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Send notification to user via bot
export async function POST(request: NextRequest) {
  try {
    const {
      userId,
      platform,
      messageType,
      title,
      message,
      metadata
    } = await request.json();

    const supabase = await createClient();

    // Get user's bot session
    const { data: session } = await supabase
      .from('bot_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', platform)
      .eq('is_active', true)
      .single();

    if (!session) {
      return NextResponse.json(
        { error: 'No active bot session found' },
        { status: 404 }
      );
    }

    // Check notification preferences
    const { data: prefs } = await supabase
      .from('user_notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Check if this notification type is enabled
    const notificationKey = `${messageType}_alerts` as keyof typeof prefs;
    if (prefs && !prefs[notificationKey]) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: 'Notification type disabled by user'
      });
    }

    // Log notification
    const { data: notification, error: logError } = await supabase
      .from('bot_notifications')
      .insert({
        user_id: userId,
        platform,
        chat_id: session.chat_id,
        message_type: messageType,
        title,
        message,
        metadata: metadata || {},
        status: 'pending'
      })
      .select()
      .single();

    if (logError) {
      return NextResponse.json(
        { error: 'Failed to log notification' },
        { status: 500 }
      );
    }

    // In a real implementation, you would send the message to the bot platform here
    // For Telegram, you'd use the Telegram Bot API
    // For WhatsApp, you'd use the WhatsApp Business API

    // Update notification status to sent
    await supabase
      .from('bot_notifications')
      .update({ status: 'sent' })
      .eq('id', notification.id);

    return NextResponse.json({
      success: true,
      notificationId: notification.id
    });

  } catch (error) {
    console.error('Notification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

