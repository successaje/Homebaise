'use client';

import { useCallback, useEffect, useState } from 'react';

interface WalletConnectProps {
  onConnected?: (accountId: string) => void;
  onVerified?: (accountId: string, signatureHex: string) => void;
}

interface SaveData {
  topic: string;
  pairingString: string;
  privateKey: string;
  pairedWalletData: Record<string, unknown> | null;
  pairedAccounts: string[];
}

export default function WalletConnect({
  onConnected,
  onVerified,
}: WalletConnectProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('disconnected');
  const [accountId, setAccountId] = useState<string>('');
  const [pairingString, setPairingString] = useState<string>('');
  const [showQR, setShowQR] = useState(false);
  const [hashconnect, setHashconnect] = useState<unknown>(null);
  const [saveData, setSaveData] = useState<SaveData>({
    topic: '',
    pairingString: '',
    privateKey: '',
    pairedWalletData: null,
    pairedAccounts: [],
  });

  useEffect(() => {
    const initHashConnect = async () => {
      try {
        // Dynamically import HashConnect to avoid SSR issues
        const { HashConnect } = await import('hashconnect').catch(() => {
          throw new Error('HashConnect package not available');
        });
        
        console.log('=======================================');
        console.log('- Connecting wallet...');

        const appMetadata = {
          name: "Homebaise",
          description: "Tokenized real estate on Hedera",
          icon: "/favicon.ico",
        };

        const hc = new HashConnect();
        setHashconnect(hc);

        // Debug: Log available properties
        console.log('HashConnect instance properties:', {
          hasPairingEvent: !!hc.pairingEvent,
          hasConnectionStatusChange: !!hc.connectionStatusChange,
          availableProps: Object.getOwnPropertyNames(hc).filter(prop => 
            typeof hc[prop as keyof typeof hc] !== 'function'
          ),
        });

        // Try to restore saved session first
        const savedData = localStorage.getItem("hashconnectData");
        let initData: Record<string, unknown> = {};
        let state: unknown = null;
        let useFreshSession = false;

        // Check if we've had encryption errors recently
        const lastEncryptionError = localStorage.getItem("lastEncryptionError");
        const now = Date.now();
        if (lastEncryptionError && (now - parseInt(lastEncryptionError)) < 300000) { // 5 minutes
          console.log('Recent encryption error detected, starting fresh session');
          localStorage.removeItem("hashconnectData");
          useFreshSession = true;
        }

        if (savedData && !useFreshSession) {
          try {
            console.log('Attempting to restore saved session...');
            const parsedData = JSON.parse(savedData);
            
            // Try to restore with saved encryption key
            if (parsedData.encryptionKey) {
              initData = await hc.init(appMetadata, parsedData.encryptionKey) as unknown as Record<string, unknown>;
              console.log('Restored encryption key');
            } else {
              initData = await hc.init(appMetadata) as unknown as Record<string, unknown>;
            }
            
            // Try to restore connection if we have a topic
            if (parsedData.topic) {
              try {
                state = await hc.connect(parsedData.topic);
                console.log('Restored topic:', parsedData.topic);
              } catch (connectError) {
                console.log('Failed to restore connection, creating new one:', connectError);
                state = await hc.connect();
              }
            } else {
              state = await hc.connect();
            }
            
            // Check if we have paired accounts from saved data
            if (parsedData.pairingData && parsedData.pairingData.accountIds) {
              const account = parsedData.pairingData.accountIds[0];
              if (account) {
                setAccountId(account);
                setStatus('connected');
                onConnected?.(account);
                console.log('Restored connected account:', account);
              }
            }
          } catch (restoreError) {
            console.log('Failed to restore session, starting fresh:', restoreError);
            // Clear corrupted data and start fresh
            localStorage.removeItem("hashconnectData");
            localStorage.setItem("lastEncryptionError", now.toString());
            useFreshSession = true;
          }
        }
        
        if (!savedData || useFreshSession) {
          // No saved data or restoration failed, start fresh
          console.log('Starting fresh session...');
          initData = await hc.init(appMetadata) as unknown as Record<string, unknown>;
          state = await hc.connect();
        }

        const newSaveData = {
          ...saveData,
          privateKey: (initData as Record<string, unknown>)?.privKey as string || '',
        };
        setSaveData(newSaveData);
        console.log(`- Private key for pairing: ${newSaveData.privateKey}`);

        const updatedSaveData = {
          ...newSaveData,
          topic: (state as Record<string, unknown>)?.topic as string || '',
        };
        setSaveData(updatedSaveData);
        console.log(`- Pairing topic is: ${updatedSaveData.topic}`);

        // Generate a pairing string
        const pairingString = hc.generatePairingString(state as unknown as { topic: string; expires: number }, "testnet", false);
        const finalSaveData = {
          ...updatedSaveData,
          pairingString,
        };
        setSaveData(finalSaveData);
        setPairingString(pairingString);

        // Save session data for restoration
        const sessionData = {
          encryptionKey: (initData as Record<string, unknown>)?.privKey as string || '',
          topic: (state as Record<string, unknown>)?.topic as string || '',
          pairingData: null, // Will be updated when paired
        };
        localStorage.setItem("hashconnectData", JSON.stringify(sessionData));

        // Find any supported local wallets
        hc.findLocalWallets();

        // Listen for pairing events
        if (hc.pairingEvent) {
          hc.pairingEvent.on((pairingData: unknown) => {
            const pairing = pairingData as Record<string, unknown>;
            console.log('Paired with wallet:', pairing);
            const finalData = {
              ...finalSaveData,
              pairedWalletData: pairing,
              pairedAccounts: (pairing.accountIds as string[]) || [],
            };
            setSaveData(finalData);
            
            // Update saved session with pairing data
            const updatedSessionData = {
              ...sessionData,
              pairingData: pairing,
            };
            localStorage.setItem("hashconnectData", JSON.stringify(updatedSessionData));
            
            const account = ((pairing.accountIds as string[]) || [])[0] || '';
            setAccountId(account);
            setStatus('connected');
            onConnected?.(account);
          });
        }

        // Listen for connection status (if available)
        if (hc.connectionStatusChange) {
          hc.connectionStatusChange.on((connectionStatus: unknown) => {
            const status = connectionStatus as string;
            console.log('Connection status:', status);
            if (status === 'Disconnected') {
              setStatus('disconnected');
              setAccountId('');
              // Clear saved session on disconnect
              localStorage.removeItem("hashconnectData");
            }
          });
        }

        setStatus('ready');
        console.log('HashConnect initialized successfully');
      } catch (error) {
        console.error('HashConnect initialization failed:', error);
        
        // Check if it's an encryption error
        if (error instanceof Error && error.message.includes('encryption')) {
          console.log('Encryption error detected - clearing corrupted session and trying again');
          localStorage.removeItem("hashconnectData");
          setStatus('encryption_error');
        } else {
          setStatus('error');
        }
      }
    };

    // Override console.error to suppress encryption errors
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const message = args.join(' ');
      if (message.includes('encryption') || message.includes('decryption') || message.includes('Invalid encrypted text')) {
        console.log('Suppressed encryption error:', message);
        return;
      }
      originalConsoleError.apply(console, args);
    };

    // Add global error handler for uncaught promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errorMessage = event.reason?.message || '';
      if (errorMessage.includes('encryption') || errorMessage.includes('decryption') || errorMessage.includes('Invalid encrypted text')) {
        console.log('Suppressed encryption error from promise rejection:', errorMessage);
        // Clear corrupted session data
        localStorage.removeItem("hashconnectData");
        localStorage.setItem("lastEncryptionError", Date.now().toString());
        setShowQR(true);
        setLoading(false);
        event.preventDefault();
        return false;
      }
    };

    // Also handle regular errors
    const handleError = (event: ErrorEvent) => {
      const errorMessage = event.error?.message || event.message || '';
      if (errorMessage.includes('encryption') || errorMessage.includes('decryption') || errorMessage.includes('Invalid encrypted text')) {
        console.log('Suppressed encryption error from error event:', errorMessage);
        // Clear corrupted session data
        localStorage.removeItem("hashconnectData");
        localStorage.setItem("lastEncryptionError", Date.now().toString());
        setShowQR(true);
        setLoading(false);
        event.preventDefault();
        return false;
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    initHashConnect();
    
    return () => {
      // Restore original console.error
      console.error = originalConsoleError;
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, [onConnected]);

  const connectToLocalWallet = useCallback(async () => {
    if (!hashconnect || !saveData.pairingString) return;
    
    setLoading(true);
    try {
      console.log('Connecting to local wallet...');
      const hc = hashconnect as unknown as { connectToLocalWallet: (pairingString: string) => Promise<void> };
      await hc.connectToLocalWallet(saveData.pairingString);
    } catch (error) {
      console.error('Failed to connect to local wallet:', error);
      
      // Check if it's an encryption error
      if (error instanceof Error && (error.message.includes('encryption') || error.message.includes('decryption'))) {
        console.log('Encryption error detected - switching to manual connection mode');
        
        // Instead of retrying, just show the manual connection option
        setShowQR(true);
        alert('Automatic connection failed due to encryption issues. Please use the QR code below to connect manually with HashPack mobile app.');
      } else {
        alert('Failed to connect to HashPack wallet. Please make sure HashPack is installed and unlocked.');
      }
    } finally {
      setLoading(false);
    }
  }, [hashconnect, saveData.pairingString]);

  const disconnect = useCallback(async () => {
    if (!hashconnect || !saveData.topic) return;
    
    try {
      const hc = hashconnect as unknown as { disconnect: (topic: string) => Promise<void> };
      await hc.disconnect(saveData.topic);
      setStatus('disconnected');
      setAccountId('');
      setSaveData(prev => ({
        ...prev,
        pairedWalletData: null,
        pairedAccounts: [],
      }));
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  }, [hashconnect, saveData.topic]);

  const verifySignature = useCallback(async () => {
    if (!hashconnect || !saveData.pairedWalletData || !accountId) return;
    
    setLoading(true);
    try {
      const challenge = `Homebaise verify ${accountId} ${Date.now()}`;
      const messageBytes = new TextEncoder().encode(challenge);
      
      // Get the signer for the connected account
      const hc = hashconnect as unknown as {
        getProvider: (network: string, topic: string, accountId: string) => unknown;
        getSigner: (provider: unknown) => { sign: (message: Uint8Array) => Promise<Uint8Array> };
      };
      const provider = hc.getProvider("testnet", saveData.topic, accountId);
      const signer = hc.getSigner(provider);
      
      // Sign the message
      const signature = await signer.sign(messageBytes);
      const signatureHex = Array.from(signature).map((b: unknown) => (b as number).toString(16).padStart(2, '0')).join('');
      
      onVerified?.(accountId, signatureHex);
      setStatus('verified');
    } catch (error) {
      console.error('Signature verification failed:', error);
      setStatus('connected');
    } finally {
      setLoading(false);
    }
  }, [accountId, hashconnect, saveData, onVerified]);

  if (status === 'error') {
    return (
      <div className="flex flex-col gap-3">
        <div className="text-red-400 text-sm">
          HashConnect package not available
        </div>
        <div className="text-gray-400 text-xs">
          Please install HashConnect: npm install hashconnect
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

  if (status === 'encryption_error') {
    return (
      <div className="flex flex-col gap-3">
        <div className="text-yellow-400 text-sm">
          HashConnect encryption error
        </div>
        <div className="text-gray-400 text-xs">
          This may be due to a version mismatch or browser compatibility issue
        </div>
        <div className="text-gray-400 text-xs">
          Try refreshing the page or clearing browser cache
        </div>
        <button 
          onClick={() => {
            localStorage.removeItem("hashconnectData");
            window.location.reload();
          }}
          className="border border-white/20 bg-white/5 text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-all"
        >
          Clear Session & Refresh
        </button>
        <button 
          onClick={() => window.location.reload()}
          className="border border-white/20 bg-white/5 text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-all"
        >
          Refresh Page
        </button>
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
          onClick={connectToLocalWallet} 
          disabled={loading || status !== 'ready'}
          className="border border-white/20 bg-white/5 text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-all disabled:opacity-50"
        >
          {loading ? 'Connecting...' : 'Connect HashPack'}
        </button>
        
        {pairingString && (
          <div className="space-y-2">
            <button 
              onClick={() => setShowQR(!showQR)}
              className="text-sm text-gray-400 hover:text-white"
            >
              {showQR ? 'Hide QR Code' : 'Show QR Code for Manual Connection'}
            </button>
            
            {showQR && (
              <div className="bg-white p-4 rounded-lg">
                <p className="text-xs text-black mb-2 font-semibold">📱 Connect with HashPack Mobile App</p>
                <p className="text-xs text-black break-all bg-gray-100 p-2 rounded">{pairingString}</p>
                <div className="text-xs text-gray-600 mt-2 space-y-1">
                  <p>1. Open HashPack mobile app</p>
                  <p>2. Tap &quot;Connect Wallet&quot; or scan QR code</p>
                  <p>3. Enter the pairing string above</p>
                  <p>4. Approve the connection</p>
                </div>
                <div className="text-xs text-emerald-600 mt-2 font-medium">
                  ✅ Manual connection bypasses encryption issues
                </div>
              </div>
            )}
          </div>
        )}
        
        {status === 'ready' && !showQR && (
          <div className="text-xs text-gray-400">
            HashConnect ready - click &quot;Connect HashPack&quot; to pair with your wallet
          </div>
        )}
        
        {showQR && (
          <div className="text-xs text-emerald-400">
            🔄 Using manual connection mode - scan QR code with HashPack mobile app
          </div>
        )}
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