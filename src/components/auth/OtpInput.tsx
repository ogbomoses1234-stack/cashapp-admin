import { useEffect, useRef, useState } from 'react';

interface Props {
  length?: number;
  onComplete: (code: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function OtpInput({ length = 6, onComplete, disabled, autoFocus = true }: Props) {
  const [values, setValues] = useState<string[]>(Array(length).fill(''));
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  const handleChange = (i: number, v: string) => {
    const clean = v.replace(/\D/g, '').slice(0, 1);
    const next = [...values];
    next[i] = clean;
    setValues(next);
    if (clean && i < length - 1) refs.current[i + 1]?.focus();
    if (next.every((x) => x.length === 1)) onComplete(next.join(''));
  };

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !values[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;
    const next = Array(length).fill('');
    pasted.split('').forEach((c, i) => (next[i] = c));
    setValues(next);
    if (pasted.length === length) onComplete(pasted);
    e.preventDefault();
  };

  return (
    <div className="flex justify-center gap-2.5" onPaste={handlePaste}>
      {values.map((v, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={v}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          className="h-14 w-12 rounded-xl border border-white/15 bg-white/[.04] text-center text-2xl font-black text-white outline-none transition focus:border-brand-500 focus:bg-brand-500/10 focus:ring-4 focus:ring-brand-500/15"
        />
      ))}
    </div>
  );
}
