interface KYCStatusProps {
  status: 'unverified' | 'pending' | 'verified' | null;
  showIcon?: boolean;
  className?: string;
}

export default function KYCStatus({ status, showIcon = true, className = '' }: KYCStatusProps) {
  const statusConfig = {
    verified: {
      label: 'Verified',
      className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      icon: '✓'
    },
    pending: {
      label: 'Pending',
      className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      icon: '⏳'
    },
    unverified: {
      label: 'Unverified',
      className: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
      icon: '⏸️'
    }
  };

  const config = statusConfig[status || 'unverified'];

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm border ${config.className} ${className}`}>
      {showIcon && <span className="mr-1">{config.icon}</span>}
      {config.label}
    </div>
  );
} 