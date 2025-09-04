import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { 
  Client, 
  PrivateKey, 
  TokenCreateTransaction, 
  TokenType, 
  TokenSupplyType, 
  TokenMintTransaction, 
  Hbar, 
  TokenId,
  TokenInfoQuery
} from "@hashgraph/sdk";

const PINATA_JWT = process.env.PINATA_JWT;
const CERTIFICATE_TOKEN_ID = process.env.CERTIFICATE_TOKEN_ID; // Store this in your environment variables

async function uploadToPinata(metadata: any) {
  try {
    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PINATA_JWT}`
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: {
          name: `certificate-${Date.now()}.json`
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Pinata API error: ${error}`);
    }

    const result = await response.json();
    return `ipfs://${result.IpfsHash}`;
  } catch (error) {
    console.error('Error uploading to Pinata:', error);
    throw new Error('Failed to upload metadata to Pinata');
  }
}

export async function POST(request: Request) {
  try {
    const {
      propertyId,
      propertyName,
      location,
      valuationUSD,
      tokenSymbol,
      approvalNotes
    } = await request.json();

    // Initialize Hedera client
    const operatorId = process.env.MY_ACCOUNT_ID!;
    const operatorKey = PrivateKey.fromString(process.env.MY_PRIVATE_KEY!);
    const client = Client.forTestnet().setOperator(operatorId, operatorKey);

    // Generate a unique certificate number
    const certificateNumber = `HBCERT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Create certificate metadata
    const metadata = {
      "name": `Homebaise Property Certificate - ${propertyName}`,
      "symbol": "HB-CERT",
      "description": `Official verification certificate for tokenized property listed on Homebaise. ${approvalNotes || ''}`,
      "type": "PropertyCertificate",
      "version": "1.0",
      "issuer": {
        "name": "Homebaise Verification Authority",
        "accountId": operatorId
      },
      "property": {
        "propertyId": propertyId,
        "location": location,
        "valuationUSD": valuationUSD,
        "tokenSymbol": tokenSymbol,
        "certificateNumber": certificateNumber
      },
      "verification": {
        "verifiedBy": "Homebaise Verification Authority",
        "verificationDate": new Date().toISOString(),
        "documents": []
      },
      "attributes": [
        {
          "trait_type": "Status",
          "value": "Verified"
        },
        {
          "trait_type": "Certificate Type",
          "value": "Property Verification"
        }
      ],
      "external_url": `https://homebaise.vercel.app/properties/${propertyId}`
    };

    // Upload metadata to Pinata
    const ipfsUri = await uploadToPinata(metadata);
    console.log('Metadata uploaded to Pinata:', ipfsUri);

    let tokenId;
    
    // Check if we already have a certificate token ID
    if (!CERTIFICATE_TOKEN_ID) {
      // Create the certificate token if it doesn't exist
      const nftCreate = await new TokenCreateTransaction()
        .setTokenName("Homebaise Property Certificates")
        .setTokenSymbol("HBCERT")
        .setTokenType(TokenType.NonFungibleUnique)
        .setSupplyType(TokenSupplyType.Infinite)
        .setTreasuryAccountId(operatorId)
        .setAdminKey(operatorKey.publicKey)
        .setSupplyKey(operatorKey.publicKey)
        .setTokenMemo("Homebaise Verified Property Certificates")
        .freezeWith(client);

      const nftCreateSign = await nftCreate.sign(operatorKey);
      const nftCreateSubmit = await nftCreateSign.execute(client);
      const nftCreateReceipt = await nftCreateSubmit.getReceipt(client);
      tokenId = nftCreateReceipt.tokenId;

      if (!tokenId) {
        throw new Error('Failed to create certificate NFT token');
      }
      
      console.log('Created new certificate token:', tokenId.toString());
      // In production, you should store this token ID in your environment variables
      // process.env.CERTIFICATE_TOKEN_ID = tokenId.toString();
    } else {
      tokenId = TokenId.fromString(CERTIFICATE_TOKEN_ID);
      // Verify the token exists
      try {
        await new TokenInfoQuery()
          .setTokenId(tokenId)
          .execute(client);
      } catch (error) {
        throw new Error(`Certificate token ${tokenId} not found`);
      }
    }

    // Mint a new NFT in the certificate collection
    const mintTx = await new TokenMintTransaction()
      .setTokenId(tokenId)
      .setMetadata([Buffer.from(ipfsUri)])
      .freezeWith(client);

    const mintTxSign = await mintTx.sign(operatorKey);
    const mintSubmit = await mintTxSign.execute(client);
    const mintReceipt = await mintSubmit.getReceipt(client);
    
    if (!mintReceipt.serials || mintReceipt.serials.length === 0) {
      throw new Error('Failed to mint certificate NFT');
    }
    
    const serialNumber = mintReceipt.serials[0];
    console.log(`Minted certificate NFT ${tokenId}/${serialNumber} with IPFS: ${ipfsUri}`);

    return NextResponse.json({
      success: true,
      certificateTokenId: tokenId.toString(),
      certificateNumber,
      serialNumber: serialNumber.toString(),
      ipfsUri,
      metadata
    });

  } catch (error) {
    console.error('Error minting certificate NFT:', error);
    return NextResponse.json(
      { error: 'Failed to mint certificate NFT', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
