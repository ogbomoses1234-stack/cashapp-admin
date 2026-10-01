import { useRef } from 'react';
import { QrLabel } from './QrLabel';
import { Button } from '@/components/ui/Button';

/* ═══════════════════════════════════════════════════════════
   Types
═══════════════════════════════════════════════════════════ */
export interface QrLabelItem {
  serialNumber: string;
  qrData: string;
}

export interface QrLabelSheetProps {
  /** Product metadata shared by all labels in this batch */
  productTitle: string;
  price: string | number;
  /** Individual serials — each becomes one label */
  items: QrLabelItem[];
  /** Optional cashback amount (defaults to 100) */
  cashbackAmount?: string | number;
  /** Optional website text (defaults to "vickkyaku.com") */
  website?: string;
  /** Optional logo path (defaults to "/vickkyaku.png") */
  logoSrc?: string;
  /** Optional label to show above the sheet (e.g. batch ID) */
  batchLabel?: string;
}

/* ═══════════════════════════════════════════════════════════
   Constants — grid layout
═══════════════════════════════════════════════════════════ */
const LABELS_PER_ROW = 2;
const LABELS_PER_COL = 4;
const LABELS_PER_PAGE = LABELS_PER_ROW * LABELS_PER_COL; // 8

/* ═══════════════════════════════════════════════════════════
   Sheet component
═══════════════════════════════════════════════════════════ */
export function QrLabelSheet({
  productTitle,
  price,
  items,
  cashbackAmount = 100,
  website = 'vickkyaku.com',
  logoSrc = '/vickkyaku.png',
  batchLabel,
}: QrLabelSheetProps) {
  const printRef = useRef<HTMLDivElement>(null);

  /* Split items into pages of 8 */
  const pages: QrLabelItem[][] = [];
  for (let i = 0; i < items.length; i += LABELS_PER_PAGE) {
    pages.push(items.slice(i, i + LABELS_PER_PAGE));
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* ═══════════════════════════════════════════════════
          ACTION BAR (hidden when printing)
      ═══════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-surface-border bg-white/[.015] p-4 print:hidden">
        <div>
          <p className="text-[12.5px] font-bold text-white">
            {items.length} label{items.length === 1 ? '' : 's'} ready
            {batchLabel ? ` · ${batchLabel}` : ''}
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-ink-500">
            {pages.length} page{pages.length === 1 ? '' : 's'} ·{' '}
            {LABELS_PER_PAGE} labels per A4 sheet
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" size="sm" onClick={handlePrint}>
            🖨️ Print labels
          </Button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          PRINT SHEET (only this is printed)
      ═══════════════════════════════════════════════════ */}
      <div
        id="print-label-sheet"
        ref={printRef}
        className="space-y-6"
      >
        {pages.map((pageItems, pageIdx) => (
          <div
            key={pageIdx}
            className="mx-auto bg-white shadow-lg print:shadow-none"
            style={{
              width: '210mm',
              minHeight: '297mm',
              padding: '8mm',
            }}
          >
            {/* Grid */}
            <div
              className="grid h-full w-full gap-2"
              style={{
                gridTemplateColumns: `repeat(${LABELS_PER_ROW}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${LABELS_PER_COL}, minmax(0, 1fr))`,
              }}
            >
              {pageItems.map((it, i) => (
                <QrLabel
                  key={it.serialNumber || i}
                  productTitle={productTitle}
                  price={price}
                  serialNumber={it.serialNumber}
                  qrData={it.qrData}
                  cashbackAmount={cashbackAmount}
                  website={website}
                  logoSrc={logoSrc}
                />
              ))}

              {/* Fill empty cells with invisible placeholders so the
                  grid keeps its layout on the last page */}
              {Array.from({
                length: LABELS_PER_PAGE - pageItems.length,
              }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="rounded-xl border border-dashed border-ink-100/60"
                  aria-hidden
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
