import { QRCodeSVG } from 'qrcode.react';
import { formatNaira } from '@/utils/format';

/* ═══════════════════════════════════════════════════════════
   Types
═══════════════════════════════════════════════════════════ */
export interface QrLabelProps {
  /** Product name, e.g. "Glow Body Lotion 400ml" */
  productTitle: string;
  /** Product price as string or number */
  price: string | number;
  /** Short serial code, e.g. "64A15B" */
  serialNumber: string;
  /** Full URL the QR should encode (the /scan/:serial?sig=... link) */
  qrData: string;
  /** Cashback amount in ₦ — defaults to 100 */
  cashbackAmount?: string | number;
  /** Brand website text (defaults to "vickkyaku.com") */
  website?: string;
  /** Logo path (defaults to /vickkyaku.png) */
  logoSrc?: string;
}

/* ═══════════════════════════════════════════════════════════
   Single printable QR label
   Dimensions: fits an A4 sheet at 2 columns × 4 rows
═══════════════════════════════════════════════════════════ */
export function QrLabel({
  productTitle,
  price,
  serialNumber,
  qrData,
  cashbackAmount = 100,
  website = 'vickkyaku.com',
  logoSrc = '/vickkyaku.png',
}: QrLabelProps) {
  return (
    <div className="label-tile relative flex h-full w-full flex-col overflow-hidden rounded-xl bg-white ring-1 ring-ink-100">
      {/* ═══════════════════════════════════════════════════
          TOP — Logo + Brand
      ═══════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between gap-2 border-b border-dashed border-ink-200 px-3 py-2">
        <img
          src={logoSrc}
          alt="Vickkyaku"
          className="h-7 w-auto object-contain"
          draggable={false}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <p className="text-[8px] font-black uppercase tracking-[0.28em] text-ink-500">
          {website}
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════
          MIDDLE — Product name + Price
      ═══════════════════════════════════════════════════ */}
      <div className="px-3 pt-2">
        <p className="line-clamp-2 text-[10.5px] font-black leading-tight tracking-tight text-ink-900">
          {productTitle}
        </p>
        <p className="mt-0.5 font-mono text-[15px] font-black tracking-tight text-ink-900">
          {formatNaira(price)}
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════
          CENTER — QR CODE (the star)
      ═══════════════════════════════════════════════════ */}
      <div className="flex flex-1 items-center justify-center px-3 py-2">
        <div className="rounded-lg bg-white p-1.5 ring-1 ring-ink-100">
          <QRCodeSVG
            value={qrData}
            size={96}
            level="M"
            bgColor="#FFFFFF"
            fgColor="#0B0F14"
            marginSize={0}
          />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          BOTTOM — Cashback callout + Serial
      ═══════════════════════════════════════════════════ */}
      <div className="border-t border-dashed border-ink-200 px-3 py-2 text-center">
        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-brand-700">
          Earn {formatNaira(cashbackAmount)} cashback
        </p>
        <p className="mt-1 text-[8px] font-bold uppercase tracking-wider text-ink-400">
          Scan the code · claim instantly
        </p>
        <p className="mt-1 font-mono text-[8.5px] font-black tracking-wider text-ink-500">
          #{serialNumber}
        </p>
      </div>
    </div>
  );
}
