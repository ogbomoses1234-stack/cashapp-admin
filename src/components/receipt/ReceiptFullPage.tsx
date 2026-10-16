import { QRCodeSVG } from 'qrcode.react';
import { formatNaira } from '@/utils/format';

/* ═══════════════════════════════════════════════════════════
   Types
═══════════════════════════════════════════════════════════ */
export interface ReceiptFullPageProps {
  receiptNo: string;
  productTitle: string;
  quantity?: number;
  unitPrice: string | number;
  total?: string | number;
  qrData: string;
  cashbackAmount?: string | number;
  date?: Date | string;
  logoSrc?: string;
  isLast?: boolean;
}

/* ═══════════════════════════════════════════════════════════
   Color tokens
═══════════════════════════════════════════════════════════ */
const T = {
  bg: '#F5EFE0',
  brand: '#8B7355',
  text: '#1A1A1A',
  muted: '#6B5B47',
  border: '#C9B896',
  borderLight: '#DCCDB0',
};

/* ═══════════════════════════════════════════════════════════
   Component
═══════════════════════════════════════════════════════════ */
export function ReceiptFullPage({
  receiptNo,
  productTitle,
  quantity = 1,
  unitPrice,
  total,
  qrData,
  cashbackAmount = 100,
  date = new Date(),
  logoSrc = '/vickkyaku.png',
  isLast = false,
}: ReceiptFullPageProps) {
  const unit = Number(unitPrice) || 0;
  const qty = Number(quantity) || 1;
  const grandTotal = total !== undefined ? Number(total) : unit * qty;

  const dateStr =
    date instanceof Date
      ? date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : String(date);

  return (
    <div
      className="receipt-page relative"
      style={{
        /* ─── Exact A4 dimensions ─────────────────────────── */
        width: '210mm',
        height: '297mm',
        boxSizing: 'border-box',
        padding: '10mm 8mm 8mm',
        overflow: 'hidden',

        /* ─── Visuals ─────────────────────────────────────── */
        background: T.bg,
        color: T.text,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif',

        /* ─── Print page breaks ──────────────────────────── */
        pageBreakAfter: isLast ? 'auto' : 'always',
        breakAfter: isLast ? 'auto' : 'page',
        pageBreakInside: 'avoid',
        breakInside: 'avoid',

        /* ─── Flex column so QR section can grow ─────────── */
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ═══════════════════════════════════════════════════
          BACKGROUND WATERMARK
      ═══════════════════════════════════════════════════ */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          opacity: 0.05,
        }}
      >
        <img
          src={logoSrc}
          alt=""
          style={{
            width: '50%',
            filter: 'sepia(1) hue-rotate(-15deg) saturate(0.6)',
          }}
        />
      </div>

      {/* ═══════════════════════════════════════════════════
          HEADER — logo + brand + receipt line
      ═══════════════════════════════════════════════════ */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          flexShrink: 0,
        }}
      >
        <img
          src={logoSrc}
          alt="Vickkyaku"
          style={{
            height: '11mm',
            width: 'auto',
            objectFit: 'contain',
            filter: 'sepia(0.9) saturate(1.6) hue-rotate(-15deg) brightness(0.7)',
          }}
        />

        <h1
          style={{
            marginTop: '2.5mm',
            marginBottom: 0,
            fontSize: '20pt',
            fontWeight: 900,
            letterSpacing: '0.03em',
            color: T.brand,
            lineHeight: 1,
            fontFamily: '"Georgia", "Times New Roman", serif',
          }}
        >
          VICKKYAKU.COM
        </h1>

        <p
          style={{
            marginTop: '3mm',
            marginBottom: 0,
            fontSize: '10pt',
            color: T.text,
            fontWeight: 500,
          }}
        >
          Receipt No: <b style={{ fontWeight: 800 }}>#{receiptNo}</b>
          <span style={{ margin: '0 8px', color: T.border }}>|</span>
          Date: <b style={{ fontWeight: 800 }}>{dateStr}</b>
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════
          BREAK LINE — TOP
      ═══════════════════════════════════════════════════ */}
      <div
        style={{
          position: 'relative',
          margin: '5mm 0',
          borderTop: `1.5px solid ${T.border}`,
          flexShrink: 0,
        }}
      />

      {/* ═══════════════════════════════════════════════════
          PRODUCT — name + price
      ═══════════════════════════════════════════════════ */}
      <div
        style={{
          position: 'relative',
          textAlign: 'center',
          flexShrink: 0,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: '22pt',
            fontWeight: 800,
            color: T.brand,
            fontFamily: '"Georgia", "Times New Roman", serif',
            lineHeight: 1.1,
          }}
        >
          {productTitle}
        </h2>

        <p
          style={{
            marginTop: '4mm',
            marginBottom: 0,
            fontSize: '22pt',
            fontWeight: 900,
            color: T.text,
            letterSpacing: '-0.01em',
            lineHeight: 1,
          }}
        >
          {formatNaira(grandTotal)}
        </p>

        {qty > 1 && (
          <p
            style={{
              marginTop: '2mm',
              marginBottom: 0,
              fontSize: '10pt',
              color: T.muted,
              fontWeight: 500,
            }}
          >
            {qty} × {formatNaira(unit)}
          </p>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════
          QR CODE — takes 90% of the receipt width
          This section grows to fill remaining vertical space.
      ═══════════════════════════════════════════════════ */}
      <div
        style={{
          position: 'relative',
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4mm 0',
          minHeight: 0,
        }}
      >
        <div
          style={{
            width: '90%',
            maxWidth: '90%',
            aspectRatio: '1 / 1',
            maxHeight: '100%',
            background: '#FFFFFF',
            padding: '3mm',
            borderRadius: '3mm',
            boxShadow: '0 1mm 3mm rgba(0,0,0,0.06)',
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <QRCodeSVG
            value={qrData}
            level="M"
            bgColor="#FFFFFF"
            fgColor="#1A1A1A"
            marginSize={0}
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          CASHBACK CALLOUT
      ═══════════════════════════════════════════════════ */}
      <div
        style={{
          position: 'relative',
          textAlign: 'center',
          paddingTop: '2mm',
          flexShrink: 0,
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: '15pt',
            fontWeight: 900,
            letterSpacing: '0.04em',
            color: T.text,
            textTransform: 'uppercase',
          }}
        >
          Earn ₦{Number(cashbackAmount).toFixed(2)} Cashback
        </p>
        <p
          style={{
            marginTop: '2mm',
            marginBottom: 0,
            fontSize: '10pt',
            fontWeight: 600,
            letterSpacing: '0.16em',
            color: T.muted,
            textTransform: 'uppercase',
          }}
        >
          Scan the code · Claim instantly
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════
          BREAK LINE — BOTTOM
      ═══════════════════════════════════════════════════ */}
      <div
        style={{
          position: 'relative',
          margin: '4mm 0',
          borderTop: `1.5px solid ${T.border}`,
          flexShrink: 0,
        }}
      />

      {/* ═══════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════ */}
      <div
        style={{
          position: 'relative',
          textAlign: 'center',
          flexShrink: 0,
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: '9pt',
            color: T.muted,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}
        >
          vickkyaku.store
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════
          BOTTOM-RIGHT WATERMARK
      ═══════════════════════════════════════════════════ */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          right: '6mm',
          bottom: '4mm',
          width: '14mm',
          opacity: 0.1,
          pointerEvents: 'none',
        }}
      >
        <img
          src={logoSrc}
          alt=""
          style={{
            width: '100%',
            filter: 'sepia(1) hue-rotate(-15deg) saturate(0.6)',
          }}
        />
      </div>
    </div>
  );
}