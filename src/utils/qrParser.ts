/* ═══════════════════════════════════════════════════════════
   QR payload parser
   Accepts:
     - https://yourdomain.com/scan/64A15B?sig=xyz
     - http://172.20.10.3:5173/scan/64A15B?sig=xyz
     - /scan/64A15B?sig=xyz
     - 64A15B                    (raw serial)
     - 64A15B?sig=xyz
   Returns: { serialNumber, sig? } or null if unrecognized
═══════════════════════════════════════════════════════════ */
export interface ParsedQr {
  serialNumber: string;
  sig?: string;
}

export function parseQrPayload(text: string): ParsedQr | null {
  if (!text || typeof text !== 'string') return null;

  const trimmed = text.trim();
  if (!trimmed) return null;

  /* ─── Try full URL ──────────────────────────────────── */
  try {
    const url = new URL(trimmed);
    const parts = url.pathname.split('/').filter(Boolean);
    const idx = parts.findIndex((p) => p.toLowerCase() === 'scan');
    if (idx !== -1 && parts[idx + 1]) {
      const serial = parts[idx + 1].toUpperCase();
      const sig = url.searchParams.get('sig') ?? undefined;
      if (/^[A-Z0-9-]{4,32}$/.test(serial)) {
        return { serialNumber: serial, sig };
      }
    }
  } catch {
    /* not a URL — fall through */
  }

  /* ─── Try path-only: /scan/ABC123?sig=xyz ───────────── */
  const pathMatch = trimmed.match(/\/scan\/([A-Za-z0-9-]+)(?:\?sig=([A-Za-z0-9]+))?/i);
  if (pathMatch) {
    return {
      serialNumber: pathMatch[1].toUpperCase(),
      sig: pathMatch[2],
    };
  }

  /* ─── Try raw serial with optional ?sig= ────────────── */
  const rawMatch = trimmed.match(/^([A-Za-z0-9-]{4,32})(?:\?sig=([A-Za-z0-9]+))?$/);
  if (rawMatch) {
    return {
      serialNumber: rawMatch[1].toUpperCase(),
      sig: rawMatch[2],
    };
  }

  return null;
}
