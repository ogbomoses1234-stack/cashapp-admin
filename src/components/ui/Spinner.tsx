type SpinnerVariant = 'ring' | 'dots' | 'pulse';
type SpinnerTone = 'light' | 'dark' | 'brand';

interface SpinnerProps {
  size?: number;
  variant?: SpinnerVariant;
  tone?: SpinnerTone;
  className?: string;
}

const TONES: Record<SpinnerTone, { ring: string; ringTrack: string; dot: string }> = {
  light: { ring: 'border-white', ringTrack: 'border-white/25', dot: 'bg-white' },
  dark: { ring: 'border-ink-700', ringTrack: 'border-ink-200', dot: 'bg-ink-700' },
  brand: { ring: 'border-brand-500', ringTrack: 'border-brand-200', dot: 'bg-brand-500' },
};

export function Spinner({
  size = 20,
  variant = 'ring',
  tone = 'light',
  className = '',
}: SpinnerProps) {
  const t = TONES[tone];

  /* ─── Ring variant ─────────────────────────────────── */
  if (variant === 'ring') {
    return (
      <span
        className={`inline-block animate-spin-slow rounded-full border-2 ${t.ringTrack} ${t.ring} ${className}`}
        style={{
          width: size,
          height: size,
          borderTopColor: 'transparent',
          borderRightColor: 'transparent',
          transform: 'rotate(45deg)',
        }}
        role="status"
        aria-label="Loading"
      />
    );
  }

  /* ─── Dots variant ─────────────────────────────────── */
  if (variant === 'dots') {
    return (
      <span
        className={`bounce-dots ${className}`}
        style={{ color: 'currentColor' }}
        role="status"
        aria-label="Loading"
      >
        <span className={t.dot} />
        <span className={t.dot} />
        <span className={t.dot} />
      </span>
    );
  }

  /* ─── Pulse variant ────────────────────────────────── */
  return (
    <span
      className={`relative inline-block ${className}`}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    >
      <span
        className={`absolute inset-0 rounded-full ${t.dot} animate-pulse-soft`}
      />
      <span
        className={`absolute inset-0 rounded-full ${t.dot} opacity-50 animate-ping`}
      />
    </span>
  );
}
