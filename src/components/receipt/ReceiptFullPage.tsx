import { QRCodeCanvas } from 'qrcode.react';
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
   Color tokens — match the reference design
═══════════════════════════════════════════════════════════ */
const T = {
  bg: '#F5EFE0',
  brand: '#8B7355',          // gold
  brandLight: '#A89376',
  text: '#1A1A1A',
  muted: '#6B5B47',
  border: '#C9B896',         // gold for break lines
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
        padding: '14mm 14mm 12mm',
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

        /* ─── Flex layout so content flows and QR grows ──── */
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ═══════════════════════════════════════════════════
          BACKGROUND WATERMARK (V logo, very subtle)
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
          opacity: 0.055,
        }}
      >
        <img
          src={logoSrc}
          alt=""
          style={{
            width: '55%',
            filter: 'sepia(1) hue-rotate(-15deg) saturate(0.6)',
          }}
        />
      </div>

      {/* ═══════════════════════════════════════════════════
          HEADER — Logo + Brand + Receipt line
      ═══════════════════════════════════════════════════ */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <img
          src={logoSrc}
          alt="Vickkyaku"
          style={{
            height: '14mm',
            width: 'auto',
            objectFit: 'contain',
            filter: 'sepia(0.9) saturate(1.6) hue-rotate(-15deg) brightness(0.7)',
          }}
        />

        <h1
          style={{
            marginTop: '3mm',
            marginBottom: 0,
            fontSize: '24pt',
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
            marginTop: '4mm',
            marginBottom: 0,
            fontSize: '11pt',
            color: T.text,
            fontWeight: 500,
            letterSpacing: '0.01em',
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
          margin: '7mm 0',
          borderTop: `1.5px solid ${T.border}`,
        }}
      />

      {/* ═══════════════════════════════════════════════════
          PRODUCT — name + price
      ═══════════════════════════════════════════════════ */}
      <div
        style={{
          position: 'relative',
          textAlign: 'center',
          marginBottom: '2mm',
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: '28pt',
            fontWeight: 800,
            color: T.brand,
            fontFamily: '"Georgia", "Times New Roman", serif',
            lineHeight: 1.1,
            letterSpacing: '0.005em',
          }}
        >
          {productTitle}
        </h2>

        <p
          style={{
            marginTop: '5mm',
            marginBottom: 0,
            fontSize: '26pt',
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
              marginTop: '3mm',
              marginBottom: 0,
              fontSize: '11pt',
              color: T.muted,
              fontWeight: 500,
            }}
          >
            {qty} × {formatNaira(unit)}
          </p>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════
          QR + CASHBACK CALLOUT — grows to fill remaining space
      ═══════════════════════════════════════════════════ */}
      <div
        style={{
          position: 'relative',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8mm',
          paddingTop: '6mm',
          paddingBottom: '2mm',
        }}
      >
        {/* ─── QR CODE — bigger ──────────────────────────── */}
        <div
          style={{
            display: 'inline-block',
            padding: '5mm',
            background: '#FFFFFF',
            border: `1px solid ${T.borderLight}`,
            borderRadius: '2mm',
          }}
        >
          <QRCodeCanvas
            value={qrData}
            size={320}
            level="M"
            bgColor="#FFFFFF"
            fgColor="#1A1A1A"
            marginSize={0}
          />
        </div>

        {/* ─── Cashback callout ──────────────────────────── */}
        <div style={{ textAlign: 'center' }}>
          <p
            style={{
              margin: 0,
              fontSize: '17pt',
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
              marginTop: '3mm',
              marginBottom: 0,
              fontSize: '11pt',
              fontWeight: 600,
              letterSpacing: '0.16em',
              color: T.muted,
              textTransform: 'uppercase',
            }}
          >
            Scan the code · Claim instantly
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          BREAK LINE — BOTTOM
      ═══════════════════════════════════════════════════ */}
      <div
        style={{
          position: 'relative',
          margin: '6mm 0 4mm',
          borderTop: `1.5px solid ${T.border}`,
        }}
      />

      {/* ═══════════════════════════════════════════════════
          FOOTER — small brand line
      ═══════════════════════════════════════════════════ */}
      <div
        style={{
          position: 'relative',
          textAlign: 'center',
          paddingBottom: '6mm',
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
          right: '8mm',
          bottom: '6mm',
          width: '18mm',
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