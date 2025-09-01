interface PropertyStatusBadgeProps {
  status: string
  isVerified?: boolean
  hasCertificate?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function PropertyStatusBadge({ 
  status, 
  isVerified = false, 
  hasCertificate = false, 
  size = 'md' 
}: PropertyStatusBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'draft':
        return {
          color: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
          icon: '📝',
          label: 'Draft'
        }
      case 'pending':
        return {
          color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
          icon: '⏳',
          label: 'Pending Review'
        }
      case 'active':
      case 'approved':
        return {
          color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          icon: '✅',
          label: 'Active'
        }
      case 'funded':
        return {
          color: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
          icon: '💰',
          label: 'Funded'
        }
      case 'completed':
        return {
          color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          icon: '🏆',
          label: 'Completed'
        }
      case 'rejected':
      case 'cancelled':
        return {
          color: 'bg-red-500/10 text-red-400 border-red-500/20',
          icon: '❌',
          label: 'Rejected'
        }
      default:
        return {
          color: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
          icon: '❓',
          label: status
        }
    }
  }

  const statusConfig = getStatusConfig(status)

  return (
    <div className="flex items-center space-x-2">
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${statusConfig.color} ${sizeClasses[size]}`}>
        <span className="mr-1">{statusConfig.icon}</span>
        {statusConfig.label}
      </span>
      
      {isVerified && (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span className="mr-1">🔒</span>
          Verified
        </span>
      )}
      
      {hasCertificate && (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20">
          <span className="mr-1">📜</span>
          Certified
        </span>
      )}
    </div>
  )
} 