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

    const botWebhookUrl = process.env.BOT_NOTIFY_WEBHOOK_URL;
    const botServerToken = process.env.BOT_SERVER_TOKEN;

    if (botWebhookUrl && botServerToken) {
      try {
        const response = await fetch(botWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Bot-Token': botServerToken,
          },
          body: JSON.stringify({
            userId,
            title,
            message,
            metadata,
            messageType,
          }),
        });

        if (!response.ok) {
          console.error('Bot notify webhook responded with', response.status, await response.text());
        }
      } catch (error) {
        console.error('Failed to call bot notify webhook:', error);
      }
    }

    return NextResponse.json({
      success: true,
      deliveredToBot: Boolean(botWebhookUrl && botServerToken),
    });

  } catch (error) {
    console.error('Notification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

