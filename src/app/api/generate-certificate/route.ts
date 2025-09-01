import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { generatePropertyCertificate } from '@/lib/certificate';

export async function POST(request: NextRequest) {
  try {
    // Check environment variables
    console.log('Environment check:', {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasHederaAccountId: !!(process.env.MY_ACCOUNT_ID || process.env.NEXT_PUBLIC_MY_ACCOUNT_ID),
      hasHederaPrivateKey: !!(process.env.MY_PRIVATE_KEY || process.env.NEXT_PUBLIC_MY_PRIVATE_KEY),
      hasPinataToken: !!process.env.NEXT_PUBLIC_PINATA_JWT_TOKEN,
    });

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('Auth check:', { user: !!user, authError: authError?.message });
    
    if (authError || !user) {
      console.log('Authentication failed:', { authError: authError?.message, user: !!user });
      return NextResponse.json({ error: 'Unauthorized - Please log in to generate certificates' }, { status: 401 });
    }

    const body = await request.json();
    const { propertyId, verificationData } = body;

    if (!propertyId || !verificationData) {
      return NextResponse.json({ 
        error: 'propertyId and verificationData are required' 
      }, { status: 400 });
    }

    // Fetch property details
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id, name, location, total_value, listed_by')
      .eq('id', propertyId)
      .single();

    if (propertyError || !property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // Check if user is authorized (property owner or admin)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAuthorized = property.listed_by === user.id || profile?.role === 'admin';
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Not authorized to generate certificate' }, { status: 403 });
    }

    // Generate certificate
    const certificate = await generatePropertyCertificate(property, verificationData);

    // Update property with certificate info
    const { error: updateError } = await supabase
      .from('properties')
      .update({
        certificate_token_id: certificate.tokenId,
        certificate_number: certificate.certificateNumber,
        certificate_metadata_url: certificate.metadataUrl,
        certificate_issued_at: new Date().toISOString(),
        status: 'certified'
      })
      .eq('id', propertyId);

    if (updateError) {
      console.error('Error updating property with certificate:', updateError);
      // Certificate was created but property update failed
      return NextResponse.json({ 
        error: 'Certificate created but failed to update property',
        certificate 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      certificate: {
        tokenId: certificate.tokenId,
        certificateNumber: certificate.certificateNumber,
        metadataUrl: certificate.metadataUrl
      }
    });

  } catch (error) {
    console.error('Error generating certificate:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate certificate';
    console.error('Certificate generation failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
} 