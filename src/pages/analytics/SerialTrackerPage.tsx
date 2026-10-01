import { useCallback, useEffect, useMemo, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { RefreshButton } from '@/components/ui/RefreshButton';
import {
  listSerialTracker,
  getSerialDetail,
  type SerialTrackerDetail,
} from '@/services/serial.service';
import type { SerialTrackerRow, SerialTrackerStatus } from '@/types';
import { formatDateTime, formatRelative } from '@/utils/format';
import { useDebounce } from '@/hooks/useDebounce';
import { ApiClientError } from '@/services/api';
import { toast } from '@/hooks/useToast';

/* ═══════════════════════════════════════════════════════════
   Status metadata
═══════════════════════════════════════════════════════════ */
const STATUS_TONE: Record<
  SerialTrackerStatus,
  'green' | 'amber' | 'blue' | 'violet' | 'slate'
> = {
  Created: 'slate',
  Dispatched: 'violet',
  Redeemed: 'green',
  Disputed: 'amber',
};

const FILTERS: Array<{ key: 'all' | SerialTrackerStatus; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'Created', label: 'In warehouse' },
  { key: 'Dispatched', label: 'With sellers' },
  { key: 'Redeemed', label: 'Redeemed' },
  { key: 'Disputed', label: 'Disputed' },
];

/* ═══════════════════════════════════════════════════════════
   Page
═══════════════════════════════════════════════════════════ */
export default function SerialTrackerPage() {
  const [rows, setRows] = useState<SerialTrackerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | SerialTrackerStatus>('all');

  const [selected, setSelected] = useState<SerialTrackerRow | null>(null);
  const [detail, setDetail] = useState<SerialTrackerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const debouncedSearch = useDebounce(search, 350);

  /* ─── Load ─────────────────────────────────────────────── */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listSerialTracker({
        status: filter === 'all' ? undefined : filter,
        search: debouncedSearch || undefined,
        perPage: 200,
      });
      setRows(Array.isArray(res.items) ? res.items : []);
    } catch (e) {
      toast.error((e as ApiClientError).message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [filter, debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  /* ─── Load detail when row is opened ───────────────────── */
  useEffect(() => {
    if (!selected) {
      setDetail(null);
      return;
    }
    let alive = true;
    setDetailLoading(true);
    getSerialDetail(selected.serialNumber)
      .then((d) => alive && setDetail(d))
      .catch(() => alive && setDetail(null))
      .finally(() => alive && setDetailLoading(false));
    return () => {
      alive = false;
    };
  }, [selected]);

  /* ─── Stats ────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const total = rows.length;
    const redeemed = rows.filter((r) => r.status === 'Redeemed').length;
    const dispatched = rows.filter((r) => r.status === 'Dispatched').length;
    const disputed = rows.filter((r) => r.status === 'Disputed').length;
    return { total, redeemed, dispatched, disputed };
  }, [rows]);

  /* ─── Columns ──────────────────────────────────────────── */
  const columns: Column<SerialTrackerRow>[] = [
    {
      key: 'serial',
      header: 'Serial',
      render: (r) => (
        <button
          type="button"
          onClick={() => setSelected(r)}
          className="text-left"
        >
          <p className="font-mono text-[12.5px] font-black tracking-wider text-white">
            #{r.serialNumber}
          </p>
          <p className="mt-0.5 truncate text-[10.5px] font-semibold text-ink-500">
            {r.productTitle}
          </p>
        </button>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <Badge tone={STATUS_TONE[r.status] ?? 'slate'}>{r.status}</Badge>
      ),
    },
    {
      key: 'dispatched',
      header: 'Dispatched by',
      render: (r) =>
        r.dispatchedBy ? (
          <div className="min-w-0">
            <p className="truncate text-[12px] font-bold text-white">
              {r.dispatchedBy.fullName}
            </p>
            <p className="truncate text-[10.5px] font-semibold text-ink-500">
              {r.dispatchedAt ? formatRelative(r.dispatchedAt) : '—'}
            </p>
          </div>
        ) : (
          <span className="text-[11.5px] font-semibold text-ink-500">
            — No staff
          </span>
        ),
    },
    {
      key: 'redeemed',
      header: 'Redeemed by',
      render: (r) =>
        r.redeemedBy ? (
          <div className="min-w-0">
            <p className="truncate text-[12px] font-bold text-white">
              {r.redeemedBy.fullName}
            </p>
            <p className="truncate text-[10.5px] font-semibold text-ink-500">
              {r.redeemedAt ? formatRelative(r.redeemedAt) : '—'}
            </p>
          </div>
        ) : (
          <span className="text-[11.5px] font-semibold text-ink-500">
            — Not yet
          </span>
        ),
    },
    {
      key: 'time',
      header: 'Time to redeem',
      render: (r) => (
        <span className="text-[11.5px] font-semibold text-ink-400">
          {formatDuration(r.timeToRedeemSeconds)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) => (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setSelected(r);
          }}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <>
      <Header
        title="Serial Tracker"
        subtitle="Full audit trail of every QR scan across the network"
        actions={<RefreshButton onRefresh={load} label="Refresh tracker" tone="dark" />}
      />

      <div className="flex-1 overflow-y-auto p-6">
        {/* ═══════════════════════════════════════════════════
            STATS
        ═══════════════════════════════════════════════════ */}
        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Total serials" value={stats.total} tone="slate" />
          <StatTile label="With sellers" value={stats.dispatched} tone="violet" />
          <StatTile label="Redeemed" value={stats.redeemed} tone="green" />
          <StatTile label="Disputed" value={stats.disputed} tone="amber" />
        </div>

        {/* ═══════════════════════════════════════════════════
            FILTERS + SEARCH
        ═══════════════════════════════════════════════════ */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="relative max-w-md flex-1">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search serial, product, customer, or staff…"
              className="w-full rounded-xl border-0 bg-white/[.04] py-2.5 pl-10 pr-3.5 text-[13px] font-semibold text-white outline-none ring-1 ring-inset ring-white/10 transition placeholder:text-ink-500 focus:ring-2 focus:ring-brand-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Filter chips */}
        <div className="mb-5 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`rounded-lg px-3 py-2 text-[11.5px] font-black uppercase tracking-wider transition ${
                filter === f.key
                  ? 'bg-brand-500/15 text-brand-300 ring-1 ring-inset ring-brand-400/30'
                  : 'text-ink-500 hover:bg-white/[.04] hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════
            TABLE
        ═══════════════════════════════════════════════════ */}
        <DataTable
          columns={columns}
          rows={rows}
          keyField="serialNumber"
          loading={loading}
          emptyIcon="🔲"
          emptyTitle="No serials found"
          emptyHint="Generate a QR batch to start tracking scans."
        />
      </div>

      {/* ═══════════════════════════════════════════════════
          DETAIL MODAL
      ═══════════════════════════════════════════════════ */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `Serial #${selected.serialNumber}` : ''}
        subtitle={selected?.productTitle}
        maxWidth="max-w-2xl"
        footer={
          <Button variant="outline" onClick={() => setSelected(null)}>
            Close
          </Button>
        }
      >
        {detailLoading ? (
          <div className="flex justify-center py-10">
            <Spinner size={22} className="!border-white/15 !border-t-brand-400" />
          </div>
        ) : selected ? (
          <div className="space-y-5">
            {/* ─── Status banner ───────────────────────── */}
            <div className="flex items-center gap-3 rounded-xl border border-surface-border bg-white/[.02] p-4">
              <Badge tone={STATUS_TONE[selected.status] ?? 'slate'}>
                {selected.status}
              </Badge>
              <p className="text-[12px] font-semibold text-ink-400">
                {statusDescription(selected.status)}
              </p>
            </div>

            {/* ─── Dispatch info ───────────────────────── */}
            <div>
              <p className="mb-2 text-[10.5px] font-black uppercase tracking-wider text-ink-500">
                Dispatch — who took it for sale
              </p>
              {selected.dispatchedBy ? (
                <PersonCard
                  user={selected.dispatchedBy}
                  timestamp={selected.dispatchedAt}
                  roleLabel="Staff / Seller"
                  tone="violet"
                />
              ) : (
                <div className="rounded-xl border border-dashed border-surface-border bg-white/[.02] px-4 py-3">
                  <p className="text-[12.5px] font-bold text-ink-400">
                    No staff attached
                  </p>
                  <p className="mt-0.5 text-[11px] text-ink-500">
                    This serial was redeemed without going through a staff
                    dispatch scan (auto-dispatched in dev mode).
                  </p>
                </div>
              )}
            </div>

            {/* ─── Redemption info ─────────────────────── */}
            <div>
              <p className="mb-2 text-[10.5px] font-black uppercase tracking-wider text-ink-500">
                Redemption — who claimed the cashback
              </p>
              {selected.redeemedBy ? (
                <PersonCard
                  user={selected.redeemedBy}
                  timestamp={selected.redeemedAt}
                  roleLabel="Customer"
                  tone="green"
                />
              ) : (
                <div className="rounded-xl border border-dashed border-surface-border bg-white/[.02] px-4 py-3">
                  <p className="text-[12.5px] font-bold text-ink-400">
                    Not yet redeemed
                  </p>
                  <p className="mt-0.5 text-[11px] text-ink-500">
                    No customer has claimed this serial.
                  </p>
                </div>
              )}
            </div>

            {/* ─── Timing ──────────────────────────────── */}
            {selected.timeToRedeemSeconds !== null && (
              <div className="rounded-xl bg-brand-500/[.06] p-4 ring-1 ring-inset ring-brand-400/20">
                <p className="text-[10.5px] font-black uppercase tracking-wider text-brand-300">
                  Time from dispatch to redemption
                </p>
                <p className="mt-1 text-[18px] font-black tracking-tight text-white">
                  {formatDuration(selected.timeToRedeemSeconds)}
                </p>
              </div>
            )}

            {/* ─── Metadata ────────────────────────────── */}
            <div className="space-y-2 border-t border-surface-border pt-4">
              <DetailRow label="Serial number" value={`#${selected.serialNumber}`} mono />
              <DetailRow label="Product" value={selected.productTitle} />
              <DetailRow
                label="Created"
                value={formatDateTime(selected.createdAt)}
              />
              {selected.dispatchedAt && (
                <DetailRow
                  label="Dispatched at"
                  value={formatDateTime(selected.dispatchedAt)}
                />
              )}
              {selected.redeemedAt && (
                <DetailRow
                  label="Redeemed at"
                  value={formatDateTime(selected.redeemedAt)}
                />
              )}
              {selected.qrSignature && (
                <DetailRow
                  label="QR signature"
                  value={selected.qrSignature.slice(0, 24) + '…'}
                  mono
                />
              )}
            </div>

            {/* ─── Scan logs (if backend provided them) ── */}
            {detail?.scanLogs && detail.scanLogs.length > 0 && (
              <div className="border-t border-surface-border pt-4">
                <p className="mb-3 text-[10.5px] font-black uppercase tracking-wider text-ink-500">
                  Every scan on this serial
                </p>
                <div className="space-y-2">
                  {detail.scanLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 rounded-lg bg-white/[.03] p-3"
                    >
                      <span
                        className={`grid h-7 w-7 flex-shrink-0 place-items-center rounded-lg text-[11px] ${
                          log.scanType === 'staff_dispatch'
                            ? 'bg-violet-500/15 text-violet-300'
                            : 'bg-brand-500/15 text-brand-300'
                        }`}
                      >
                        {log.scanType === 'staff_dispatch' ? '📦' : '💰'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-bold text-white">
                          {log.scanType === 'staff_dispatch'
                            ? 'Staff dispatch scan'
                            : 'Customer redemption scan'}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-ink-500">
                          {log.scannedBy?.fullName ?? '—'} ·{' '}
                          {formatDateTime(log.scannedAt)}
                        </p>
                        {log.ipAddress && (
                          <p className="mt-0.5 font-mono text-[10px] text-ink-600">
                            IP · {log.ipAddress}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   Stat tile
═══════════════════════════════════════════════════════════ */
function StatTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'slate' | 'violet' | 'green' | 'amber';
}) {
  const colors: Record<typeof tone, string> = {
    slate: 'text-white',
    violet: 'text-violet-300',
    green: 'text-brand-300',
    amber: 'text-amber-300',
  };
  return (
    <div className="rounded-2xl border border-surface-border bg-white/[.02] p-4">
      <p className="text-[10.5px] font-black uppercase tracking-wider text-ink-500">
        {label}
      </p>
      <p className={`mt-1.5 text-[24px] font-black tracking-tight ${colors[tone]}`}>
        {value.toLocaleString()}
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Person card — the customer OR staff detail
═══════════════════════════════════════════════════════════ */
function PersonCard({
  user,
  timestamp,
  roleLabel,
  tone,
}: {
  user: { id: string; fullName: string; email: string; phoneNumber?: string | null };
  timestamp: string | null;
  roleLabel: string;
  tone: 'violet' | 'green';
}) {
  const toneClass =
    tone === 'violet'
      ? 'from-violet-400 to-violet-600'
      : 'from-brand-400 to-brand-600';

  const initials = user.fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className="flex items-center gap-3 rounded-xl border border-surface-border bg-white/[.02] p-3.5">
      <span
        className={`grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl bg-gradient-to-br ${toneClass} text-[12px] font-black text-[#04140d]`}
      >
        {initials || '?'}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[13px] font-black text-white">
            {user.fullName}
          </p>
          <span className="rounded-md bg-white/[.06] px-1.5 py-0.5 text-[9.5px] font-black uppercase tracking-wider text-ink-400">
            {roleLabel}
          </span>
        </div>
        <p className="mt-0.5 truncate text-[11.5px] text-ink-500">
          {user.email}
        </p>
        {user.phoneNumber && (
          <p className="mt-0.5 font-mono text-[11px] text-ink-500">
            {user.phoneNumber}
          </p>
        )}
        {timestamp && (
          <p className="mt-1 text-[10.5px] font-semibold text-ink-500">
            {formatDateTime(timestamp)} · {formatRelative(timestamp)}
          </p>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Detail row
═══════════════════════════════════════════════════════════ */
function DetailRow({
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
      <span className="text-[11.5px] font-bold uppercase tracking-wider text-ink-500">
        {label}
      </span>
      <span
        className={`max-w-[60%] break-all text-right text-[12px] font-semibold text-white ${
          mono ? 'font-mono' : ''
        }`}
      >
        {value || '—'}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Helpers
═══════════════════════════════════════════════════════════ */
function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return '—';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  if (seconds < 86400) {
    const h = Math.floor(seconds / 3600);
    const m = Math.round((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  }
  const d = Math.floor(seconds / 86400);
  const h = Math.round((seconds % 86400) / 3600);
  return `${d}d ${h}h`;
}

function statusDescription(status: SerialTrackerStatus): string {
  switch (status) {
    case 'Created':
      return 'Still in the warehouse — not yet taken out for sale';
    case 'Dispatched':
      return 'Scanned out by a seller — currently in the market';
    case 'Redeemed':
      return 'Claimed by a customer — the ₦100 cashback has been paid';
    case 'Disputed':
      return 'Flagged for review — awaiting investigation';
    default:
      return '';
  }
}
