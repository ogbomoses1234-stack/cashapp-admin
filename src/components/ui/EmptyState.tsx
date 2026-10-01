import { ReactNode } from 'react';

interface Props {
  icon?: ReactNode;
  title: string;
  hint?: string;
  action?: ReactNode;
}

export function EmptyState({ icon = '📭', title, hint, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-border bg-white/[.015] px-6 py-16 text-center">
      <span className="mb-3 text-4xl opacity-60">{icon}</span>
      <h3 className="text-[14.5px] font-bold text-white">{title}</h3>
      {hint && (
        <p className="mt-1.5 max-w-sm text-[12.5px] font-medium text-ink-400">{hint}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
