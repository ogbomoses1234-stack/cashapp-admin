import { ReactNode } from 'react';

type Tone = 'green' | 'amber' | 'blue' | 'rose' | 'violet' | 'slate';

const TONES: Record<Tone, string> = {
  green:  'bg-brand-500/15 text-brand-300 ring-brand-400/25',
  amber:  'bg-amber-500/15 text-amber-300 ring-amber-400/25',
  blue:   'bg-sky-500/15 text-sky-300 ring-sky-400/25',
  rose:   'bg-rose-500/15 text-rose-300 ring-rose-400/25',
  violet: 'bg-violet-500/15 text-violet-300 ring-violet-400/25',
  slate:  'bg-white/[.06] text-ink-300 ring-white/10',
};

export function Badge({ tone = 'slate', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-2 py-1 text-[10.5px] font-black uppercase tracking-wider ring-1 ring-inset ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}
