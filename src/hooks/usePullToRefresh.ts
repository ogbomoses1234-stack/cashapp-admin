import { useEffect, useRef, useState } from 'react';

interface Options {
  /** Async function that fetches fresh data */
  onRefresh: () => Promise<unknown> | unknown;
  /** Minimum pull distance (px) before triggering */
  threshold?: number;
  /** Only enable on touch devices / narrow viewports */
  enabled?: boolean;
}

/**
 * Adds a pull-to-refresh gesture to the window.
 * Only triggers when the user is at the top of the page and pulls down.
 * Returns { pulling, distance, refreshing }.
 */
export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  enabled = true,
}: Options) {
  const [distance, setDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const active = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === 'undefined') return;
    if (!('ontouchstart' in window)) return; // touch only

    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY > 0 || refreshing) return;
      startY.current = e.touches[0].clientY;
      active.current = true;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!active.current || startY.current == null) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy > 0) {
        // Smooth resistance curve
        setDistance(Math.min(120, dy * 0.55));
      }
    };

    const onTouchEnd = async () => {
      if (!active.current) return;
      active.current = false;
      const d = distance;
      startY.current = null;
      setDistance(0);

      if (d >= threshold) {
        setRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setTimeout(() => setRefreshing(false), 400);
        }
      }
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [enabled, onRefresh, threshold, refreshing, distance]);

  return { pulling: distance > 0, distance, refreshing };
}
