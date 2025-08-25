'use client';

import { useCallback, useEffect, useState } from 'react';

interface WalletConnectProps {
  onConnected?: (accountId: string) => void;
  onVerified?: (accountId: string, signatureHex: string) => void;
}

declare global {
  interface Window {
    hashpack?: {
      connect: () => Promise<{ accountId: string }>;
      disconnect: () => Promise<void>;
      signMessage: (message: string) => Promise<{ signature: string }>;
      isConnected: () => boolean;
      getAccountId: () => string | null;
    };
  }
}

export default function WalletConnect({
  onConnected,
  onVerified,
}: WalletConnectProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('disconnected');
  const [accountId, setAccountId] = useState<string>('');
  const [hashpackAvailable, setHashpackAvailable] = useState(false);

  useEffect(() => {
    // Check if HashPack is available
    const checkHashpack = () => {
      const available = typeof window !== 'undefined' && !!window.hashpack;
      setHashpackAvailable(available);
      
      if (available && window.hashpack?.isConnected()) {
        const account = window.hashpack.getAccountId();
        if (account) {
          setAccountId(account);
          setStatus('connected');
          onConnected?.(account);
        }
      }
    };

    checkHashpack();
    
    // Listen for HashPack events
    const handleHashpackEvent = (event: MessageEvent) => {
      if (event.data?.type === 'hashpack-connection-changed') {
        checkHashpack();
      }
    };

    window.addEventListener('message', handleHashpackEvent);
    return () => window.removeEventListener('message', handleHashpackEvent);
  }, [onConnected]);

  const connectWallet = useCallback(async () => {
    if (!window.hashpack) {
      alert('HashPack wallet not found. Please install HashPack from https://hashpack.app/');
      return;
    }

    setLoading(true);
    try {
      const result = await window.hashpack.connect();
      setAccountId(result.accountId);
      setStatus('connected');
      onConnected?.(result.accountId);
    } catch (error) {
      console.error('Failed to connect to HashPack:', error);
      alert('Failed to connect to HashPack wallet');
    } finally {
      setLoading(false);
    }
  }, [onConnected]);

  const disconnect = useCallback(async () => {
    if (!window.hashpack) return;

    try {
      await window.hashpack.disconnect();
      setAccountId('');
      setStatus('disconnected');
    } catch (error) {
      console.error('Failed to disconnect from HashPack:', error);
    }
  }, []);

  const verifySignature = useCallback(async () => {
    if (!window.hashpack || !accountId) return;

    setLoading(true);
    try {
      const challenge = `Homebaise verify ${accountId} ${Date.now()}`;
      const result = await window.hashpack.signMessage(challenge);
      
      // Convert signature to hex if needed
      const signatureHex = result.signature;
      
      onVerified?.(accountId, signatureHex);
      setStatus('verified');
    } catch (error) {
      console.error('Signature verification failed:', error);
      setStatus('connected');
    } finally {
      setLoading(false);
    }
  }, [accountId, onVerified]);

  if (!hashpackAvailable) {
    return (
      <div className="flex flex-col gap-3">
        <div className="text-yellow-400 text-sm">
          HashPack wallet not detected
        </div>
        <a 
          href="https://hashpack.app/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="border border-white/20 bg-white/5 text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-all text-center"
        >
          Install HashPack
        </a>
      </div>
    );
  }

  if (!accountId) {
    return (
      <div className="flex flex-col gap-3">
        <button 
          onClick={connectWallet} 
          disabled={loading}
          className="border border-white/20 bg-white/5 text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-all disabled:opacity-50"
        >
          {loading ? 'Connecting...' : 'Connect HashPack'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-300">{accountId}</span>
      <button 
        onClick={verifySignature} 
        disabled={loading || status === 'verified'}
        className="border border-emerald-500/30 text-emerald-400 px-3 py-2 rounded-lg hover:bg-emerald-500/10 transition-all disabled:opacity-50"
      >
        {status === 'verified' ? 'Verified' : loading ? 'Verifying...' : 'Verify ownership'}
      </button>
      <button 
        onClick={disconnect}
        className="border border-white/20 text-gray-300 px-3 py-2 rounded-lg hover:bg-white/10 transition-all"
      >
        Disconnect
      </button>
    </div>
  );
}