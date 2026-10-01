import { useEffect, useMemo, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ReceiptSheet } from '@/components/receipt/ReceiptSheet';
import { listProducts } from '@/services/product.service';
import { generateQrBatch, listBatch } from '@/services/serial.service';
import type { AdminProduct, QrBatchResult, SerialRow } from '@/types';
import { ApiClientError } from '@/services/api';
import { toast } from '@/hooks/useToast';

export default function QrGeneratorPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  const [productId, setProductId] = useState('');
  const [volume, setVolume] = useState('500');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  const [result, setResult] = useState<QrBatchResult | null>(null);
  const [serials, setSerials] = useState<SerialRow[]>([]);
  const [loadingSerials, setLoadingSerials] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  /* ─── Load products ────────────────────────────────────── */
  useEffect(() => {
    let alive = true;
    setProductsLoading(true);
    listProducts({ perPage: 100 })
      .then((res) => {
        if (!alive) return;
        setProducts(Array.isArray(res?.items) ? res.items : []);
      })
      .catch((e) => {
        if (!alive) return;
        const err = e as ApiClientError;
        setProductsError(
          err.status === 401
            ? 'Session expired — please log in again'
            : err.message ?? 'Could not load products'
        );
        setProducts([]);
      })
      .finally(() => {
        if (alive) setProductsLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === productId) ?? null,
    [products, productId]
  );

  const parsedVolume = useMemo(() => {
    const n = parseInt(volume, 10);
    return isFinite(n) && n > 0 && n <= 10000 ? n : 0;
  }, [volume]);

  /* ─── Generate ─────────────────────────────────────────── */
  const handleGenerate = async () => {
    if (!productId) return toast.error('Select a product');
    if (parsedVolume <= 0) {
      return toast.error('Volume must be between 1 and 10,000');
    }

    setBusy(true);
    setProgress(0);
    setResult(null);
    setSerials([]);
    setShowPreview(false);

    const tick = setInterval(() => {
      setProgress((p) => Math.min(90, p + Math.random() * 15));
    }, 200);

    try {
      const res = await generateQrBatch({
        productId,
        volume: parsedVolume,
      });
      clearInterval(tick);
      setProgress(100);
      setResult(res);
      toast.success(`${parsedVolume} serials generated`);
    } catch (e) {
      clearInterval(tick);
      setProgress(0);
      const err = e as ApiClientError;
      toast.error(err.message ?? 'Could not generate serials');
    } finally {
      setBusy(false);
    }
  };

  /* ─── Load serials ─────────────────────────────────────── */
  const handleShowPreview = async () => {
    if (!result?.batchId) return;
    setLoadingSerials(true);
    try {
      const list = await listBatch(result.batchId);
      setSerials(Array.isArray(list) ? list : []);
      setShowPreview(true);
    } catch (e) {
      toast.error((e as ApiClientError).message ?? 'Could not load serials');
    } finally {
      setLoadingSerials(false);
    }
  };

  /* ─── Build receipt items ──────────────────────────────── */
  const receiptItems = useMemo(() => {
    if (!serials.length) return [];

    // Prefer explicit env var for scannable QR codes (works from phone on LAN/prod)
    const origin =
      (import.meta.env.VITE_PUBLIC_SCAN_BASE_URL as string) ||
      (typeof window !== 'undefined' ? window.location.origin : '');

    return serials.map((s) => {
      const sig = (s as unknown as { qrSignature?: string }).qrSignature;
      const sigQuery = sig ? `?sig=${sig}` : '';
      return {
        receiptNo: s.serialNumber,
        qrData: `${origin.replace(/\/$/, '')}/scan/${s.serialNumber}${sigQuery}`,
      };
    });
  }, [serials]);

  return (
    <>
      <Header
        title="QR Batch Generator"
        subtitle="Mint serials and print full-page cashback receipts"
      />

      <div className="flex-1 overflow-y-auto p-6">
        {/* ═══════════════════════════════════════════════════
            FORM + RESULT
        ═══════════════════════════════════════════════════ */}
        <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-2 print:hidden">
          {/* LEFT — Form */}
          <div className="rounded-2xl border border-surface-border bg-white/[.015] p-6">
            <h3 className="mb-5 text-[14px] font-bold text-white">
              Batch configuration
            </h3>

            {productsError ? (
              <div className="mb-5 rounded-xl border border-rose-400/25 bg-rose-500/5 p-4">
                <p className="text-[12.5px] font-bold text-rose-200">
                  {productsError}
                </p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="mt-3 rounded-lg bg-white/[.06] px-3 py-2 text-[11.5px] font-black text-white ring-1 ring-inset ring-white/15 transition hover:bg-white/[.12]"
                >
                  Reload page
                </button>
              </div>
            ) : null}

            <label className="mb-4 block">
              <span className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-ink-400">
                Product
              </span>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                disabled={busy || productsLoading}
                className="w-full rounded-xl border-0 bg-white/[.04] px-3.5 py-2.5 text-[13px] font-semibold text-white outline-none ring-1 ring-inset ring-white/10 transition focus:ring-2 focus:ring-brand-500 disabled:opacity-60"
              >
                <option value="">
                  {productsLoading
                    ? 'Loading products…'
                    : products.length === 0
                      ? 'No products available'
                      : 'Select a product…'}
                </option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
              {selectedProduct && (
                <span className="mt-1.5 block text-[11px] text-ink-500">
                  Stock {Number(selectedProduct.stockCount ?? 0).toLocaleString()}{' '}
                  · {Number(selectedProduct.serialCount ?? 0).toLocaleString()}{' '}
                  existing serials
                </span>
              )}
            </label>

            <Input
              label="Batch volume"
              type="number"
              min={1}
              max={10000}
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              disabled={busy}
              hint="1 – 10,000 QR codes · one full-page receipt each"
            />

            <Button
              variant="primary"
              size="lg"
              block
              className="mt-5"
              onClick={handleGenerate}
              disabled={
                busy ||
                productsLoading ||
                !productId ||
                parsedVolume <= 0 ||
                !!productsError
              }
              loading={busy}
            >
              {busy ? 'Generating…' : '⚡ Generate unique tracking codes'}
            </Button>

            {progress > 0 && (
              <div className="mt-4">
                <div className="h-1.5 overflow-hidden rounded-full bg-white/[.06]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-2 text-center text-[11px] font-semibold text-ink-500">
                  {progress < 100 ? 'Minting serials…' : 'Done'}
                </p>
              </div>
            )}
          </div>

          {/* RIGHT — Result */}
          <div className="rounded-2xl border border-surface-border bg-white/[.015] p-6">
            {!result ? (
              <div className="flex h-full flex-col items-center justify-center py-14 text-center">
                <span className="mb-3 text-4xl opacity-40">🧾</span>
                <p className="text-[13px] font-bold text-white">
                  No batch generated yet
                </p>
                <p className="mt-1 max-w-xs text-[11.5px] font-medium text-ink-500">
                  Generated batches appear here with printable full-page receipts.
                </p>
              </div>
            ) : (
              <div className="animate-fade-up">
                <div className="mb-5 flex items-center gap-3 rounded-xl bg-brand-500/10 p-3 ring-1 ring-inset ring-brand-400/25">
                  <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg bg-brand-500/20 text-sm text-brand-200">
                    ✓
                  </span>
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-black text-brand-200">
                      Batch ready
                    </p>
                    <p className="text-[11px] text-brand-300/70">
                      {Number(result.volume ?? 0).toLocaleString()} serials
                      created
                    </p>
                  </div>
                </div>

                <dl className="space-y-3 border-b border-surface-border pb-4">
                  <Row label="Batch ID" value={result.batchId || '—'} mono />
                  <Row label="Product" value={result.productTitle || '—'} />
                  <Row
                    label="Volume"
                    value={Number(result.volume ?? 0).toLocaleString()}
                  />
                  <Row
                    label="Created"
                    value={
                      result.createdAt
                        ? new Date(result.createdAt).toLocaleString()
                        : '—'
                    }
                  />
                </dl>

                <div className="mt-5 space-y-2.5">
                  <Button
                    variant="primary"
                    size="lg"
                    block
                    onClick={handleShowPreview}
                    loading={loadingSerials}
                    disabled={!result.batchId}
                  >
                    👁 Preview receipts
                  </Button>
                </div>

                <p className="mt-3 text-center text-[11px] font-medium text-ink-500">
                  {Number(result.volume ?? 0).toLocaleString()} receipts · one
                  full A4 page each
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════
            RECEIPT PREVIEW
        ═══════════════════════════════════════════════════ */}
        {showPreview && receiptItems.length > 0 && selectedProduct && (
          <div className="rounded-2xl border border-surface-border bg-white/[.015] p-6">
            <div className="mb-4 flex items-center justify-between print:hidden">
              <div>
                <h3 className="text-[14px] font-bold text-white">
                  Receipt preview
                </h3>
                <p className="mt-0.5 text-[11px] font-medium text-ink-500">
                  Click Print → choose "Save as PDF" or send to a printer
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="rounded-lg bg-white/[.06] px-3 py-2 text-[11.5px] font-black text-white ring-1 ring-inset ring-white/15 transition hover:bg-white/[.12]"
              >
                Close preview
              </button>
            </div>

            <ReceiptSheet
              productTitle={selectedProduct.title}
              unitPrice={selectedProduct.price}
              items={receiptItems}
              cashbackAmount={100}
              batchLabel={result?.batchId?.slice(0, 8)}
            />
          </div>
        )}
      </div>
    </>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-[11.5px] font-bold uppercase tracking-wider text-ink-500">
        {label}
      </dt>
      <dd
        className={`max-w-[60%] break-all text-right text-[12.5px] font-semibold text-white ${
          mono ? 'font-mono' : ''
        }`}
      >
        {value || '—'}
      </dd>
    </div>
  );
}
