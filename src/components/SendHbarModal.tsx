'use client'

import { useState } from 'react'
import { sendHbar, SendHbarInput } from '@/lib/hedera'
import { toast } from 'react-hot-toast'

interface SendHbarModalProps {
  isOpen: boolean
  onClose: () => void
  senderAccountId: string
  senderPrivateKey: string
  currentBalance: number
  onTransactionComplete?: (result: { success: boolean; transactionId?: string }) => void
}

export default function SendHbarModal({
  isOpen,
  onClose,
  senderAccountId,
  senderPrivateKey,
  currentBalance,
  onTransactionComplete
}: SendHbarModalProps) {
  const [receiverAccountId, setReceiverAccountId] = useState('')
  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!receiverAccountId.trim()) {
      toast.error('Please enter a receiver account ID')
      return
    }

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (amountNum > currentBalance) {
      toast.error('Insufficient balance')
      return
    }

    setIsLoading(true)

    try {
      const transferInput: SendHbarInput = {
        senderAccountId,
        senderPrivateKey,
        receiverAccountId: receiverAccountId.trim(),
        amount: amountNum,
        memo: memo.trim() || undefined
      }

      const result = await sendHbar(transferInput)
      
      toast.success(`Successfully sent ${amountNum} HBAR!`)
      
      // Call the completion callback if provided
      if (onTransactionComplete) {
        onTransactionComplete({
          success: true,
          transactionId: result.transactionId
        })
      }

      // Reset form and close modal
      setReceiverAccountId('')
      setAmount('')
      setMemo('')
      onClose()
      
    } catch (error) {
      console.error('Error sending HBAR:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to send HBAR'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setReceiverAccountId('')
      setAmount('')
      setMemo('')
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Send HBAR</h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Receiver Account ID
            </label>
            <input
              type="text"
              value={receiverAccountId}
              onChange={(e) => setReceiverAccountId(e.target.value)}
              placeholder="0.0.123456"
              disabled={isLoading}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Amount (HBAR)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={currentBalance}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                disabled={isLoading}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50"
                required
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                Max: {currentBalance.toFixed(2)}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Memo (Optional)
            </label>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="Add a note..."
              disabled={isLoading}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50"
              maxLength={100}
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Sending...
                </>
              ) : (
                'Send HBAR'
              )}
            </button>
          </div>
        </form>

        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-blue-300 text-sm">
            💡 <strong>Tip:</strong> Make sure the receiver account ID is correct. Transactions cannot be reversed.
          </p>
        </div>
      </div>
    </div>
  )
}
