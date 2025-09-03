import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  createPropertyTreasuryAccount, 
  createPropertyToken, 
  createPropertyNFT,
  TokenMetadata,
  MintedToken,
  TreasuryAccount
} from '@/lib/hedera-treasury';
import { Client, PrivateKey, AccountBalanceQuery } from '@hashgraph/sdk';

// Define the property type with existing columns
type Property = {
  id: string;
  title?: string | null;
  description?: string | null;
  location?: string | null;
  property_type?: string | null;
  total_value?: number | null;
  status?: string;
  certificate_token_id?: string | null;
  certificate_number?: string | null;
  certificate_issued_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

interface TokenizeRequest {
  propertyId: string;
  tokenType: 'FUNGIBLE' | 'NON_FUNGIBLE';
  tokenName?: string;
  tokenSymbol?: string;
  tokenDecimals?: number;
}

// Helper function to parse and validate the request body
async function parseRequest(request: NextRequest): Promise<TokenizeRequest> {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.propertyId || !body.tokenType) {
      throw new Error('Missing required fields: propertyId and tokenType are required');
    }
    
    return {
      propertyId: body.propertyId,
      tokenType: body.tokenType,
      tokenName: body.tokenName,
      tokenSymbol: body.tokenSymbol,
      tokenDecimals: body.tokenDecimals
    };
  } catch (error) {
    console.error('Error parsing request body:', error);
    throw new Error('Invalid request body');
  }
}

export async function POST(request: NextRequest) {
  try {
    // Debug: Log all cookies received
    const cookieHeader = request.headers.get('cookie');
    console.log('Received cookies:', cookieHeader);
    
    // Debug: Log Authorization header
    const authHeader = request.headers.get('authorization');
    console.log('Authorization header:', authHeader ? 'present' : 'missing');
    
    // Create Supabase client
    const supabase = createClient();
    
    // Try to get session from cookies first
    let { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    // If no session from cookies, try to get user from Authorization header
    if (sessionError || !session) {
      console.log('No session from cookies, trying Authorization header...');
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        console.log('Using Authorization token for authentication');
        
        // Create a temporary client with the token
        const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
        const tempClient = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            global: {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          }
        );
        
        const { data: { user }, error: userError } = await tempClient.auth.getUser();
        
        if (userError || !user) {
          console.error('Failed to get user from token:', userError);
          return NextResponse.json(
            { error: 'Authentication required: Invalid or expired token' },
            { status: 401 }
          );
        }
        
        // Create a mock session object
        session = {
          user,
          access_token: token,
          refresh_token: '',
          expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
          expires_in: 3600,
          token_type: 'bearer'
        };
        
        console.log('Created session from Authorization token for user:', user.id);
      } else {
        console.error('Session error or no session found:', sessionError?.message || 'No active session');
        return NextResponse.json(
          { error: 'Authentication required: No valid session found' },
          { status: 401 }
        );
      }
    }
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required: No valid session found' },
        { status: 401 }
      );
    }
    
    console.log('User session found:', {
      userId: session.user?.id,
      email: session.user?.email,
      expiresAt: session.expires_at,
      token: session.access_token ? 'token-present' : 'no-token'
    });
    
    // Get the user ID from the session
    const userId = session.user.id;
    if (!userId) {
      throw new Error('User ID not found in session');
    }
    
    // Parse the request body
    const { 
      propertyId, 
      tokenType, 
      tokenName, 
      tokenSymbol, 
      tokenDecimals 
    } = await parseRequest(request);

    if (!propertyId || !tokenType) {
      return NextResponse.json(
        { error: 'Missing required fields: propertyId and tokenType are required' },
        { status: 400 }
      );
    }

    // Get property details (only select columns that exist)
    const { data: propertyDetails, error: detailsError } = await supabase
      .from('properties')
      .select('title, description, location, property_type, total_value, status, certificate_token_id')
      .eq('id', propertyId)
      .single();

    if (detailsError || !propertyDetails) {
      console.error('Error fetching property details:', detailsError);
      return NextResponse.json(
        { error: 'Failed to fetch property details' },
        { status: 500 }
      );
    }
    
    // Cast to Property type for type safety
    const property = propertyDetails as Property;

    // Check if property is already tokenized by looking at status or certificate
    if (property?.status === 'tokenized' || property?.certificate_token_id) {
      return NextResponse.json(
        { error: 'Property is already tokenized' },
        { status: 400 }
      );
    }

    try {
      // Create a Hedera client with operator credentials
      const operatorId = process.env.HEDERA_OPERATOR_ID || process.env.MY_ACCOUNT_ID;
      const operatorPrivateKey = process.env.HEDERA_OPERATOR_PRIVATE_KEY || process.env.MY_PRIVATE_KEY;
      
      if (!operatorId || !operatorPrivateKey) {
        console.error('Missing Hedera operator credentials');
        return NextResponse.json(
          { error: 'Hedera operator credentials not configured' },
          { status: 500 }
        );
      }
      
      console.log('Hedera credentials found:', {
        operatorId,
        privateKeyLength: operatorPrivateKey.length,
        privateKeyPrefix: operatorPrivateKey.substring(0, 10) + '...'
      });
      
      // Parse the private key properly
      let parsedPrivateKey;
      try {
        parsedPrivateKey = PrivateKey.fromString(operatorPrivateKey);
        console.log('Private key parsed successfully');
      } catch (keyError) {
        console.error('Error parsing private key:', keyError);
        return NextResponse.json(
          { error: 'Invalid Hedera private key format' },
          { status: 500 }
        );
      }
      
      const client = Client.forTestnet()
        .setOperator(operatorId, parsedPrivateKey);
      
      console.log('Hedera client configured with operator:', operatorId);
      
      // Test the client configuration by getting account balance
      try {
        const query = new AccountBalanceQuery().setAccountId(operatorId);
        const accountBalance = await query.execute(client);
        console.log('Operator account balance:', accountBalance.hbars.toString(), 'HBAR');
      } catch (balanceError) {
        console.error('Error getting account balance:', balanceError);
        return NextResponse.json(
          { error: 'Failed to verify Hedera client configuration' },
          { status: 500 }
        );
      }
      
      // Create a Hedera treasury account for the property
      const treasuryAccount = await createPropertyTreasuryAccount(client);

      // Create the token based on the token type
      let tokenResult: MintedToken;
      
      if (tokenType === 'NON_FUNGIBLE') {
        const metadata: TokenMetadata = {
          name: tokenName || property.title || 'Property NFT',
          symbol: tokenSymbol || 'HPROP',
          decimals: 0, // NFTs have 0 decimals
          initialSupply: 1, // Initial supply for NFT
          maxSupply: 1, // Max supply for NFT (1 for unique NFTs)
          treasuryAccountId: treasuryAccount.accountId,
          propertyId: propertyId
        };

        tokenResult = await createPropertyNFT(client, metadata);
      } else {
        // Fungible token
        const tokenNameToUse = tokenName || property.title || 'Property Token';
        const tokenSymbolToUse = tokenSymbol || 'HPROP';
        const initialSupply = 1000000;
        
        const metadata: TokenMetadata = {
          name: tokenNameToUse,
          symbol: tokenSymbolToUse,
          decimals: tokenDecimals || 8,
          initialSupply,
          maxSupply: initialSupply * 2, // Allow minting up to double the initial supply
          treasuryAccountId: treasuryAccount.accountId,
          propertyId: propertyId
        };
        
        tokenResult = await createPropertyToken(client, metadata);
      }

      // Create property treasury account record using existing column names
      const { error: treasuryError } = await supabase
        .from('property_treasury_accounts')
        .insert({
          property_id: propertyId,
          hedera_account_id: treasuryAccount.accountId,
          hedera_public_key: treasuryAccount.publicKey,
          hedera_private_key: treasuryAccount.privateKey,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (treasuryError) {
        console.error('Error saving treasury account:', treasuryError);
        return NextResponse.json(
          { error: 'Failed to save treasury account' },
          { status: 500 }
        );
      }

      // Update the property with token information using existing columns
      const propertyUpdate = {
        status: 'tokenized',
        updated_at: new Date().toISOString(),
        certificate_token_id: tokenResult.tokenId.toString(),
        certificate_number: `CERT-${Date.now()}`,
        certificate_issued_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('properties')
        .update(propertyUpdate)
        .eq('id', propertyId);

      if (updateError) {
        console.error('Error updating property:', updateError);
        return NextResponse.json(
          { error: 'Failed to update property status' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Property successfully tokenized as ${tokenType}`,
        treasuryAccount: {
          accountId: treasuryAccount.accountId,
          publicKey: treasuryAccount.publicKey,
          initialBalance: treasuryAccount.initialBalance.toString()
        },
        token: {
          tokenId: tokenResult.tokenId,
          tokenType: tokenType,
          ...(tokenType === 'NON_FUNGIBLE' ? { nftId: tokenResult.tokenId } : { totalSupply: (tokenResult as any).totalSupply }),
        },
        property: {
          id: propertyId,
          status: 'tokenized',
          certificateNumber: `CERT-${Date.now()}`,
          issuedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error during tokenization:', error);
      return NextResponse.json(
        { error: `Tokenization failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('Error in tokenization route:', {
      error: errorMessage,
      stack: errorStack
    });
    
    return NextResponse.json(
      { 
        error: `Internal server error: ${errorMessage}`,
        ...(process.env.NODE_ENV === 'development' && { details: errorStack })
      },
      { status: 500 }
    );
  }
}