import { useToasts } from '@/hooks/useToast';

const STYLES = {
  success: 'border-brand-400/30 bg-brand-500/10 text-brand-200',
  error: 'border-rose-400/30 bg-rose-500/10 text-rose-200',
  info: 'border-sky-400/30 bg-sky-500/10 text-sky-200',
};

const ICONS = { success: '✓', error: '✕', info: 'ℹ' };

export function ToastHost() {
  const toasts = useToasts();
  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[200] flex flex-col items-end gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`animate-fade-up flex max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-[13px] font-bold shadow-elevated backdrop-blur ${STYLES[t.kind]}`}
        >
          <span className="text-base leading-none">{ICONS[t.kind]}</span>
          <span className="text-white">{t.message}</span>
        </div>
      ))}
    </div>
  );
}
