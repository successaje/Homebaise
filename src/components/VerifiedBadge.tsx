export default function VerifiedBadge({ className = '' }: { className?: string }) {
  return (
    <span
      title="Verified"
      className={`inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 ${className}`}
      aria-label="verified"
    >
      ✓
    </span>
  );
}