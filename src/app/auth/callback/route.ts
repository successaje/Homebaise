import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: Record<string, unknown>) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: Record<string, unknown>) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    // Exchange the code for a session
    await supabase.auth.exchangeCodeForSession(code);

    // Ensure a profile exists for this user (idempotent)
    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes?.user;
    if (user) {
      const fullName = (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || null;
      const avatarUrl = (user.user_metadata?.avatar_url as string) || null;
      const provider = (user.app_metadata?.provider as string) || 'email';

      await supabase.from('profiles').upsert(
        {
          id: user.id,
          email: user.email,
          full_name: fullName,
          avatar_url: avatarUrl,
          provider,
        },
        { onConflict: 'id' }
      );
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL('/dashboard', request.url));
} 