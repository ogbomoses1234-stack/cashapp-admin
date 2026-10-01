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
        padding: '16mm 14mm',
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

        /* ─── Flex layout so content is centered ─────────── */
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
          opacity: 0.06,
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
          HEADER — Logo + Brand
      ═══════════════════════════════════════════════════ */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          marginBottom: '10mm',
        }}
      >
        <img
          src={logoSrc}
          alt="Vickkyaku"
          style={{
            height: '18mm',
            width: 'auto',
            objectFit: 'contain',
            filter: 'sepia(0.9) saturate(1.6) hue-rotate(-15deg) brightness(0.7)',
          }}
        />

        <h1
          style={{
            marginTop: '5mm',
            fontSize: '28pt',
            fontWeight: 900,
            letterSpacing: '0.02em',
            color: T.brand,
            lineHeight: 1,
            fontFamily: '"Georgia", "Times New Roman", serif',
          }}
        >
          VICKKYAKU.COM
        </h1>
      </div>

      {/* ═══════════════════════════════════════════════════
          DETAILS TABLE
      ═══════════════════════════════════════════════════ */}
      <div
        style={{
          position: 'relative',
          border: `1px solid ${T.border}`,
          borderRadius: '2mm',
          overflow: 'hidden',
          background: 'rgba(255,255,255,0.35)',
        }}
      >
        {/* Header row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '4mm 6mm',
            borderBottom: `1px solid ${T.borderLight}`,
            fontSize: '12pt',
          }}
        >
          <div>
            <span style={{ fontWeight: 700 }}>Receipt No: </span>
            <span style={{ fontWeight: 900, letterSpacing: '0.02em' }}>
              #{receiptNo}
            </span>
          </div>
          <div>
            <span style={{ fontWeight: 700 }}>Date: </span>
            <span style={{ fontWeight: 600 }}>{dateStr}</span>
          </div>
        </div>

        {/* Column headers */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 60px 1fr 1fr',
            padding: '4mm 6mm',
            borderBottom: `1px solid ${T.borderLight}`,
            fontSize: '12pt',
            fontWeight: 800,
          }}
        >
          <span>Item</span>
          <span style={{ textAlign: 'center' }}>Qty</span>
          <span style={{ textAlign: 'right' }}>Unit Price</span>
          <span style={{ textAlign: 'right' }}>Total</span>
        </div>

        {/* Item row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 60px 1fr 1fr',
            padding: '5mm 6mm',
            fontSize: '12pt',
            borderBottom: `1px solid ${T.borderLight}`,
          }}
        >
          <span style={{ fontWeight: 600 }}>{productTitle}</span>
          <span style={{ textAlign: 'center', fontWeight: 600 }}>{qty}</span>
          <span style={{ textAlign: 'right', fontWeight: 600 }}>
            {formatNaira(unit)}
          </span>
          <span style={{ textAlign: 'right', fontWeight: 800 }}>
            {formatNaira(unit * qty)}
          </span>
        </div>

        {/* Subtotal */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 60px 1fr 1fr',
            padding: '4mm 6mm',
            borderBottom: `1px solid ${T.borderLight}`,
            fontSize: '12pt',
          }}
        >
          <span />
          <span />
          <span style={{ textAlign: 'right', fontWeight: 700 }}>Subtotal:</span>
          <span style={{ textAlign: 'right', fontWeight: 800 }}>
            {formatNaira(grandTotal)}
          </span>
        </div>

        {/* Total */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 60px 1fr 1fr',
            padding: '5mm 6mm',
            background: 'rgba(139,115,85,0.08)',
            fontSize: '14pt',
          }}
        >
          <span />
          <span />
          <span
            style={{
              textAlign: 'right',
              fontWeight: 900,
              letterSpacing: '0.02em',
            }}
          >
            Total:
          </span>
          <span style={{ textAlign: 'right', fontWeight: 900 }}>
            {formatNaira(grandTotal)}
          </span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          CASHBACK & QR SECTION
          flex-1 makes this take remaining space and center content
      ═══════════════════════════════════════════════════ */}
      <div
        style={{
          position: 'relative',
          marginTop: '10mm',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            fontSize: '16pt',
            fontWeight: 900,
            letterSpacing: '0.02em',
            color: T.text,
            margin: 0,
          }}
        >
          Cashback &amp; QR
        </h2>

        <p
          style={{
            marginTop: '3mm',
            fontSize: '13pt',
            fontWeight: 800,
            color: T.text,
            lineHeight: 1.3,
          }}
        >
          Congratulations! Scan to Claim{' '}
          <span style={{ color: T.brand }}>
            ₦{Number(cashbackAmount).toFixed(2)}
          </span>{' '}
          Cashback
        </p>

        {/* QR code */}
        <div
          style={{
            marginTop: '7mm',
            display: 'inline-block',
            padding: '4mm',
            background: '#FFFFFF',
            border: `1px solid ${T.borderLight}`,
            borderRadius: '2mm',
          }}
        >
          <QRCodeCanvas
            value={qrData}
            size={180}
            level="M"
            bgColor="#FFFFFF"
            fgColor="#1A1A1A"
            marginSize={0}
          />
        </div>

        <p
          style={{
            marginTop: '6mm',
            fontSize: '13pt',
            fontWeight: 900,
            letterSpacing: '0.05em',
            color: T.text,
            textTransform: 'uppercase',
          }}
        >
          Earn ₦{Number(cashbackAmount).toFixed(2)} Cashback
        </p>
        <p
          style={{
            marginTop: '1.5mm',
            fontSize: '10pt',
            fontWeight: 600,
            letterSpacing: '0.12em',
            color: T.muted,
            textTransform: 'uppercase',
          }}
        >
          Scan the code · Claim instantly
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
          bottom: '8mm',
          width: '22mm',
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
