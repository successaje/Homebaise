'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSupabase } from './SupabaseProvider'

interface UserPropertyRow {
  id: string
  name?: string | null
  title?: string | null
  description?: string | null
  location?: string | null
  country?: string | null
  city?: string | null
  property_type?: string | null
  total_value?: number | null
  funded_amount_usd?: number | null
  funded_percent?: number | null
  yield_rate?: string | null
  status: string
  images?: string[] | null
  created_at: string
  updated_at: string
}

export default function UserProperties() {
  const { supabase, user: sessionUser, loading: authLoading } = useSupabase()
  const [loading, setLoading] = useState(true)
  const [properties, setProperties] = useState<UserPropertyRow[]>([])
  const [sessionUserId, setSessionUserId] = useState<string | null>(null)

  // Debug logging
  useEffect(() => {
    console.log('UserProperties - Auth state:', { 
      sessionUser: sessionUser?.id, 
      authLoading, 
      hasSupabase: !!supabase 
    });
  }, [sessionUser, authLoading, supabase]);

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editProperty, setEditProperty] = useState<UserPropertyRow | null>(null)
  const [editSaving, setEditSaving] = useState(false)

  const [isTokenizeOpen, setIsTokenizeOpen] = useState(false);
  const [tokenizeProperty, setTokenizeProperty] = useState<UserPropertyRow | null>(null);
  const [tokenType, setTokenType] = useState<'FUNGIBLE' | 'NON_FUNGIBLE'>('FUNGIBLE');
  const [tokenSymbol, setTokenSymbol] = useState('HPROP');
  const [tokenDecimals, setTokenDecimals] = useState(18);
  const [tokenName, setTokenName] = useState('');
  const [tokenizing, setTokenizing] = useState(false);
  const [tokenizationProgress, setTokenizationProgress] = useState<string>('');
  const [tokenizationStep, setTokenizationStep] = useState<string>('');
  const [treasuryAccounts, setTreasuryAccounts] = useState<any[]>([]);

  // Fetch treasury accounts for properties
  useEffect(() => {
    const fetchTreasuryAccounts = async () => {
      if (!sessionUserId) return;
      
      try {
        const { data, error } = await supabase
          .from('property_treasury_accounts')
          .select('*')
          .eq('property_id', properties.map(p => p.id));

        if (!error && data) {
          setTreasuryAccounts(data);
        }
      } catch (e) {
        console.error('Error fetching treasury accounts:', e);
      }
    };

    fetchTreasuryAccounts();
  }, [sessionUserId, properties]);

  const getTreasuryAccount = (propertyId: string) => {
    return treasuryAccounts.find(ta => ta.property_id === propertyId);
  };

  const isPropertyTokenized = (propertyId: string) => {
    return treasuryAccounts.some(ta => ta.property_id === propertyId);
  };

  const displayProperties = useMemo(() => {
    return properties.map((p) => ({
      ...p,
      displayName: p.name || p.title || 'Untitled Property',
    }))
  }, [properties])

  useEffect(() => {
    const init = async () => {
      try {
        if (sessionUser?.id) {
          setSessionUserId(sessionUser.id)
          
          const { data, error } = await supabase
            .from('properties')
            .select('*')
            .eq('listed_by', sessionUser.id)
            .order('created_at', { ascending: false })

          if (error) {
            console.error('UserProperties - Error fetching properties:', error)
          } else {
            setProperties(data || [])
          }
        } else {
          setSessionUserId(null)
          setProperties([])
        }
      } catch (e) {
        console.error('UserProperties - Unexpected error:', e)
      } finally {
        setLoading(false)
      }
    }
    
    if (sessionUser !== undefined && !authLoading) { // Only run when sessionUser is loaded and auth is not loading
      init()
    }
  }, [sessionUser?.id, supabase, authLoading])

  const openEdit = (property: UserPropertyRow) => {
    setEditProperty(property)
    setIsEditOpen(true)
  }

  const saveEdit = async () => {
    if (!editProperty) return
    setEditSaving(true)
    try {
      const { id, name, title, description, total_value, yield_rate } = editProperty
      const payload: Partial<UserPropertyRow> = {
        name: name ?? undefined,
        title: title ?? undefined,
        description: description ?? undefined,
        total_value: total_value ?? undefined,
        yield_rate: yield_rate ?? undefined,
      }
      const { error } = await supabase
        .from('properties')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) {
        console.error('UserProperties - Error saving property:', error)
        notify('Failed to save property', 'error')
      } else {
        notify('Property saved', 'success')
        // refresh list
        const updated = properties.map((p) => (p.id === id ? { ...p, ...payload } as UserPropertyRow : p))
        setProperties(updated)
        setIsEditOpen(false)
      }
    } catch (e) {
      console.error('UserProperties - Save error:', e)
      notify('Failed to save property', 'error')
    } finally {
      setEditSaving(false)
    }
  }

  const openTokenize = (property: UserPropertyRow) => {
    setTokenizeProperty(property)
    setIsTokenizeOpen(true)
  }

  const startTokenization = async () => {
    if (!tokenizeProperty) return;
    
    // Pre-check authentication
    if (!sessionUser) {
      notify('Please log in to tokenize properties', 'error');
      return;
    }
    
    setTokenizing(true);
    setTokenizationProgress('Initializing tokenization...');
    setTokenizationStep('preparing');
    
    try {
      // Set token name if not provided
      if (!tokenName) {
        setTokenName(`${tokenizeProperty.name || tokenizeProperty.title || 'Property'} Token`);
      }

      setTokenizationProgress('Creating treasury account on Hedera...');
      setTokenizationStep('treasury');

      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('No active session found:', sessionError?.message || 'No session');
        throw new Error('Authentication required: Please sign in to continue');
      }

      console.log('Current session:', {
        user: session.user?.id,
        expiresAt: session.expires_at,
        token: session.access_token ? 'token-present' : 'no-token'
      });

      const requestBody = {
        propertyId: tokenizeProperty.id,
        tokenType,
        tokenSymbol: tokenSymbol.toUpperCase(),
        tokenDecimals,
        tokenName: tokenName || `${tokenizeProperty.name || tokenizeProperty.title || 'Property'} Token`
      };
      
      console.log('Sending tokenization request:', requestBody);
      
      const response = await fetch('/api/tokenize-property', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        credentials: 'include', // Important for sending cookies
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || 
          `Failed to tokenize property: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();
      console.log('Tokenization successful:', result);

      setTokenizationProgress('Creating tokens on Hedera...');
      setTokenizationStep('tokens');
      
      if (result.success) {
        setTokenizationProgress('Finalizing tokenization...');
        setTokenizationStep('finalizing');
        
        // Small delay to show the final step
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        notify(`Property successfully tokenized as ${tokenType}!`, 'success');
        console.log('Tokenization result:', result);
        
        // Refresh treasury accounts
        setTokenizationProgress('Updating dashboard...');
        setTokenizationStep('updating');
        
        const { data, error } = await supabase
          .from('property_treasury_accounts')
          .select('*')
          .eq('property_id', tokenizeProperty.id);

        if (!error && data) {
          setTreasuryAccounts(prev => [...prev, ...data]);
        }
        
        setTokenizationProgress('Tokenization completed successfully! 🎉');
        setTokenizationStep('completed');
        
        // Wait a moment to show completion message
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setIsTokenizeOpen(false);
        setTokenizationProgress('');
        setTokenizationStep('');
      } else {
        throw new Error(result.error || 'Tokenization failed');
      }
    } catch (error) {
      console.error('Tokenization error:', error);
      setTokenizationProgress(`Tokenization failed: ${error}`);
      setTokenizationStep('error');
      notify(`Failed to tokenize property: ${error}`, 'error');
      
      // Reset progress after error
      setTimeout(() => {
        setTokenizationProgress('');
        setTokenizationStep('');
      }, 5000);
    } finally {
      setTokenizing(false);
    }
  };

  const notify = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const div = document.createElement('div')
    div.textContent = message
    div.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-white transition-opacity duration-300 ${
      type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-red-600' : 'bg-gray-700'
    }`
    document.body.appendChild(div)
    setTimeout(() => {
      div.style.opacity = '0'
      setTimeout(() => document.body.removeChild(div), 300)
    }, 2500)
  }

  // Debug functions
  const testAuth = async () => {
    try {
      const response = await fetch('/api/test-auth');
      const result = await response.json();
      console.log('Auth test result:', result);
      notify(result.success ? 'Auth test successful' : 'Auth test failed', result.success ? 'success' : 'error');
    } catch (error) {
      console.error('Auth test error:', error);
      notify('Auth test failed', 'error');
    }
  };

  const inspectCookies = async () => {
    try {
      const response = await fetch('/api/debug-cookies');
      const result = await response.json();
      console.log('Cookie debug result:', result);
      console.log('Full cookie details:', result.cookieDetails);
      console.log('All cookie names:', result.allCookieNames);
      notify(`Found ${result.totalCookies} cookies, ${result.supabaseCookies} Supabase`, 'info');
    } catch (error) {
      console.error('Cookie debug error:', error);
      notify('Cookie debug failed', 'error');
    }
  };

  const checkDatabaseSchema = async () => {
    try {
      const response = await fetch('/api/check-db-schema');
      const result = await response.json();
      console.log('Database schema check result:', result);
      
      if (result.success) {
        const { schemaStatus } = result;
        let message = 'Database schema check completed:\n';
        message += `• Treasury accounts table: ${schemaStatus.property_treasury_accounts.exists ? '✅' : '❌'}\n`;
        message += `• Properties columns: ${schemaStatus.properties_columns.exists ? '✅' : '❌'}\n`;
        message += `• Certificates table: ${schemaStatus.property_certificates.exists ? '✅' : '❌'}`;
        
        notify(message, 'info');
      } else {
        notify('Database schema check failed', 'error');
      }
    } catch (error) {
      console.error('Database schema check error:', error);
      notify('Database schema check failed', 'error');
    }
  };

  if (loading || authLoading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  if (!sessionUserId) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🔐</div>
          <h3 className="text-white font-semibold mb-2">Authentication Required</h3>
          <p className="text-gray-400">Please log in to view your properties.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">My Properties</h2>
        <Link href="/list-property" className="bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-all">
          List New Property
        </Link>
      </div>

      {displayProperties.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🏠</div>
          <h3 className="text-white font-semibold mb-2">You have no properties yet</h3>
          <p className="text-gray-400">List a property to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayProperties.map((property) => (
            <div key={property.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
              {(property.images && property.images.length > 0) && (
                <div className="mb-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={property.images[0]} 
                    alt={property.displayName}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </div>
              )}
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-white font-semibold text-sm">{property.displayName}</h4>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${
                  property.status === 'active'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : property.status === 'pending' || property.status === 'pending_review'
                    ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                    : property.status === 'rejected' || property.status === 'cancelled'
                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                    : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                }`}>
                  {property.status}
                </span>
              </div>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Location</span>
                  <span className="text-white">{property.location || property.city || 'N/A'}, {property.country || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Type</span>
                  <span className="text-white capitalize">{property.property_type || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Value</span>
                  <span className="text-white">{typeof property.total_value === 'number' ? `$${property.total_value.toLocaleString()}` : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Yield</span>
                  <span className="text-emerald-400">{property.yield_rate || 'N/A'}</span>
                </div>
              </div>
              <div className="flex space-x-2">
                <Link href={`/properties/${property.id}`} className="flex-1 bg-blue-500/20 border border-blue-500/30 text-blue-400 py-1 px-2 rounded text-xs hover:bg-blue-500/30 transition-colors text-center">
                  View
                </Link>
                <button onClick={() => openEdit(property)} className="flex-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 py-1 px-2 rounded text-xs hover:bg-emerald-500/30 transition-colors">
                  Edit
                </button>
                {isPropertyTokenized(property.id) ? (
                  <div className="flex-1 bg-purple-500/20 border border-purple-500/30 text-purple-400 py-1 px-2 rounded text-xs text-center">
                    Tokenized
                  </div>
                ) : (
                  <button onClick={() => openTokenize(property)} className="flex-1 bg-purple-500/20 border border-purple-500/30 text-purple-400 py-1 px-2 rounded text-xs hover:bg-purple-500/30 transition-colors">
                    Tokenize
                  </button>
                )}
              </div>

              {/* Treasury Account Info */}
              {isPropertyTokenized(property.id) && (
                <div className="mt-3 p-2 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-purple-400">Treasury Account:</span>
                    <span className="text-white font-mono">
                      {getTreasuryAccount(property.id)?.hedera_account_id?.slice(0, 8)}...
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-purple-400">Balance:</span>
                    <span className="text-white">
                      {getTreasuryAccount(property.id)?.current_balance_hbar || 0} HBAR
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {isEditOpen && editProperty && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-lg w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-lg">Edit Property</h3>
              <button onClick={() => setIsEditOpen(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Name</label>
                <input
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  value={editProperty.name || ''}
                  onChange={(e) => setEditProperty({ ...editProperty, name: e.target.value })}
                  placeholder="Property name"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Title</label>
                <input
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  value={editProperty.title || ''}
                  onChange={(e) => setEditProperty({ ...editProperty, title: e.target.value })}
                  placeholder="Property title"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Description</label>
                <textarea
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  value={editProperty.description || ''}
                  onChange={(e) => setEditProperty({ ...editProperty, description: e.target.value })}
                  rows={4}
                  placeholder="Description"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Total Value (USD)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    value={editProperty.total_value ?? ''}
                    onChange={(e) => setEditProperty({ ...editProperty, total_value: Number(e.target.value) })}
                    placeholder="e.g. 1000000"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Yield Rate</label>
                  <input
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    value={editProperty.yield_rate || ''}
                    onChange={(e) => setEditProperty({ ...editProperty, yield_rate: e.target.value })}
                    placeholder="e.g. 7.5%"
                  />
                </div>
              </div>
            </div>
            <div className="mt-5 flex space-x-2">
              <button onClick={saveEdit} disabled={editSaving} className="flex-1 bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50">
                {editSaving ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => setIsEditOpen(false)} className="px-4 py-2 border border-white/20 text-white rounded-lg hover:bg-white/10 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tokenize Modal */}
      {isTokenizeOpen && tokenizeProperty && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-lg w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-lg">Tokenize Property</h3>
              <button 
                onClick={() => setIsTokenizeOpen(false)} 
                disabled={tokenizing}
                className="text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {tokenizing ? (
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  '✕'
                )}
              </button>
            </div>
            
            {/* Debug Authentication Button */}
            <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex space-x-2 mb-2">
                <button 
                  onClick={testAuth}
                  className="text-yellow-400 text-xs hover:text-yellow-300 px-2 py-1 border border-yellow-500/30 rounded"
                >
                  🔍 Test Authentication
                </button>
                <button 
                  onClick={inspectCookies}
                  className="text-yellow-400 text-xs hover:text-yellow-300 px-2 py-1 border border-yellow-500/30 rounded"
                >
                  🍪 Inspect Cookies
                </button>
                <button 
                  onClick={checkDatabaseSchema}
                  className="text-yellow-400 text-xs hover:text-yellow-300 px-2 py-1 border border-yellow-500/30 rounded"
                >
                  💾 Check DB Schema
                </button>
              </div>
              <p className="text-yellow-400 text-xs">
                Use these buttons to debug authentication issues
              </p>
            </div>

            <div className="mb-4 p-3 bg-white/5 rounded-lg">
              <p className="text-white text-sm">
                <strong>Property:</strong> {tokenizeProperty.name || tokenizeProperty.title || 'Untitled Property'}
              </p>
              <p className="text-gray-400 text-xs">
                Value: ${tokenizeProperty.total_value?.toLocaleString() || 'N/A'}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Token Name</label>
                <input
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  placeholder="e.g. Green Estate Token"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">Token Type</label>
                <div className="flex items-center space-x-3 text-sm">
                  <label className="inline-flex items-center space-x-2">
                    <input type="radio" className="accent-emerald-500" checked={tokenType==='FUNGIBLE'} onChange={() => setTokenType('FUNGIBLE')} />
                    <span className="text-gray-300">Fungible (HTS)</span>
                  </label>
                  <label className="inline-flex items-center space-x-2">
                    <input type="radio" className="accent-emerald-500" checked={tokenType==='NON_FUNGIBLE'} onChange={() => setTokenType('NON_FUNGIBLE')} />
                    <span className="text-gray-300">NFT Certificate</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Symbol</label>
                  <input
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    value={tokenSymbol}
                    onChange={(e) => setTokenSymbol(e.target.value.toUpperCase())}
                    placeholder="e.g. HPROP"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Decimals</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    value={tokenDecimals}
                    onChange={(e) => setTokenDecimals(Number(e.target.value))}
                    min={0}
                    max={18}
                  />
                </div>
              </div>

              {tokenType === 'FUNGIBLE' && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <p className="text-emerald-400 text-sm">
                    <strong>Token Supply:</strong> {tokenizeProperty.total_value ? 
                      `${(tokenizeProperty.total_value * Math.pow(10, tokenDecimals)).toLocaleString()} tokens` : 
                      'N/A'
                    }
                  </p>
                  <p className="text-emerald-400 text-xs">
                    Based on 1:1 ratio with property value
                  </p>
                </div>
              )}

              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-blue-400 text-xs">
                  <strong>Note:</strong> This will create a treasury account on Hedera with 10 HBAR initial balance. 
                  The account will be dedicated to managing tokens for this property.
                </p>
              </div>
            </div>

            <div className="mt-5 flex space-x-2">
              <button 
                onClick={startTokenization} 
                disabled={tokenizing || !tokenName.trim()} 
                className="flex-1 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
              >
                {tokenizing ? 'Tokenizing...' : 'Start Tokenization'}
              </button>
              <button onClick={() => setIsTokenizeOpen(false)} className="px-4 py-2 border border-white/20 text-white rounded-lg hover:bg-white/10 transition-colors">
                Cancel
              </button>
            </div>

            {/* Progress Indicator */}
            {tokenizing && (
              <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white text-sm font-medium">Tokenization Progress</span>
                  <span className="text-purple-400 text-xs">
                    {tokenizationStep === 'preparing' && 'Step 1/5 • ~2s'}
                    {tokenizationStep === 'treasury' && 'Step 2/5 • ~5s'}
                    {tokenizationStep === 'tokens' && 'Step 3/5 • ~8s'}
                    {tokenizationStep === 'finalizing' && 'Step 4/5 • ~3s'}
                    {tokenizationStep === 'updating' && 'Step 5/5 • ~2s'}
                    {tokenizationStep === 'completed' && 'Complete!'}
                    {tokenizationStep === 'error' && 'Error'}
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-white/10 rounded-full h-2 mb-3">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      tokenizationStep === 'preparing' ? 'w-1/5 bg-blue-500' :
                      tokenizationStep === 'treasury' ? 'w-2/5 bg-blue-500' :
                      tokenizationStep === 'tokens' ? 'w-3/5 bg-blue-500' :
                      tokenizationStep === 'finalizing' ? 'w-4/5 bg-blue-500' :
                      tokenizationStep === 'updating' ? 'w-5/5 bg-blue-500' :
                      tokenizationStep === 'completed' ? 'w-full bg-emerald-500' :
                      tokenizationStep === 'error' ? 'w-full bg-red-500' : 'w-0'
                    }`}
                  ></div>
                </div>
                
                {/* Status Message */}
                <div className="text-center">
                  <p className={`text-sm ${
                    tokenizationStep === 'completed' ? 'text-emerald-400' :
                    tokenizationStep === 'error' ? 'text-red-400' :
                    'text-purple-400'
                  }`}>
                    {tokenizationProgress}
                  </p>
                  
                  {/* Step Details */}
                  {tokenizationStep === 'preparing' && (
                    <div className="flex items-center justify-center space-x-2 mt-1">
                      <span className="text-gray-400 text-xs">Preparing token parameters...</span>
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    </div>
                  )}
                  {tokenizationStep === 'treasury' && (
                    <div className="flex items-center justify-center space-x-2 mt-1">
                      <span className="text-gray-400 text-xs">Creating Hedera treasury account...</span>
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    </div>
                  )}
                  {tokenizationStep === 'tokens' && (
                    <div className="flex items-center justify-center space-x-2 mt-1">
                      <span className="text-gray-400 text-xs">Minting tokens on Hedera...</span>
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    </div>
                  )}
                  {tokenizationStep === 'finalizing' && (
                    <div className="flex items-center justify-center space-x-2 mt-1">
                      <span className="text-gray-400 text-xs">Finalizing blockchain transactions...</span>
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    </div>
                  )}
                  {tokenizationStep === 'updating' && (
                    <div className="flex items-center justify-center space-x-2 mt-1">
                      <span className="text-gray-400 text-xs">Updating dashboard...</span>
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    </div>
                  )}
                  {tokenizationStep === 'completed' && (
                    <div className="flex items-center justify-center space-x-2 mt-1">
                      <span className="text-emerald-400 text-xs">Your property is now tokenized! 🎉</span>
                      <span className="text-emerald-400">✅</span>
                    </div>
                  )}
                  {tokenizationStep === 'error' && (
                    <div className="flex items-center justify-center space-x-2 mt-1">
                      <span className="text-red-400 text-xs">Please try again or contact support</span>
                      <span className="text-red-400">❌</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}