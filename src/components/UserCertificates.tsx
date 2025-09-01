'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Certificate {
  id: string
  property_id: string
  property_name: string
  certificate_hash: string
  nft_token_id: string
  issued_at: string
  status: 'pending' | 'minted' | 'failed'
  ipfs_metadata_url: string
}

interface Property {
  id: string
  name: string
  title?: string
  status: string
  approved_at: string | null
  certificate_id: string | null
}

export default function UserCertificates() {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch user's properties
      const { data: userProperties } = await supabase
        .from('properties')
        .select('id, name, title, status, approved_at, certificate_id')
        .eq('listed_by', user.id)
        .order('created_at', { ascending: false })

      if (userProperties) {
        setProperties(userProperties)
        
        // Fetch certificates for approved properties
        const approvedProperties = userProperties.filter(p => p.status === 'active' && p.certificate_id)
        if (approvedProperties.length > 0) {
          const { data: certData } = await supabase
            .from('property_certificates')
            .select('*')
            .in('property_id', approvedProperties.map(p => p.id))
            .order('issued_at', { ascending: false })

          if (certData) {
            setCertificates(certData)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const viewCertificate = (certificate: Certificate) => {
    // Open certificate in new tab
    if (certificate.ipfs_metadata_url) {
      window.open(certificate.ipfs_metadata_url, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">My Certificates</h2>
        <span className="text-gray-400 text-sm">
          {certificates.length} certificate{certificates.length !== 1 ? 's' : ''}
        </span>
      </div>

      {certificates.length === 0 ? (
        <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
          <div className="text-4xl mb-4">📜</div>
          <h3 className="text-white font-semibold mb-2">No Certificates Yet</h3>
          <p className="text-gray-400 mb-4">
            Certificates are automatically generated when your properties are approved.
          </p>
          <Link 
            href="/list-property" 
            className="inline-flex items-center px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
          >
            List a Property
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((certificate) => (
            <div key={certificate.id} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-emerald-400 text-xl">📜</span>
                </div>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${
                  certificate.status === 'minted' 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : certificate.status === 'pending'
                    ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                }`}>
                  {certificate.status === 'minted' ? '✅ Minted' : 
                   certificate.status === 'pending' ? '⏳ Pending' : '❌ Failed'}
                </span>
              </div>

              <h3 className="text-white font-semibold mb-2">{certificate.property_name}</h3>
              
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Issued:</span>
                  <span className="text-white">
                    {new Date(certificate.issued_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Token ID:</span>
                  <span className="text-emerald-400 font-mono text-xs">
                    {certificate.nft_token_id ? certificate.nft_token_id.slice(0, 8) + '...' : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => viewCertificate(certificate)}
                  className="flex-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 py-2 px-3 rounded-lg text-sm hover:bg-emerald-500/30 transition-colors"
                >
                  View Certificate
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(certificate.certificate_hash)}
                  className="px-3 py-2 border border-white/20 text-white rounded-lg hover:bg-white/10 transition-colors"
                  title="Copy Certificate Hash"
                >
                  📋
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pending Approvals */}
      {properties.filter(p => p.status === 'pending').length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-white mb-4">Pending Approvals</h3>
          <div className="space-y-3">
            {properties.filter(p => p.status === 'pending').map((property) => (
              <div key={property.id} className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-medium">{property.name || property.title}</h4>
                    <p className="text-yellow-400 text-sm">Awaiting admin approval</p>
                  </div>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                    ⏳ Pending
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 