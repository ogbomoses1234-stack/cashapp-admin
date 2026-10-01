import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { ReceiptFullPage } from './ReceiptFullPage';
import { Button } from '@/components/ui/Button';
import { toast } from '@/hooks/useToast';

/* ═══════════════════════════════════════════════════════════
   Types
═══════════════════════════════════════════════════════════ */
export interface ReceiptSheetItem {
  receiptNo: string;
  qrData: string;
}

export interface ReceiptSheetProps {
  productTitle: string;
  unitPrice: string | number;
  quantity?: number;
  items: ReceiptSheetItem[];
  cashbackAmount?: string | number;
  logoSrc?: string;
  batchLabel?: string;
}

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

export function ReceiptSheet({
  productTitle,
  unitPrice,
  quantity = 1,
  items,
  cashbackAmount = 100,
  logoSrc = '/vickkyaku.png',
  batchLabel,
}: ReceiptSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<'png' | 'pdf' | 'zip' | null>(null);

  /* ─── Get a single receipt node ─────────────────────────── */
  const getReceiptNode = (index: number): HTMLElement | null => {
    if (!sheetRef.current) return null;
    const nodes =
      sheetRef.current.querySelectorAll<HTMLElement>('.receipt-page');
    return nodes[index] ?? null;
  };

  /* ─── Render receipt to canvas ──────────────────────────── */
  const renderReceipt = async (index: number): Promise<HTMLCanvasElement> => {
    const node = getReceiptNode(index);
    if (!node) throw new Error('Receipt not found');

    node.scrollIntoView({ behavior: 'auto', block: 'start' });

    /* Wait for images inside the node to fully load */
    const images = node.querySelectorAll('img');
    await Promise.all(
      Array.from(images).map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete && img.naturalWidth > 0) return resolve();
            img.onload = () => resolve();
            img.onerror = () => resolve();
          })
      )
    );

    /* Small tick to let the browser paint */
    await new Promise((r) => setTimeout(r, 60));

    return html2canvas(node, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#F5EFE0',
      logging: false,
      windowWidth: node.scrollWidth,
      windowHeight: node.scrollHeight,
    });
  };

  /* ─── Render all receipts ───────────────────────────────── */
  const renderAll = async (
    onProgress?: (done: number, total: number) => void
  ): Promise<HTMLCanvasElement[]> => {
    const canvases: HTMLCanvasElement[] = [];
    for (let i = 0; i < items.length; i++) {
      const c = await renderReceipt(i);
      canvases.push(c);
      onProgress?.(i + 1, items.length);
    }
    return canvases;
  };

  /* ─── Download as ZIP of PNGs ───────────────────────────── */
  const handleDownloadPNGs = async () => {
    if (busy || items.length === 0) return;
    setBusy('zip');
    toast.info(`Rendering ${items.length} receipts…`);

    try {
      const canvases = await renderAll();
      const zip = new JSZip();

      canvases.forEach((canvas, i) => {
        const dataUrl = canvas.toDataURL('image/png');
        const base64 = dataUrl.split(',')[1];
        const serial = items[i]?.receiptNo ?? `receipt-${i + 1}`;
        zip.file(`vickkyaku-receipt-${serial}.png`, base64, { base64: true });
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const batch = batchLabel ? `-${batchLabel}` : '';
      saveAs(blob, `vickkyaku-receipts${batch}.zip`);

      toast.success(`Downloaded ${items.length} receipts as ZIP`);
    } catch (e) {
      console.error(e);
      toast.error('Could not generate PNGs');
    } finally {
      setBusy(null);
    }
  };

  /* ─── Download as single PDF ────────────────────────────── */
  const handleDownloadPDF = async () => {
    if (busy || items.length === 0) return;
    setBusy('pdf');
    toast.info(`Building PDF with ${items.length} pages…`);

    try {
      const canvases = await renderAll();
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      canvases.forEach((canvas, i) => {
        if (i > 0) pdf.addPage();

        const imgData = canvas.toDataURL('image/jpeg', 0.92);
        const canvasRatio = canvas.height / canvas.width;
        const imgW = A4_WIDTH_MM;
        const imgH = imgW * canvasRatio;
        const finalH = Math.min(imgH, A4_HEIGHT_MM);

        pdf.addImage(imgData, 'JPEG', 0, 0, imgW, finalH);
      });

      const batch = batchLabel ? `-${batchLabel}` : '';
      pdf.save(`vickkyaku-receipts${batch}.pdf`);

      toast.success(`Downloaded ${items.length}-page PDF`);
    } catch (e) {
      console.error(e);
      toast.error('Could not generate PDF');
    } finally {
      setBusy(null);
    }
  };

  /* ─── Native print ──────────────────────────────────────── */
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* ═══════════════════════════════════════════════════
          ACTION BAR
      ═══════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-surface-border bg-white/[.015] p-4 print:hidden">
        <div>
          <p className="text-[12.5px] font-bold text-white">
            {items.length} receipt{items.length === 1 ? '' : 's'} ready
            {batchLabel ? ` · ${batchLabel}` : ''}
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-ink-500">
            {items.length} page{items.length === 1 ? '' : 's'} · A4 portrait
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPDF}
            disabled={busy !== null}
            loading={busy === 'pdf'}
          >
            {busy === 'pdf' ? 'Building PDF…' : '⬇ Download PDF'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPNGs}
            disabled={busy !== null}
            loading={busy === 'zip'}
          >
            {busy === 'zip' ? 'Building ZIP…' : '⬇ Download PNGs (ZIP)'}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handlePrint}
            disabled={busy !== null}
          >
            🖨️ Print
          </Button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          PRINT SHEET — no spacing between receipts
          (each receipt has its own page in print)
      ═══════════════════════════════════════════════════ */}
      <div id="print-receipt-sheet" ref={sheetRef} className="space-y-4 print:space-y-0">
        {items.map((it, i) => (
          <ReceiptFullPage
            key={it.receiptNo || i}
            receiptNo={it.receiptNo}
            productTitle={productTitle}
            quantity={quantity}
            unitPrice={unitPrice}
            qrData={it.qrData}
            cashbackAmount={cashbackAmount}
            logoSrc={logoSrc}
            isLast={i === items.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
