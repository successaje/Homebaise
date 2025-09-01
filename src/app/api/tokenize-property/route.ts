import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Client } from '@hashgraph/sdk';
import { 
  createPropertyTreasuryAccount, 
  createPropertyToken, 
  createPropertyNFT,
  TokenMetadata 
} from '@/lib/hedera-treasury';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    // Get all cookies and log them for debugging
    const allCookies = cookieStore.getAll();
    console.log('All cookies received:', allCookies.map(c => ({ name: c.name, value: c.value?.slice(0, 20) + '...' })));
    
    // Check for Authorization header as fallback
    const authHeader = request.headers.get('authorization');
    console.log('Authorization header:', authHeader ? 'present' : 'missing');
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const cookie = cookieStore.get(name);
            console.log(`Getting cookie ${name}:`, cookie?.value ? 'exists' : 'missing');
            return cookie?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set(name, value, options);
          },
          remove(name: string, options: any) {
            cookieStore.delete(name, options);
          },
        },
      }
    );

    // Try to get the session first
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('Session check result:', { 
      session: session?.user?.id, 
      error: sessionError,
      hasSession: !!session 
    });

    // If no session, try to get user directly
    let user = session?.user;
    if (!user) {
      const { data: { user: directUser }, error: userError } = await supabase.auth.getUser();
      console.log('Direct user check result:', { 
        user: directUser?.id, 
        error: userError,
        hasUser: !!directUser 
      });
      user = directUser;
    }
    
    // If still no user, try to create a client-side client as last resort
    if (!user) {
      console.log('Attempting client-side authentication as fallback...');
      try {
        // Create a new client instance
        const { createClient } = await import('@supabase/supabase-js');
        const clientSideSupabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        
        // Try to get user from client-side
        const { data: { user: clientUser }, error: clientError } = await clientSideSupabase.auth.getUser();
        console.log('Client-side auth result:', { 
          user: clientUser?.id, 
          error: clientError,
          hasUser: !!clientUser 
        });
        
        if (clientUser) {
          user = clientUser;
        }
      } catch (fallbackError) {
        console.error('Fallback authentication failed:', fallbackError);
      }
    }
    
    // If still no user, try to manually extract session from cookies
    if (!user) {
      console.log('Attempting manual cookie extraction...');
      
      // Look for the access token cookie
      const accessTokenCookie = allCookies.find(c => c.name.includes('access_token') || c.name.includes('supabase-auth-token'));
      if (accessTokenCookie) {
        console.log('Found access token cookie:', accessTokenCookie.name);
        try {
          // Try to parse the token and validate it
          const tokenData = JSON.parse(decodeURIComponent(accessTokenCookie.value));
          console.log('Token data structure:', Object.keys(tokenData));
          
          if (tokenData.access_token) {
            // Try to get user with this token
            const { data: { user: tokenUser }, error: tokenError } = await supabase.auth.getUser(tokenData.access_token);
            console.log('Token-based auth result:', { 
              user: tokenUser?.id, 
              error: tokenError,
              hasUser: !!tokenUser 
            });
            
            if (tokenUser) {
              user = tokenUser;
            }
          }
        } catch (parseError) {
          console.error('Failed to parse token cookie:', parseError);
        }
      }
    }
    
    if (!user) {
      console.error('No user found in any authentication method');
      return NextResponse.json(
        { error: 'No user session found. Please log in again.' },
        { status: 401 }
      );
    }

    console.log('User authenticated:', user.id);

    const body = await request.json();
    const { 
      propertyId, 
      tokenType, 
      tokenSymbol, 
      tokenDecimals = 18,
      tokenName 
    } = body;

    if (!propertyId || !tokenType || !tokenSymbol) {
      return NextResponse.json(
        { error: 'Missing required fields: propertyId, tokenType, tokenSymbol' },
        { status: 400 }
      );
    }

    // Verify property ownership
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .eq('listed_by', user.id)
      .single();

    if (propertyError || !property) {
      console.error('Property ownership check failed:', { propertyError, propertyId, userId: user.id });
      return NextResponse.json(
        { error: 'Property not found or access denied' },
        { status: 404 }
      );
    }

    console.log('Property ownership verified:', property.id);

    // Check if property already has a treasury account
    const { data: existingTreasury } = await supabase
      .from('property_treasury_accounts')
      .select('*')
      .eq('property_id', propertyId)
      .single();

    if (existingTreasury) {
      return NextResponse.json(
        { error: 'Property already has a treasury account' },
        { status: 400 }
      );
    }

    // Initialize Hedera client
    const client = Client.forTestnet(); // Change to mainnet for production
    client.setOperator(
      process.env.HEDERA_OPERATOR_ID!,
      process.env.HEDERA_OPERATOR_PRIVATE_KEY!
    );

    // Create treasury account
    console.log('Creating treasury account for property:', propertyId);
    const treasuryAccount = await createPropertyTreasuryAccount(client, 10); // 10 HBAR initial balance

    // Save treasury account to Supabase
    const { data: treasuryRecord, error: treasuryError } = await supabase
      .from('property_treasury_accounts')
      .insert({
        property_id: propertyId,
        hedera_account_id: treasuryAccount.accountId,
        hedera_public_key: treasuryAccount.publicKey,
        hedera_private_key: treasuryAccount.privateKey,
        initial_balance_hbar: 10.0,
        current_balance_hbar: 10.0
      })
      .select()
      .single();

    if (treasuryError) {
      console.error('Error saving treasury account:', treasuryError);
      return NextResponse.json(
        { error: 'Failed to save treasury account' },
        { status: 500 }
      );
    }

    // Calculate token supply based on property value (1:1 ratio)
    const propertyValue = property.total_value || 0;
    const initialSupply = Math.floor(propertyValue * Math.pow(10, tokenDecimals)); // Convert to smallest unit
    const maxSupply = initialSupply; // Fixed supply for now

    // Create token metadata
    const tokenMetadata: TokenMetadata = {
      name: tokenName || `${property.name || property.title} Token`,
      symbol: tokenSymbol,
      decimals: tokenDecimals,
      initialSupply,
      maxSupply,
      treasuryAccountId: treasuryAccount.accountId,
      propertyId
    };

    let mintedToken;

    if (tokenType === 'fungible') {
      // Create fungible token
      console.log('Creating fungible token with metadata:', tokenMetadata);
      mintedToken = await createPropertyToken(client, tokenMetadata);
      
      // Save token details to properties table
      const { error: updateError } = await supabase
        .from('properties')
        .update({
          token_price: propertyValue / initialSupply, // Price per token
          status: 'active'
        })
        .eq('id', propertyId);

      if (updateError) {
        console.error('Error updating property:', updateError);
      }
    } else if (tokenType === 'nft') {
      // Create NFT certificate
      console.log('Creating NFT certificate with metadata:', tokenMetadata);
      mintedToken = await createPropertyNFT(client, tokenMetadata);
      
      // Save NFT details to properties table
      const { error: updateError } = await supabase
        .from('properties')
        .update({
          status: 'certified'
        })
        .eq('id', propertyId);

      if (updateError) {
        console.error('Error updating property:', updateError);
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid token type. Must be "fungible" or "nft"' },
        { status: 400 }
      );
    }

    // Update property with token info
    const { error: tokenUpdateError } = await supabase
      .from('properties')
      .update({
        certificate_token_id: mintedToken.tokenId,
        certificate_number: `CERT-${propertyId.slice(0, 8).toUpperCase()}`,
        certificate_issued_at: new Date().toISOString()
      })
      .eq('id', propertyId);

    if (tokenUpdateError) {
      console.error('Error updating property with token info:', tokenUpdateError);
    }

    return NextResponse.json({
      success: true,
      message: `Property successfully tokenized as ${tokenType}`,
      treasuryAccount: {
        accountId: treasuryAccount.accountId,
        publicKey: treasuryAccount.publicKey,
        initialBalance: treasuryAccount.initialBalance.toString()
      },
      token: mintedToken,
      property: {
        id: propertyId,
        status: tokenType === 'fungible' ? 'active' : 'certified'
      }
    });

  } catch (error) {
    console.error('Error tokenizing property:', error);
    return NextResponse.json(
      { error: `Failed to tokenize property: ${error}` },
      { status: 500 }
    );
  }
} 