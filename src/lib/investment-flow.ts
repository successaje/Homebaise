import { Client, PrivateKey, AccountId, TokenId, TransferTransaction, TokenAssociateTransaction, Hbar } from '@hashgraph/sdk';
import { supabase } from './supabase';
import { createClient } from '@supabase/supabase-js';
import { Property } from '@/types/property';
import { CreateInvestmentInput, Investment } from '@/types/investment';
import { getAccountBalance, getHbarUsdPrice, transferHbar } from '@/lib/hedera';
import { 
  logInvestmentEvent, 
  logTokenTransferEvent,
  getHashScanTransactionUrl 
} from '@/lib/hedera-hcs';

export interface InvestmentFlowResult {
  success: boolean;
  investment?: Investment;
  transactionHash?: string;
  paymentTxId?: string;
  error?: string;
}

export interface TreasuryInfo {
  hedera_account_id: string;
  hedera_private_key: string;
  token_id: string;
  token_balance: number;
  status: string;
}

export interface InvestorInfo {
  hedera_account_id?: string;
  hedera_private_key?: string;
}

/**
 * Complete property investment flow with Hedera SDK integration
 */
export class InvestmentFlow {
  private client: Client;
  private db = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
    : supabase;

  constructor() {
    // Initialize Hedera client
    const operatorId = process.env.MY_ACCOUNT_ID || process.env.NEXT_PUBLIC_MY_ACCOUNT_ID;
    const operatorKey = process.env.MY_PRIVATE_KEY || process.env.NEXT_PUBLIC_MY_PRIVATE_KEY;

    if (!operatorId || !operatorKey) {
      throw new Error('Hedera operator credentials not found in environment variables');
    }

    this.client = Client.forTestnet()
      .setOperator(operatorId, operatorKey);
  }

  /**
   * Execute complete investment flow
   */
  async executeInvestment(
    propertyId: string,
    investorId: string,
    investmentAmount: number
  ): Promise<InvestmentFlowResult> {
    try {
      // Step 1: Fetch property and treasury info
      const { property, treasuryInfo } = await this.fetchPropertyAndTreasury(propertyId);
      
      // Step 2: Validate investment
      const validation = this.validateInvestment(property, treasuryInfo, investmentAmount);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Step 3: Calculate tokens (1:1 ratio)
      const tokensToPurchase = investmentAmount;

      // Step 4: Check token availability
      if (tokensToPurchase > treasuryInfo.token_balance) {
        return { 
          success: false, 
          error: `Insufficient tokens available. Requested: ${tokensToPurchase}, Available: ${treasuryInfo.token_balance}` 
        };
      }

      // Step 5: Get investor info
      const investorInfo = await this.fetchInvestorInfo(investorId);

      // Step 6: Payment & Treasury Transfer (HBAR)
      // Convert USD amount to HBAR using live price, then transfer from investor to treasury
      const hbarUsdPrice = await getHbarUsdPrice();
      const hbarNeeded = hbarUsdPrice > 0 ? Math.floor((investmentAmount / hbarUsdPrice) * 100000000) / 100000000 : 0;
      if (hbarNeeded <= 0) {
        return { success: false, error: 'Failed to compute HBAR amount for this investment' };
      }

      // Verify investor has sufficient HBAR balance
      const investorHbarBalance = await getAccountBalance(investorInfo.hedera_account_id!);
      if (investorHbarBalance < hbarNeeded) {
        return { success: false, error: `Insufficient HBAR balance. Required: ${hbarNeeded.toFixed(2)} HBAR, Available: ${investorHbarBalance.toFixed(2)} HBAR` };
      }

      // Perform HBAR transfer from investor to property treasury
      let paymentTransactionId: string | undefined;
      try {
        paymentTransactionId = await transferHbar({
          client: this.client,
          fromAccountId: investorInfo.hedera_account_id!,
          fromPrivateKey: investorInfo.hedera_private_key!,
          toAccountId: treasuryInfo.hedera_account_id,
          hbarAmount: hbarNeeded,
          memo: `Investment payment for property ${propertyId}`
        });
      } catch (paymentError: unknown) {
        return { success: false, error: `HBAR transfer failed: ${paymentError instanceof Error ? paymentError.message : 'Unknown error'}` };
      }

      // Step 7: Create pending investment record
      const investmentData: CreateInvestmentInput = {
        property_id: propertyId,
        amount: investmentAmount,
        tokens_purchased: tokensToPurchase,
        token_price: 1, // 1:1 ratio
        status: 'pending'
      };

    const { data: investment, error: investmentError } = await this.db
        .from('investments')
        .insert({
          ...investmentData,
          investor_id: investorId
        })
        .select(`
          *,
          property:properties(
            id,
            name,
            title,
            token_symbol,
            status
          )
        `)
        .single();

      if (investmentError || !investment) {
        return { 
          success: false, 
          error: `Failed to create investment record: ${investmentError?.message}` 
        };
      }

      // Step 8: Execute Hedera token transfer (ensure association, then transfer tokens)
      let transactionHash: string;
      try {
        transactionHash = await this.transferTokens(
          treasuryInfo.hedera_account_id,
          treasuryInfo.hedera_private_key,
          investorInfo.hedera_account_id!,
          investorInfo.hedera_private_key!,
          treasuryInfo.token_id,
          tokensToPurchase
        );
      } catch (transferError: unknown) {
        // Mark investment as failed
        const errorMessage = transferError instanceof Error ? transferError.message : 'Unknown error';
        await this.updateInvestmentStatus(investment.id, 'failed', errorMessage);
        return { 
          success: false, 
          error: `Token transfer failed: ${errorMessage}` 
        };
      }

      // Step 9: Update investment as completed (store token transfer tx as transaction_hash)
      const { data: updatedInvestment, error: updateError } = await this.db
        .from('investments')
        .update({
          status: 'completed',
          transaction_hash: transactionHash,
          completed_at: new Date().toISOString()
        })
        .eq('id', investment.id)
        .select(`
          *,
          property:properties(
            id,
            name,
            title,
            token_symbol,
            status
          )
        `)
        .single();

      if (updateError) {
        console.error('Failed to update investment status:', updateError);
        // Investment was successful but status update failed - still return success
      }

      // Step 10: Update treasury balance
      await this.updateTreasuryBalance(propertyId, treasuryInfo.token_balance - tokensToPurchase);

      // Step 10.5: Update property financial data
      await this.updatePropertyFinancials(propertyId, investmentAmount, tokensToPurchase);

      // Step 11: Log events to HCS for transparency
      try {
        console.log('🔍 Starting HCS event logging for property:', propertyId);
        
        // Get topic_id from treasury account
        const { data: treasuryData, error: treasuryError } = await this.db
          .from('property_treasury_accounts')
          .select('topic_id, token_id, status')
          .eq('property_id', propertyId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        console.log('📋 Treasury data query result:', { treasuryData, treasuryError });

        if (treasuryError) {
          console.error('❌ Failed to fetch treasury data for HCS logging:', treasuryError);
          // Skip HCS logging if we can't fetch treasury data, but don't fail the investment
        } else if (treasuryData?.topic_id) {
          console.log('✅ Found HCS topic:', treasuryData.topic_id);
          
          // Log investment event to HCS
          console.log('📝 Logging investment event to HCS...');
          const investmentTxId = await logInvestmentEvent(
            propertyId,
            treasuryData.topic_id,
            investorInfo.hedera_account_id!,
            hbarNeeded,
            paymentTransactionId!,
            {
              tokens_purchased: tokensToPurchase,
              usd_amount: investmentAmount,
              token_transfer_tx: transactionHash
            }
          );
          console.log('✅ Investment event logged to HCS:', investmentTxId);

          // Log token transfer event to HCS
          console.log('📝 Logging token transfer event to HCS...');
          const transferTxId = await logTokenTransferEvent(
            propertyId,
            treasuryData.topic_id,
            treasuryInfo.hedera_account_id,
            investorInfo.hedera_account_id!,
            tokensToPurchase,
            transactionHash
          );
          console.log('✅ Token transfer event logged to HCS:', transferTxId);

          console.log('🎉 All investment events successfully logged to HCS');
        } else {
          console.warn('⚠️ No HCS topic found for property, skipping HCS logging');
          console.log('📋 Treasury data:', treasuryData);
        }
      } catch (hcsError) {
        console.error('❌ Failed to log events to HCS:', hcsError);
        console.error('📋 HCS Error details:', {
          propertyId,
          error: hcsError instanceof Error ? hcsError.message : 'Unknown error',
          stack: hcsError instanceof Error ? hcsError.stack : undefined
        });
        // Don't fail the investment if HCS logging fails
      }

      return {
        success: true,
        investment: updatedInvestment || investment,
        transactionHash,
        paymentTxId: paymentTransactionId
      };

    } catch (error: unknown) {
      console.error('Investment flow error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Fetch property and treasury information
   */
  private async fetchPropertyAndTreasury(propertyId: string): Promise<{
    property: Property;
    treasuryInfo: TreasuryInfo;
  }> {
    // Fetch property
    const { data: property, error: propertyError } = await this.db
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single();

    if (propertyError || !property) {
      throw new Error(`Property not found: ${propertyError?.message}`);
    }

    // Fetch treasury info
    const { data: treasury, error: treasuryError } = await this.db
      .from('property_treasury_accounts')
      .select('hedera_account_id, hedera_private_key, token_id, token_balance, status')
      .eq('property_id', propertyId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (treasuryError || !treasury) {
      throw new Error(`Treasury account not found: ${treasuryError?.message || 'no active treasury row'}`);
    }

    if (treasury.status !== 'active') {
      throw new Error('Treasury account is not active');
    }

    return {
      property: property as Property,
      treasuryInfo: treasury as TreasuryInfo
    };
  }

  /**
   * Validate investment parameters
   */
  private validateInvestment(
    property: Property,
    treasuryInfo: TreasuryInfo,
    amount: number
  ): { valid: boolean; error?: string } {
    // Check property status
    if (property.status !== 'active' && property.status !== 'tokenized') {
      return { valid: false, error: 'Property is not available for investment' };
    }

    // Check global minimum investment (hard limit)
    if (amount < 10) {
      return { 
        valid: false, 
        error: 'Minimum investment is $10' 
      };
    }

    // Check property-specific minimum investment
    if (property.min_investment && amount < property.min_investment) {
      return { 
        valid: false, 
        error: `Minimum investment is $${property.min_investment.toLocaleString()}` 
      };
    }

    // Check maximum investment
    if (property.max_investment && amount > property.max_investment) {
      return { 
        valid: false, 
        error: `Maximum investment is $${property.max_investment.toLocaleString()}` 
      };
    }

    // Check treasury status
    if (treasuryInfo.status !== 'active') {
      return { valid: false, error: 'Treasury account is not active' };
    }

    return { valid: true };
  }

  /**
   * Fetch investor information
   */
  private async fetchInvestorInfo(investorId: string): Promise<InvestorInfo> {
    const { data: profile, error } = await this.db
      .from('profiles')
      .select('wallet_address, hedera_private_key, hedera_public_key, hedera_evm_address')
      .eq('id', investorId)
      .single();

    if (error || !profile) {
      throw new Error(`Investor profile not found: ${error?.message}`);
    }

    if (!profile.wallet_address || !profile.hedera_private_key) {
      throw new Error('Investor does not have a Hedera account set up');
    }

    return {
      hedera_account_id: profile.wallet_address,
      hedera_private_key: profile.hedera_private_key
    };
  }

  /**
   * Transfer tokens from treasury to investor using Hedera SDK
   * This method ensures token association before transfer
   */
  private async transferTokens(
    fromAccountId: string,
    fromPrivateKey: string,
    toAccountId: string,
    toPrivateKey: string,
    tokenId: string,
    amount: number
  ): Promise<string> {
    try {
      const token = TokenId.fromString(tokenId);
      const fromAccount = AccountId.fromString(fromAccountId);
      const toAccount = AccountId.fromString(toAccountId);
      const fromKey = PrivateKey.fromString(fromPrivateKey);
      const toKey = PrivateKey.fromString(toPrivateKey);

      console.log(`Starting token transfer: ${amount} tokens from ${fromAccountId} to ${toAccountId}`);
      
      // Step 1: Ensure investor account is associated with the token
      // This is CRITICAL - Hedera requires accounts to be associated with tokens before receiving them
      try {
        console.log(`Ensuring token association for account ${toAccountId} with token ${tokenId}`);
        const associateTx = await new TokenAssociateTransaction()
          .setAccountId(toAccount)
          .setTokenIds([token])
          .freezeWith(this.client)
          .sign(toKey);
        
        const associateResponse = await associateTx.execute(this.client);
        await associateResponse.getReceipt(this.client);
        console.log(`Token association successful for ${toAccountId}`);
      } catch (associateError: unknown) {
        const errorMsg = String(associateError);
        // If token is already associated, that's fine - continue with transfer
        if (!/already associated|TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT/i.test(errorMsg)) {
          console.error('Token association error:', associateError);
          throw new Error(`Failed to associate token with investor account: ${associateError instanceof Error ? associateError.message : 'Unknown error'}`);
        }
        console.log(`Token already associated for ${toAccountId} - continuing with transfer`);
      }

      // Step 2: Create and execute token transfer transaction
      console.log(`Creating token transfer transaction`);
      const transferTx = new TransferTransaction()
        .addTokenTransfer(token, fromAccount, -amount) // From treasury (negative)
        .addTokenTransfer(token, toAccount, amount)    // To investor (positive)
        .setMaxTransactionFee(new Hbar(5));

      // Freeze the transaction with the client before signing
      const frozenTx = await transferTx.freezeWith(this.client);
      
      // Sign with treasury private key (treasury must sign to authorize outgoing transfer)
      const signedTx = await frozenTx.sign(fromKey);
      
      // Execute transaction
      console.log(`Executing token transfer transaction`);
      const response = await signedTx.execute(this.client);
      
      // Get receipt to confirm transaction success
      const receipt = await response.getReceipt(this.client);
      
      const txId = response.transactionId.toString();
      console.log(`Token transfer successful! Transaction ID: ${txId}`);
      
      // Return transaction hash
      return txId;
    } catch (error: unknown) {
      console.error('Token transfer error:', error);
      throw new Error(`Token transfer failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update investment status
   */
  private async updateInvestmentStatus(
    investmentId: string,
    status: 'pending' | 'completed' | 'failed' | 'cancelled',
    errorMessage?: string
  ): Promise<void> {
    const updateData: Record<string, unknown> = { status };
    
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }
    
    if (status === 'failed' && errorMessage) {
      updateData.error_message = errorMessage;
    }

    const { error } = await this.db
      .from('investments')
      .update(updateData)
      .eq('id', investmentId);

    if (error) {
      console.error('Failed to update investment status:', error);
    }
  }

  /**
   * Update treasury balance in database
   */
  private async updateTreasuryBalance(propertyId: string, newBalance: number): Promise<void> {
    const { error } = await this.db
      .from('property_treasury_accounts')
      .update({ 
        token_balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('property_id', propertyId);

    if (error) {
      console.error('Failed to update treasury balance:', error);
      // Don't throw - this is not critical for the investment flow
    }
  }

  /**
   * Update property financial data after successful investment
   * Uses atomic database function to prevent race conditions
   */
  private async updatePropertyFinancials(
    propertyId: string,
    investmentAmount: number,
    tokensPurchased: number
  ): Promise<void> {
    try {
      // Use atomic database function to update funding progress
      // This prevents race conditions when multiple investments complete simultaneously
      const { error: functionError } = await this.db.rpc('update_property_funding_atomic', {
        p_property_id: propertyId,
        p_investment_amount: investmentAmount
      });

      if (functionError) {
        console.error('Failed to update property funding atomically:', functionError);
        
        // Fallback to manual update if function doesn't exist (backwards compatibility)
        const { data: property, error: propertyError } = await this.db
          .from('properties')
          .select('total_value, funded_amount_usd, token_price')
          .eq('id', propertyId)
          .single();

        if (propertyError || !property) {
          console.error('Failed to fetch property data for financial update:', propertyError);
          return;
        }

        const currentFundedAmount = property.funded_amount_usd || 0;
        const newFundedAmount = currentFundedAmount + investmentAmount;
        const totalValue = property.total_value || 1;
        const fundedPercent = (newFundedAmount / totalValue) * 100;

        const { error: updateError } = await this.db
          .from('properties')
          .update({
            funded_amount_usd: newFundedAmount,
            funded_percent: Math.min(fundedPercent, 100),
            token_price: 1.0,
            updated_at: new Date().toISOString()
          })
          .eq('id', propertyId);

        if (updateError) {
          console.error('Failed to update property financials (fallback):', updateError);
          return;
        }
      }

      // Always update token_price to ensure consistency (1:1 ratio)
      await this.db
        .from('properties')
        .update({ token_price: 1.0 })
        .eq('id', propertyId);

      console.log('✅ Property financials updated successfully');
    } catch (error) {
      console.error('Error updating property financials:', error);
    }
  }
}

/**
 * Convenience function to execute investment flow
 */
export async function executePropertyInvestment(
  propertyId: string,
  investorId: string,
  investmentAmount: number
): Promise<InvestmentFlowResult> {
  const flow = new InvestmentFlow();
  return await flow.executeInvestment(propertyId, investorId, investmentAmount);
}
