interface WatermarkProps {
  /** Optional: how strongly the logo shows (0–1). Default is subtle. */
  opacity?: number;
  /** Optional: logo path (defaults to /vickkyaku.png) */
  logoSrc?: string;
}

/**
 * A fixed, non-interactive brand watermark that sits behind all page content.
 * Repeats a subtle logo motif at low opacity — matching the receipt aesthetic.
 * Hidden on print (so receipts stay clean).
 */
export function Watermark({
  opacity = 0.055,
  logoSrc = '/vickkyaku.png',
}: WatermarkProps) {
  return (
    <div
      aria-hidden
      className="watermark-layer pointer-events-none fixed inset-0 z-0 print:hidden"
      style={{ opacity }}
    >
      {/* ═══════════════════════════════════════════════
          CENTER — large ghost logo
      ═══════════════════════════════════════════════ */}
      <img
        src={logoSrc}
        alt=""
        className="absolute left-1/2 top-1/2 w-[68%] max-w-[380px] -translate-x-1/2 -translate-y-1/2 select-none"
        style={{ filter: 'grayscale(1) brightness(0.35)' }}
        draggable={false}
      />

      {/* ═══════════════════════════════════════════════
          TOP-LEFT — small accent
      ═══════════════════════════════════════════════ */}
      <img
        src={logoSrc}
        alt=""
        className="absolute left-[-6%] top-[18%] w-[32%] max-w-[200px] -rotate-[18deg] select-none"
        style={{ filter: 'grayscale(1) brightness(0.35)' }}
        draggable={false}
      />

      {/* ═══════════════════════════════════════════════
          BOTTOM-RIGHT — small accent
      ═══════════════════════════════════════════════ */}
      <img
        src={logoSrc}
        alt=""
        className="absolute bottom-[14%] right-[-6%] w-[36%] max-w-[220px] rotate-[22deg] select-none"
        style={{ filter: 'grayscale(1) brightness(0.35)' }}
        draggable={false}
      />
    </div>
  );
}
