import { ReactNode } from 'react';

interface Props {
  icon: ReactNode;
  iconTone?: 'green' | 'violet' | 'amber' | 'sky';
  value: ReactNode;
  label: string;
  delta?: { value: string; positive?: boolean };
}

const ICON_TONES = {
  green:  'bg-brand-500/15 text-brand-300',
  violet: 'bg-violet-500/15 text-violet-300',
  amber:  'bg-amber-500/15 text-amber-300',
  sky:    'bg-sky-500/15 text-sky-300',
};

export function MetricTile({ icon, iconTone = 'green', value, label, delta }: Props) {
  return (
    <div className="group rounded-2xl border border-surface-border bg-gradient-to-br from-white/[.04] to-white/[.01] p-5 transition hover:border-white/20">
      <div className="mb-4 flex items-center justify-between">
        <span
          className={`grid h-9 w-9 place-items-center rounded-xl text-base ${ICON_TONES[iconTone]}`}
        >
          {icon}
        </span>
        {delta && (
          <span
            className={`text-[11px] font-black ${
              delta.positive === false ? 'text-rose-400' : 'text-brand-300'
            }`}
          >
            {delta.value}
          </span>
        )}
      </div>
      <p className="text-[26px] font-black leading-none tracking-tighter text-white">
        {value}
      </p>
      <p className="mt-1.5 text-[11.5px] font-semibold text-ink-400">{label}</p>
    </div>
  );
}
