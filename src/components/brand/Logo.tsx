interface LogoProps {
  /** Height in px. Width auto-scales (aspect ratio is preserved). */
  size?: number;
  className?: string;
  alt?: string;
}

/**
 * Vickkyaku brand mark — loaded from /public/vickkyaku.png.
 * Width auto-scales; the PNG's natural aspect ratio is preserved.
 */
export function Logo({ size = 36, className = '', alt = 'Vickkyaku logo' }: LogoProps) {
  return (
    <img
      src="/vickkyaku.png"
      alt={alt}
      style={{ height: size, width: 'auto' }}
      className={`object-contain ${className}`}
      draggable={false}
    />
  );
}
