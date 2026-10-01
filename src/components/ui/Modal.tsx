import { ReactNode, useEffect } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  maxWidth?: string;
  /** Optional max height for the modal shell. Defaults to 90vh. */
  maxHeight?: string;
  /** Optional footer — pinned to the bottom, never scrolls */
  footer?: ReactNode;
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-lg',
  maxHeight = 'max-h-[90vh]',
  footer,
}: Props) {
  /* Esc to close + body scroll lock */
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);

    /* Prevent background scroll */
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', esc);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className={`relative flex w-full ${maxWidth} ${maxHeight} animate-fade-up flex-col overflow-hidden rounded-2xl bg-[#0d121c] shadow-elevated ring-1 ring-white/10`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ═══════════════════════════════════════════════════
            HEADER — pinned, never scrolls
        ═══════════════════════════════════════════════════ */}
        {(title || subtitle) && (
          <div className="flex flex-shrink-0 items-start justify-between gap-4 border-b border-surface-border px-6 py-4">
            <div className="min-w-0 flex-1">
              {title && (
                <h3 className="truncate text-base font-bold tracking-tight text-white">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="mt-1 truncate text-[12.5px] font-medium text-ink-400">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg text-ink-400 transition hover:bg-white/[.06] hover:text-white"
            >
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            BODY — scrollable
        ═══════════════════════════════════════════════════ */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5">
          {children}
        </div>

        {/* ═══════════════════════════════════════════════════
            FOOTER — pinned, never scrolls
        ═══════════════════════════════════════════════════ */}
        {footer && (
          <div className="flex flex-shrink-0 items-center justify-end gap-2 border-t border-surface-border bg-[#0a0e17]/70 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
