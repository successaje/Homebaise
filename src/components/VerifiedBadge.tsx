interface VerifiedBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  isVerified?: boolean;
}

export default function VerifiedBadge({ 
  className = '', 
  size = 'md', 
  showText = false,
  isVerified = true 
}: VerifiedBadgeProps) {
  if (!isVerified) return null;

  const sizeClasses = {
    sm: 'w-4 h-4 text-xs',
    md: 'w-5 h-5 text-sm',
    lg: 'w-6 h-6 text-base'
  };

  return (
    <span
      title="KYC Verified"
      className={`inline-flex items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 ${sizeClasses[size]} ${className}`}
      aria-label="KYC verified user"
    >
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
      {showText && (
        <span className="ml-1 text-xs font-medium">Verified</span>
      )}
    </span>
  );
}