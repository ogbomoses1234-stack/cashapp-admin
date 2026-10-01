import { useEffect, useState } from 'react';

export type ToastKind = 'success' | 'error' | 'info';
export interface ToastItem {
  id: string;
  kind: ToastKind;
  message: string;
}

const EVT = 'qrcb-admin:toast';

export function emitToast(kind: ToastKind, message: string) {
  window.dispatchEvent(new CustomEvent(EVT, { detail: { kind, message } }));
}

export function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const { kind, message } = (e as CustomEvent).detail as { kind: ToastKind; message: string };
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, kind, message }]);
      setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3800);
    };
    window.addEventListener(EVT, handler);
    return () => window.removeEventListener(EVT, handler);
  }, []);

  return toasts;
}

export const toast = {
  success: (m: string) => emitToast('success', m),
  error: (m: string) => emitToast('error', m),
  info: (m: string) => emitToast('info', m),
};
