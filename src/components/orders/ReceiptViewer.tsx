import { useEffect, useState } from 'react';
import { getOrderReceiptUrl } from '@/services/order.service';
import { ApiClientError } from '@/services/api';

interface Props {
  orderId: string;
  receiptObjectKey: string | null;
}

export function ReceiptViewer({ orderId, receiptObjectKey }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [zoom, setZoom] = useState(1);

  /* ─── Fetch the signed URL whenever the order changes ─── */
  useEffect(() => {
    if (!receiptObjectKey) {
      setUrl(null);
      setError(null);
      return;
    }
    let alive = true;
    setLoading(true);
    setError(null);
    setUrl(null);
    setZoom(1);
    setExpanded(false);

    getOrderReceiptUrl(orderId)
      .then((res) => alive && setUrl(res.url))
      .catch((e) => alive && setError((e as ApiClientError).message ?? 'Could not load receipt'))
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, [orderId, receiptObjectKey]);

  /* ─── No receipt — POD order ──────────────────────────── */
  if (!receiptObjectKey) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-surface-border py-14 text-center">
        <span className="mb-2 text-3xl opacity-40">🧾</span>
        <p className="text-[12.5px] font-bold text-white">No receipt attached</p>
        <p className="mt-1 text-[11.5px] font-medium text-ink-500">
          Pay on Delivery — no image to review
        </p>
      </div>
    );
  }

  /* ─── Loading ─────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-surface-border bg-white/[.015] py-20">
        <div className="flex flex-col items-center gap-3">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/15 border-t-brand-400" />
          <p className="text-[11.5px] font-semibold text-ink-500">Loading receipt…</p>
        </div>
      </div>
    );
  }

  /* ─── Error ───────────────────────────────────────────── */
  if (error || !url) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-rose-400/25 bg-rose-500/5 py-14 text-center">
        <span className="mb-2 text-3xl">⚠️</span>
        <p className="text-[12.5px] font-bold text-rose-200">Could not load receipt</p>
        <p className="mt-1 max-w-[240px] text-[11px] font-medium text-rose-300/70">
          {error ?? 'Unknown error'}
        </p>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setUrl(null);
            setLoading(true);
            getOrderReceiptUrl(orderId)
              .then((res) => setUrl(res.url))
              .catch((e) => setError((e as ApiClientError).message ?? 'Could not load receipt'))
              .finally(() => setLoading(false));
          }}
          className="mt-4 rounded-lg bg-white/[.06] px-3 py-2 text-[11.5px] font-black text-white ring-1 ring-inset ring-white/15 transition hover:bg-white/[.12]"
        >
          Retry
        </button>
      </div>
    );
  }

  const isImage = /\.(jpe?g|png|webp|gif)$/i.test(receiptObjectKey);
  const isPdf = /\.pdf$/i.test(receiptObjectKey);
  const fileName = receiptObjectKey.split('/').pop() ?? 'receipt';

  return (
    <>
      <div className="flex h-full flex-col">
        {/* ─── Header ──────────────────────────────────── */}
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[11.5px] font-black uppercase tracking-wider text-ink-500">
              Uploaded receipt
            </p>
            <p className="mt-0.5 truncate font-mono text-[10.5px] text-ink-600">
              {fileName}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            {isImage && (
              <>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                  className="grid h-7 w-7 place-items-center rounded-lg bg-white/[.06] text-base font-black text-white ring-1 ring-inset ring-white/15 transition hover:bg-white/[.12]"
                  title="Zoom in"
                >
                  ＋
                </button>
                {zoom > 1 && (
                  <button
                    type="button"
                    onClick={() => setZoom(1)}
                    className="grid h-7 w-7 place-items-center rounded-lg bg-white/[.06] text-base font-black text-white ring-1 ring-inset ring-white/15 transition hover:bg-white/[.12]"
                    title="Reset zoom"
                  >
                    ↺
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setExpanded(true)}
                  className="grid h-7 w-7 place-items-center rounded-lg bg-white/[.06] text-base font-black text-white ring-1 ring-inset ring-white/15 transition hover:bg-white/[.12]"
                  title="Fullscreen"
                >
                  ⤢
                </button>
              </>
            )}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="grid h-7 w-7 place-items-center rounded-lg bg-white/[.06] text-base font-black text-white ring-1 ring-inset ring-white/15 transition hover:bg-white/[.12]"
              title="Open in new tab"
            >
              ↗
            </a>
          </div>
        </div>

        {/* ─── Receipt body ────────────────────────────── */}
        <div className="flex-1 overflow-hidden rounded-2xl border border-surface-border bg-[#0A0E17]">
          {isImage && (
            <div className="flex h-full items-center justify-center overflow-auto p-2">
              <img
                src={url}
                alt="Order receipt"
                style={{ transform: `scale(${zoom})` }}
                className="max-h-full max-w-full origin-center rounded-lg shadow-lg transition-transform duration-200"
                onError={() =>
                  setError('Image failed to load — check RustFS CORS or signed URL')
                }
              />
            </div>
          )}

          {isPdf && (
            <iframe
              src={url}
              title="Order receipt"
              className="h-full w-full"
            />
          )}

          {!isImage && !isPdf && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <span className="mb-2 text-3xl opacity-40">📄</span>
              <p className="text-[12.5px] font-bold text-white">{fileName}</p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 rounded-lg bg-brand-500/15 px-3 py-2 text-[11.5px] font-black text-brand-300 ring-1 ring-inset ring-brand-400/30 transition hover:bg-brand-500/25"
              >
                Download file
              </a>
            </div>
          )}
        </div>

        {/* ─── Hint ────────────────────────────────────── */}
        <p className="mt-2 text-center text-[10.5px] font-medium text-ink-600">
          {isImage && zoom === 1 && 'Tap ⤢ for fullscreen · ↗ to open in new tab'}
          {isImage && zoom > 1 && `Zoom: ${Math.round(zoom * 100)}%`}
          {isPdf && 'PDF preview'}
        </p>
      </div>

      {/* ─── Fullscreen overlay ──────────────────────────── */}
      {expanded && isImage && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm"
          onClick={() => setExpanded(false)}
        >
          <div className="absolute left-4 top-4 flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setZoom((z) => Math.max(1, z - 0.5));
              }}
              disabled={zoom <= 1}
              className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-lg font-black text-white transition hover:bg-white/20 disabled:opacity-30"
            >
              −
            </button>
            <span className="text-[12px] font-black text-white/70">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setZoom((z) => Math.min(3, z + 0.5));
              }}
              disabled={zoom >= 3}
              className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-lg font-black text-white transition hover:bg-white/20 disabled:opacity-30"
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-lg font-black text-white transition hover:bg-white/20"
            aria-label="Close"
          >
            ✕
          </button>

          <img
            src={url}
            alt="Order receipt (fullscreen)"
            onClick={(e) => e.stopPropagation()}
            style={{ transform: `scale(${zoom})` }}
            className="max-h-[90vh] max-w-[90vw] cursor-grab rounded-lg object-contain shadow-2xl transition-transform duration-200"
            draggable={false}
          />
        </div>
      )}
    </>
  );
}
