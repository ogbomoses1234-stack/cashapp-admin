import { InputHTMLAttributes, forwardRef, ReactNode } from 'react';

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string;
  error?: string | null;
  hint?: string;
  prefix?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, error, hint, prefix, className = '', ...rest },
  ref
) {
  return (
    <label className="block">
      {label && (
        <span className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-ink-400">
          {label}
        </span>
      )}
      <div className="flex items-stretch gap-2">
        {prefix}
        <input
          ref={ref}
          className={`w-full rounded-xl border-0 bg-white/[.04] px-3.5 py-2.5 text-[13px] font-semibold text-white outline-none ring-1 ring-inset ring-white/10 transition placeholder:text-ink-500 focus:bg-white/[.06] focus:ring-2 focus:ring-brand-500 ${className}`}
          {...rest}
        />
      </div>
      {hint && !error && (
        <span className="mt-1 block text-[11px] text-ink-500">{hint}</span>
      )}
      {error && (
        <span className="mt-1 block text-[11px] font-semibold text-rose-400">
          {error}
        </span>
      )}
    </label>
  );
});
