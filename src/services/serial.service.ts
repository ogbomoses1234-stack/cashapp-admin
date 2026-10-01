import { get, post } from './api';
import type { QrBatchResult, SerialRow } from '@/types';

type Loose = Record<string, unknown>;

/* ─── Coercion helpers ──────────────────────────────────── */
function str(v: unknown, fallback = ''): string {
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  return fallback;
}
function num(v: unknown, fallback = 0): number {
  if (typeof v === 'number' && isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = parseInt(v, 10);
    if (isFinite(n)) return n;
  }
  return fallback;
}

/* ─── Normalize QR batch result ─────────────────────────── */
function normalizeBatch(input: unknown): QrBatchResult {
  const r = (input ?? {}) as Loose;

  /* Some backends wrap in { batch: {...} }, some return flat */
  const batch = (r.batch ?? r) as Loose;

  return {
    batchId: str(
      batch.batchId ??
        batch.batch_id ??
        batch.id ??
        batch._id ??
        ''
    ),
    productId: str(
      batch.productId ??
        batch.product_id ??
        batch.product?.toString() ??
        ''
    ),
    productTitle: str(
      batch.productTitle ??
        batch.product_title ??
        batch.productName ??
        batch.product_name ??
        '—'
    ),
    qrSignature: (r.qrSignature ?? r.qr_signature ?? undefined) as string | undefined,
    volume: num(
      batch.volume ??
        batch.count ??
        batch.total ??
        batch.generated ??
        batch.size ??
        0
    ),
    archiveObjectKey: str(
      batch.archiveObjectKey ??
        batch.archive_object_key ??
        batch.zipKey ??
        batch.zip_key ??
        batch.archiveUrl ??
        ''
    ),
    createdAt: str(
      batch.createdAt ??
        batch.created_at ??
        new Date().toISOString()
    ),
  };
}

/* ─── Normalize serial row ──────────────────────────────── */
function normalizeSerial(input: unknown, index = 0): SerialRow {
  const r = (input ?? {}) as Loose;
  return {
    serialNumber: str(
      r.serialNumber ?? r.serial_number ?? r.serial ?? r.code ?? `—${index}`
    ),
    productTitle: str(
      r.productTitle ?? r.product_title ?? r.productName ?? '—'
    ),
    status: (r.status ?? 'Created') as SerialRow['status'],
    dispatchedBy: (r.dispatchedBy ?? r.dispatched_by ?? null) as string | null,
    redeemedBy: (r.redeemedBy ?? r.redeemed_by ?? null) as string | null,
    dispatchedAt: (r.dispatchedAt ?? r.dispatched_at ?? null) as string | null,
    redeemedAt: (r.redeemedAt ?? r.redeemed_at ?? null) as string | null,
  };
}

/* ─── Public API ────────────────────────────────────────── */

export async function generateQrBatch(input: {
  productId: string;
  volume: number;
}): Promise<QrBatchResult> {
  const data = await post<unknown>('/api/admin/serials/generate', input);
  return normalizeBatch(data);
}

export async function listBatch(batchId: string): Promise<SerialRow[]> {
  const data = await get<unknown>(`/api/admin/serials/batch/${batchId}`);

  const raw = Array.isArray(data)
    ? (data as Loose[])
    : (((data as Loose)?.items ?? (data as Loose)?.serials ?? []) as Loose[]);

  return raw.map((r, i) => normalizeSerial(r, i));
}

export async function getArchiveUrl(batchId: string): Promise<{
  url: string;
  expiresAt: string;
}> {
  const data = await get<unknown>(
    `/api/admin/serials/archive/${batchId}`
  );
  const r = (data ?? {}) as Loose;
  return {
    url: str(r.url ?? r.signedUrl ?? r.signed_url ?? ''),
    expiresAt: str(r.expiresAt ?? r.expires_at ?? ''),
  };
}

/* ═══════════════════════════════════════════════════════════
   SERIAL TRACKER — audit trail for QR scans
═══════════════════════════════════════════════════════════ */
import type { Paginated, SerialTrackerRow, TrackerUser } from '@/types';

function normalizeTrackerUser(input: unknown): TrackerUser | null {
  if (!input || typeof input !== 'object') return null;
  const r = input as Record<string, unknown>;
  const id = String(r.id ?? r._id ?? '');
  const email = String(r.email ?? '');
  if (!id && !email) return null;
  return {
    id,
    fullName: String(r.fullName ?? r.full_name ?? r.name ?? '—'),
    email,
    role: (r.role as TrackerUser['role']) ?? undefined,
    phoneNumber: (r.phoneNumber ?? r.phone_number ?? null) as string | null,
  };
}

function normalizeTrackerRow(input: unknown, index = 0): SerialTrackerRow {
  const r = (input ?? {}) as Record<string, unknown>;

  const dispatchedBy = normalizeTrackerUser(
    r.dispatchedBy ?? r.dispatched_by ?? r.staff ?? null
  );
  const redeemedBy = normalizeTrackerUser(
    r.redeemedBy ?? r.redeemed_by ?? r.customer ?? null
  );

  const dispatchedAt = (r.dispatchedAt ?? r.dispatched_at ?? null) as string | null;
  const redeemedAt = (r.redeemedAt ?? r.redeemed_at ?? null) as string | null;

  /* Compute timeToRedeem if both timestamps exist and backend didn't provide it */
  let timeToRedeem: number | null =
    typeof r.timeToRedeemSeconds === 'number'
      ? (r.timeToRedeemSeconds as number)
      : null;

  if (timeToRedeem === null && dispatchedAt && redeemedAt) {
    const diff =
      new Date(redeemedAt).getTime() - new Date(dispatchedAt).getTime();
    if (isFinite(diff) && diff >= 0) timeToRedeem = Math.round(diff / 1000);
  }

  return {
    serialNumber: String(
      r.serialNumber ?? r.serial_number ?? r.serial ?? `row-${index}`
    ),
    productId: (r.productId ?? r.product_id ?? null) as string | null,
    productTitle: String(
      r.productTitle ?? r.product_title ?? r.productName ?? '—'
    ),
    status: (r.status ?? 'Created') as SerialTrackerRow['status'],
    dispatchedBy,
    dispatchedAt,
    redeemedBy,
    redeemedAt,
    timeToRedeemSeconds: timeToRedeem,
    qrSignature: (r.qrSignature ?? r.qr_signature ?? null) as string | null,
    createdAt: String(
      r.createdAt ?? r.created_at ?? new Date().toISOString()
    ),
  };
}

export interface SerialTrackerFilters {
  status?: string;
  search?: string;
  dispatchedBy?: string;
  redeemedBy?: string;
  page?: number;
  perPage?: number;
}

export async function listSerialTracker(
  filters: SerialTrackerFilters = {}
): Promise<Paginated<SerialTrackerRow>> {
  const data = await get<unknown>(
    '/api/admin/serials/tracker',
    filters as Record<string, unknown>
  );

  if (Array.isArray(data)) {
    const items = (data as Record<string, unknown>[]).map((r, i) =>
      normalizeTrackerRow(r, i)
    );
    return {
      items,
      page: 1,
      perPage: items.length,
      total: items.length,
      totalPages: 1,
    };
  }

  const obj = (data ?? {}) as Record<string, unknown>;
  const rawList = (obj.items ?? obj.serials ?? obj.data ?? []) as unknown;
  const items = Array.isArray(rawList)
    ? (rawList as Record<string, unknown>[]).map((r, i) =>
        normalizeTrackerRow(r, i)
      )
    : [];

  return {
    items,
    page: Number(obj.page ?? 1),
    perPage: Number(obj.perPage ?? obj.per_page ?? items.length),
    total: Number(obj.total ?? items.length),
    totalPages: Number(obj.totalPages ?? obj.total_pages ?? 1),
  };
}

export interface SerialTrackerDetail extends SerialTrackerRow {
  /* Extra fields when fetching a single serial's full history */
  scanLogs?: Array<{
    id: string;
    scannedBy: TrackerUser | null;
    scanType: 'staff_dispatch' | 'customer_redeem';
    ipAddress: string | null;
    userAgent: string | null;
    scannedAt: string;
  }>;
}

export async function getSerialDetail(
  serialNumber: string
): Promise<SerialTrackerDetail> {
  const data = await get<unknown>(
    `/api/admin/serials/${encodeURIComponent(serialNumber)}`
  );
  const obj = (data ?? {}) as Record<string, unknown>;
  const base = normalizeTrackerRow(obj);

  /* Optional scan logs */
  const rawLogs = (obj.scanLogs ?? obj.scan_logs ?? []) as unknown;
  const scanLogs = Array.isArray(rawLogs)
    ? (rawLogs as Record<string, unknown>[]).map((l, i) => ({
        id: String(l.id ?? `log-${i}`),
        scannedBy: normalizeTrackerUser(l.scannedBy ?? l.scanned_by ?? null),
        scanType: (l.scanType ?? l.scan_type ?? 'customer_redeem') as
          | 'staff_dispatch'
          | 'customer_redeem',
        ipAddress: (l.ipAddress ?? l.ip_address ?? null) as string | null,
        userAgent: (l.userAgent ?? l.user_agent ?? null) as string | null,
        scannedAt: String(
          l.scannedAt ?? l.scanned_at ?? new Date().toISOString()
        ),
      }))
    : undefined;

  return { ...base, scanLogs };
}
