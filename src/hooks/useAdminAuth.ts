import { useEffect } from 'react';
import { useAdminAuthStore } from '@/store/adminAuthStore';
import { getMe } from '@/services/auth.service';
import { setUnauthorizedHandler } from '@/services/api';

export function useAdminAuthBootstrap() {
  const setAdmin = useAdminAuthStore((s) => s.setAdmin);
  const setHydrated = useAdminAuthStore((s) => s.setHydrated);
  const clear = useAdminAuthStore((s) => s.clear);

  useEffect(() => {
    setUnauthorizedHandler(() => clear());
    let cancelled = false;
    (async () => {
      try {
        const me = await getMe();
        if (!cancelled) setAdmin(me);
      } catch {
        if (!cancelled) setAdmin(null);
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setAdmin, setHydrated, clear]);
}

export function useAdminAuth() {
  return useAdminAuthStore();
}
