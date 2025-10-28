'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface PropertyApprovalModalProps {
  property: Record<string, unknown>
  isOpen: boolean
  onClose: () => void
  onApproved: () => void
}

export default function PropertyApprovalModal({ property, isOpen, onClose, onApproved }: PropertyApprovalModalProps) {
  const [loading, setLoading] = useState(false)
  const [certificateGenerating, setCertificateGenerating] = useState(false)
  const [approvalNotes, setApprovalNotes] = useState('')

  const handleApprove = async () => {
    if (!property) return
    
    setLoading(true)
    try {
      // 1. Generate certificate NFT first
      setCertificateGenerating(true)
      const certificateResponse = await fetch('/api/mint-certificate-nft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyId: String(property.id),
          propertyName: String(property.title || property.name),
          location: String(property.location),
          valuationUSD: Number(property.total_value || 0),
          tokenSymbol: `HB-${String(property.id).substring(0, 6).toUpperCase()}`,
          approvalNotes
        }),
      })

      if (!certificateResponse.ok) {
        const error = await certificateResponse.text()
        console.error('Error generating certificate NFT:', error)
        throw new Error(`Failed to generate certificate NFT: ${error}`)
      }

      const { certificateTokenId, certificateNumber } = await certificateResponse.json()
      console.log('Certificate NFT minted:', { certificateTokenId, certificateNumber })

      // 2. Update property status to approved with certificate info
      const { error: propertyError } = await supabase
        .from('properties')
        .update({
          status: 'active',
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          certificate_token_id: certificateTokenId,
          certificate_number: certificateNumber,
          certificate_issued_at: new Date().toISOString()
        })
        .eq('id', String(property.id))

      if (propertyError) {
        console.error('Error updating property with certificate:', propertyError)
        throw propertyError
      }

      onApproved()
      onClose()
    } catch (error) {
      console.error('Error in approval process:', error)
    } finally {
      setLoading(false)
      setCertificateGenerating(false)
    }
  }

  const handleReject = async () => {
    if (!property) return
    
    const reason = prompt('Enter rejection reason:')
    if (!reason) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('properties')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', String(property.id))

      if (error) {
        console.error('Error rejecting property:', error)
      } else {
        onApproved()
        onClose()
      }
    } catch (error) {
      console.error('Error rejecting property:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Property Approval</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Property Details */}
        <div className="space-y-4 mb-6">
          <div className="bg-white/5 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-3">{String(property.name || property.title)}</h3>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Location:</span>
                <span className="text-white ml-2">{String(property.location || property.city)}, {String(property.country)}</span>
              </div>
              <div>
                <span className="text-gray-400">Type:</span>
                <span className="text-white ml-2 capitalize">{String(property.property_type)}</span>
              </div>
              <div>
                <span className="text-gray-400">Value:</span>
                <span className="text-white ml-2">${Number(property.total_value || 0).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-400">Yield Rate:</span>
                <span className="text-emerald-400 ml-2">{String(property.yield_rate)}</span>
              </div>
            </div>

            {(() => {
              const description = String(property.description || '');
              return description.trim() ? (
                <div className="mt-3">
                  <span className="text-gray-400 text-sm">Description:</span>
                  <p className="text-white text-sm mt-1">{description}</p>
                </div>
              ) : null;
            })()}
          </div>

          {/* Property Images */}
          {(() => {
            const images = property.images as string[] | undefined;
            return images && Array.isArray(images) && images.length > 0 ? (
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="text-white font-medium mb-3">Property Images</h4>
                <div className="grid grid-cols-3 gap-2">
                  {images.slice(0, 6).map((image: string, index: number) => (
                    <img
                      key={index}
                      src={image}
                      alt={`Property ${index + 1}`}
                      className="w-full h-20 object-cover rounded-lg"
                    />
                  ))}
                </div>
              </div>
            ) : null;
          })()}
        </div>

        {/* Approval Notes */}
        <div className="mb-6">
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Approval Notes (Optional)
          </label>
          <textarea
            value={approvalNotes}
            onChange={(e) => setApprovalNotes(e.target.value)}
            placeholder="Add any notes about the approval..."
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={handleApprove}
            disabled={loading}
            className="flex-1 bg-emerald-500 text-white py-2 px-4 rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                {certificateGenerating ? 'Generating Certificate...' : 'Approving...'}
              </span>
            ) : (
              'Approve & Generate Certificate'
            )}
          </button>
          
          <button
            onClick={handleReject}
            disabled={loading}
            className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Rejecting...' : 'Reject'}
          </button>
          
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-white/20 text-white rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>

        {/* Certificate Info */}
        <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-emerald-400">📜</span>
            <span className="text-emerald-400 text-sm">
              Upon approval, a digital certificate (NFT) will be generated and issued to the property owner.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
} 