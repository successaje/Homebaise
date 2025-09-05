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
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set(name, value, options);
            } catch {
              // The `set` method was called from a Server Component.
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.set(name, '', options);
            } catch {
              // The `remove` method was called from a Server Component.
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
    const { propertyId, approvalNotes } = body;

    if (!propertyId) {
      return NextResponse.json({ 
        error: 'propertyId is required' 
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

    // Generate certificate with verification data
    const verificationData = {
      kycVerified: true, // Assuming admin approval includes KYC verification
      legalDocsValidated: true, // Assuming admin approval includes legal validation
      ownershipConfirmed: true // Assuming admin approval includes ownership confirmation
    };
    const certificate = await generatePropertyCertificate(property, verificationData);

    // Create certificate record
    const { data: certificateRecord, error: certError } = await supabase
      .from('property_certificates')
      .insert({
        property_id: propertyId,
        property_name: property.name,
        certificate_hash: certificate.certificateNumber,
        nft_token_id: certificate.tokenId,
        issued_by: user.id,
        status: 'minted',
        ipfs_metadata_url: certificate.metadataUrl,
        approval_notes: approvalNotes
      })
      .select()
      .single();

    if (certError) {
      console.error('Error creating certificate record:', certError);
      return NextResponse.json({ 
        error: 'Failed to create certificate record' 
      }, { status: 500 });
    }

    // Update property with certificate reference
    const { error: updateError } = await supabase
      .from('properties')
      .update({
        certificate_id: certificateRecord.id,
        certificate_token_id: certificate.tokenId,
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
        id: certificateRecord.id,
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