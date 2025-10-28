'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentUserProfile } from '@/lib/profile';

export default function DebugAuth() {
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const debugAuth = async () => {
      try {
        console.log('DebugAuth - Starting debug...');
        
        // Check auth
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        console.log('DebugAuth - Auth check:', { user: user?.id, email: user?.email, authError });
        
        // Check profile
        const profile = await getCurrentUserProfile();
        console.log('DebugAuth - Profile check:', profile);
        
        // Check session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        console.log('DebugAuth - Session check:', { session: !!session, sessionError });
        
        setDebugInfo({
          user: user ? { id: user.id, email: user.email } : null,
          profile,
          session: !!session,
          authError: authError?.message,
          sessionError: sessionError?.message
        });
      } catch (error) {
        console.error('DebugAuth - Error:', error);
        setDebugInfo({ error: error instanceof Error ? error.message : 'Unknown error' });
      } finally {
        setLoading(false);
      }
    };

    debugAuth();
  }, []);

  if (loading) {
    return <div className="text-white">Loading debug info...</div>;
  }

  return (
    <div className="bg-gray-800 p-4 rounded-lg text-white text-sm">
      <h3 className="font-bold mb-2">Debug Info:</h3>
      <pre className="whitespace-pre-wrap">
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
    </div>
  );
} 