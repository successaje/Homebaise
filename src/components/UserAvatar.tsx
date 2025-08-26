import VerifiedBadge from './VerifiedBadge';

interface UserAvatarProps {
  avatarUrl?: string | null;
  fullName?: string | null;
  email?: string | null;
  kycStatus?: 'unverified' | 'pending' | 'verified' | null;
  size?: 'sm' | 'md' | 'lg';
  showVerifiedBadge?: boolean;
  className?: string;
}

export default function UserAvatar({
  avatarUrl,
  fullName,
  email,
  kycStatus,
  size = 'md',
  showVerifiedBadge = true,
  className = ''
}: UserAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-lg',
    lg: 'w-16 h-16 text-2xl'
  };

  const badgeSizes = {
    sm: 'sm' as const,
    md: 'md' as const,
    lg: 'lg' as const
  };

  const displayName = fullName || email?.split('@')[0] || 'User';

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className={`${sizeClasses[size]} rounded-xl bg-white/10 flex items-center justify-center`}>
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={avatarUrl} 
            alt={displayName} 
            className={`${sizeClasses[size]} rounded-xl object-cover`} 
          />
        ) : (
          <span>👤</span>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <span className="text-white font-medium">{displayName}</span>
        {showVerifiedBadge && kycStatus === 'verified' && (
          <VerifiedBadge size={badgeSizes[size]} />
        )}
      </div>
    </div>
  );
} 