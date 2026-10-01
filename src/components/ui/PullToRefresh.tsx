import { Spinner } from './Spinner';

interface Props {
  pulling: boolean;
  distance: number;
  refreshing: boolean;
}

/**
 * Visual indicator that appears while the user pulls down to refresh.
 * Position it at the top of the page.
 */
export function PullToRefresh({ pulling, distance, refreshing }: Props) {
  if (!pulling && !refreshing) return null;

  const progress = Math.min(1, distance / 80);
  const rotation = progress * 360;

  return (
    <div
      className="pointer-events-none fixed left-1/2 z-50 flex -translate-x-1/2 items-center justify-center"
      style={{
        top: refreshing ? 72 : 12 + distance * 0.6,
        transition: refreshing ? 'top 0.25s ease' : 'none',
      }}
    >
      <div className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-[0_8px_20px_-8px_rgba(11,15,20,.35)] ring-1 ring-ink-100">
        {refreshing ? (
          <Spinner size={16} tone="brand" variant="ring" />
        ) : (
          <svg
            viewBox="0 0 24 24"
            width={16}
            height={16}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-brand-600"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            <path d="M21 12a9 9 0 1 1-3-6.7" />
            <path d="M21 3v6h-6" />
          </svg>
        )}
      </div>
    </div>
  );
}
