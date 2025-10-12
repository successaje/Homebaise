import { Client, PrivateKey, AccountId, TokenId, TransferTransaction, TokenAssociateTransaction, Hbar } from '@hashgraph/sdk';
import { supabase } from './supabase';
import { Property } from '@/types/property';
import { CreateInvestmentInput, Investment } from '@/types/investment';

export interface InvestmentFlowResult {
  success: boolean;
  investment?: Investment;
  transactionHash?: string;
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

      // Step 6: Create pending investment record
      const investmentData: CreateInvestmentInput = {
        property_id: propertyId,
        amount: investmentAmount,
        tokens_purchased: tokensToPurchase,
        token_price: 1, // 1:1 ratio
        status: 'pending'
      };

      const { data: investment, error: investmentError } = await supabase
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

      // Step 7: Execute Hedera token transfer
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
      } catch (transferError: any) {
        // Mark investment as failed
        await this.updateInvestmentStatus(investment.id, 'failed', transferError.message);
        return { 
          success: false, 
          error: `Token transfer failed: ${transferError.message}` 
        };
      }

      // Step 8: Update investment as completed
      const { data: updatedInvestment, error: updateError } = await supabase
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

      // Step 9: Update treasury balance
      await this.updateTreasuryBalance(propertyId, treasuryInfo.token_balance - tokensToPurchase);

      return {
        success: true,
        investment: updatedInvestment || investment,
        transactionHash
      };

    } catch (error: any) {
      console.error('Investment flow error:', error);
      return { 
        success: false, 
        error: error.message || 'Unknown error occurred' 
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
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single();

    if (propertyError || !property) {
      throw new Error(`Property not found: ${propertyError?.message}`);
    }

    // Fetch treasury info
    const { data: treasury, error: treasuryError } = await supabase
      .from('property_treasury_accounts')
      .select('hedera_account_id, hedera_private_key, token_id, token_balance, status')
      .eq('property_id', propertyId)
      .single();

    if (treasuryError || !treasury) {
      throw new Error(`Treasury account not found: ${treasuryError?.message}`);
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

    // Check minimum investment
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
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('hedera_account_id, hedera_private_key')
      .eq('id', investorId)
      .single();

    if (error || !profile) {
      throw new Error(`Investor profile not found: ${error?.message}`);
    }

    if (!profile.hedera_account_id || !profile.hedera_private_key) {
      throw new Error('Investor does not have a Hedera account set up');
    }

    return {
      hedera_account_id: profile.hedera_account_id,
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
      } catch (associateError: any) {
        const errorMsg = String(associateError);
        // If token is already associated, that's fine - continue with transfer
        if (!/already associated|TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT/i.test(errorMsg)) {
          console.error('Token association error:', associateError);
          throw new Error(`Failed to associate token with investor account: ${associateError.message}`);
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
    } catch (error: any) {
      console.error('Token transfer error:', error);
      throw new Error(`Token transfer failed: ${error.message}`);
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
    const updateData: any = { status };
    
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }
    
    if (status === 'failed' && errorMessage) {
      updateData.error_message = errorMessage;
    }

    const { error } = await supabase
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
    const { error } = await supabase
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
