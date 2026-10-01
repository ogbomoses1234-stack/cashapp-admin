import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Spinner } from './Spinner';

type Variant = 'primary' | 'outline' | 'ghost' | 'danger' | 'dark';
type Size = 'sm' | 'md' | 'lg';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  loading?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-gradient-to-br from-brand-400 to-brand-600 text-[#04140d] shadow-glow hover:brightness-105',
  outline:
    'bg-white/[.04] text-white ring-1 ring-inset ring-white/15 hover:bg-white/[.08]',
  ghost: 'bg-transparent text-ink-300 hover:bg-white/[.05] hover:text-white',
  danger:
    'bg-rose-500/15 text-rose-300 ring-1 ring-inset ring-rose-400/30 hover:bg-rose-500/25',
  dark: 'bg-white/[.06] text-white hover:bg-white/[.12]',
};

const SIZES: Record<Size, string> = {
  sm: 'px-3 py-2 text-xs rounded-xl',
  md: 'px-4 py-2.5 text-[13px] rounded-xl',
  lg: 'px-5 py-3 text-sm rounded-2xl',
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', size = 'md', block, loading, className = '', children, disabled, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 font-bold transition active:scale-[.98] disabled:opacity-50 disabled:pointer-events-none ${VARIANTS[variant]} ${SIZES[size]} ${block ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {loading && <Spinner size={12} />}
      {children}
    </button>
  );
});
