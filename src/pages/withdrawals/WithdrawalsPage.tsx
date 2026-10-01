import { useCallback, useEffect, useMemo, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { RefreshButton } from '@/components/ui/RefreshButton';
import { Spinner } from '@/components/ui/Spinner';
import {
  listWithdrawals,
  approveWithdrawal,
  declineWithdrawal,
  getWithdrawalDetail,
} from '@/services/withdrawal.service';
import type { AdminWithdrawal, WithdrawalDetail, WithdrawalSerialLink } from '@/types';
import {
  formatNaira,
  formatDate,
  formatDateTime,
  formatRelative,
  maskAccountNumber,
  getInitials,
} from '@/utils/format';
import { ApiClientError } from '@/services/api';
import { toast } from '@/hooks/useToast';

type FilterKey = 'pending' | 'approved' | 'declined' | 'all';

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'declined', label: 'Declined' },
  { key: 'all', label: 'All' },
];

export default function WithdrawalsPage() {
  const [rows, setRows] = useState<AdminWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>('pending');

  const [detail, setDetail] = useState<WithdrawalDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const [approveTarget, setApproveTarget] = useState<AdminWithdrawal | null>(null);
  const [declineTarget, setDeclineTarget] = useState<AdminWithdrawal | null>(null);
  const [declineReason, setDeclineReason] = useState('');

  /* ─── Load list ────────────────────────────────────────── */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listWithdrawals({
        status: filter === 'all' ? undefined : filter,
        perPage: 200,
      });
      setRows(Array.isArray(res.items) ? res.items : []);
    } catch (e) {
      toast.error((e as ApiClientError).message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  /* ─── Fetch detail when one is opened ──────────────────── */
  useEffect(() => {
    if (!detailId) {
      setDetail(null);
      return;
    }
    let alive = true;
    setDetailLoading(true);
    getWithdrawalDetail(detailId)
      .then((d) => alive && setDetail(d))
      .catch((e) => {
        if (alive) {
          toast.error((e as ApiClientError).message ?? 'Could not load detail');
          setDetail(null);
        }
      })
      .finally(() => alive && setDetailLoading(false));
    return () => {
      alive = false;
    };
  }, [detailId]);

  const stats = useMemo(() => {
    const pending = rows.filter((r) => r.status === 'pending');
    const pendingAmount = pending.reduce(
      (sum, r) => sum + Number(r.amount || 0),
      0
    );
    return {
      count: rows.length,
      pending: pending.length,
      pendingAmount: pendingAmount.toFixed(2),
    };
  }, [rows]);

  /* ─── Actions ──────────────────────────────────────────── */
  const handleApprove = async () => {
    if (!approveTarget) return;
    try {
      await approveWithdrawal(approveTarget.id);
      toast.success('Payout approved — funds released');
      setApproveTarget(null);
      setDetailId(null);
      load();
    } catch (e) {
      toast.error((e as ApiClientError).message);
    }
  };

  const handleDecline = async () => {
    if (!declineTarget) return;
    if (declineReason.trim().length < 5) {
      toast.error('Enter a reason (min 5 chars)');
      return;
    }
    try {
      await declineWithdrawal(declineTarget.id, declineReason.trim());
      toast.success('Payout declined — funds returned to wallet');
      setDeclineTarget(null);
      setDeclineReason('');
      setDetailId(null);
      load();
    } catch (e) {
      toast.error((e as ApiClientError).message);
    }
  };

  /* ─── Columns ──────────────────────────────────────────── */
  const columns: Column<AdminWithdrawal>[] = [
    {
      key: 'customer',
      header: 'Customer',
      render: (w) => (
        <button
          type="button"
          onClick={() => setDetailId(w.id)}
          className="flex items-center gap-3 text-left"
        >
          <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-[10px] font-black text-[#04140d]">
            {getInitials(w.customer.fullName)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[12.5px] font-bold text-white">
              {w.customer.fullName}
            </p>
            <p className="truncate text-[11px] text-ink-500">
              {w.customer.email}
            </p>
          </div>
        </button>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (w) => (
        <span className="text-[13.5px] font-black tracking-tight text-white">
          {formatNaira(w.amount)}
        </span>
      ),
    },
    {
      key: 'bank',
      header: 'Bank account',
      render: (w) => (
        <div className="min-w-0">
          <p className="truncate text-[12.5px] font-bold text-white">
            {w.bankName}
          </p>
          <p className="mt-0.5 truncate font-mono text-[11px] text-ink-500">
            {maskAccountNumber(w.accountNumber)} · {w.accountName}
          </p>
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Requested',
      render: (w) => (
        <span className="text-[12px] text-ink-400">
          {formatDate(w.createdAt)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (w) => (
        <Badge
          tone={
            w.status === 'approved'
              ? 'green'
              : w.status === 'declined'
                ? 'rose'
                : 'amber'
          }
        >
          {w.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (w) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setDetailId(w.id);
            }}
          >
            View
          </Button>
          {w.status === 'pending' && (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setApproveTarget(w);
                }}
              >
                Approve
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeclineTarget(w);
                  setDeclineReason('');
                }}
              >
                Decline
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <Header
        title="Withdrawal Settlements"
        subtitle="Approve or decline pending customer payout tickets"
        actions={<RefreshButton onRefresh={load} label="Refresh" tone="dark" />}
      />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Stats */}
        <div className="mb-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-surface-border bg-white/[.02] p-4">
            <p className="text-[10.5px] font-black uppercase tracking-wider text-ink-500">
              Pending requests
            </p>
            <p className="mt-1.5 text-[24px] font-black tracking-tight text-amber-300">
              {stats.pending}
            </p>
          </div>
          <div className="rounded-2xl border border-surface-border bg-white/[.02] p-4">
            <p className="text-[10.5px] font-black uppercase tracking-wider text-ink-500">
              Pending amount
            </p>
            <p className="mt-1.5 text-[24px] font-black tracking-tight text-white">
              {formatNaira(stats.pendingAmount)}
            </p>
          </div>
        </div>

        {/* Filters */}
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

        {/* Table */}
        <DataTable
          columns={columns}
          rows={rows}
          keyField="id"
          loading={loading}
          emptyIcon="✅"
          emptyTitle={
            filter === 'pending' ? 'All caught up' : 'No withdrawals found'
          }
          emptyHint={
            filter === 'pending'
              ? 'No pending payout requests to review.'
              : 'Try a different filter.'
          }
        />
      </div>

      {/* ═══════════════════════════════════════════════════
          DETAIL MODAL — the full cashback trail
      ═══════════════════════════════════════════════════ */}
      <Modal
        open={!!detailId}
        onClose={() => setDetailId(null)}
        title={detail ? `Withdrawal · ${formatNaira(detail.amount)}` : 'Loading…'}
        subtitle={detail?.customer.fullName}
        maxWidth="max-w-3xl"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDetailId(null)}>
              Close
            </Button>
            {detail?.status === 'pending' && (
              <>
                <Button
                  variant="danger"
                  onClick={() => {
                    setDeclineTarget(detail);
                    setDetailId(null);
                  }}
                >
                  Decline
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setApproveTarget(detail);
                    setDetailId(null);
                  }}
                >
                  Approve
                </Button>
              </>
            )}
          </>
        }
      >
        {detailLoading || !detail ? (
          <div className="flex justify-center py-16">
            <Spinner size={24} className="!border-white/15 !border-t-brand-400" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* ═══════════════════════════════════════════════
                TOP — Status banner
            ═══════════════════════════════════════════════ */}
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-surface-border bg-white/[.02] p-4">
              <Badge
                tone={
                  detail.status === 'approved'
                    ? 'green'
                    : detail.status === 'declined'
                      ? 'rose'
                      : 'amber'
                }
              >
                {detail.status}
              </Badge>
              <p className="text-[12px] font-semibold text-ink-400">
                Requested {formatDateTime(detail.createdAt)}
              </p>
              <span className="text-ink-600">·</span>
              <p className="text-[12px] font-semibold text-ink-400">
                {formatRelative(detail.createdAt)}
              </p>
            </div>

            {/* ═══════════════════════════════════════════════
                CUSTOMER + BANK
            ═══════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Customer */}
              <div>
                <p className="mb-2 text-[10.5px] font-black uppercase tracking-wider text-ink-500">
                  Customer
                </p>
                <div className="flex items-center gap-3 rounded-xl border border-surface-border bg-white/[.02] p-3.5">
                  <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-[11px] font-black text-[#04140d]">
                    {getInitials(detail.customer.fullName)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-black text-white">
                      {detail.customer.fullName}
                    </p>
                    <p className="mt-0.5 truncate text-[11.5px] text-ink-500">
                      {detail.customer.email}
                    </p>
                    {detail.customer.phoneNumber && (
                      <p className="mt-0.5 font-mono text-[11px] text-ink-500">
                        {detail.customer.phoneNumber}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Bank */}
              <div>
                <p className="mb-2 text-[10.5px] font-black uppercase tracking-wider text-ink-500">
                  Bank account
                </p>
                <div className="space-y-2 rounded-xl border border-surface-border bg-white/[.02] p-3.5">
                  <DetailRow label="Bank" value={detail.bankName} />
                  <DetailRow label="Number" value={detail.accountNumber} mono />
                  <DetailRow label="Name" value={detail.accountName} />
                </div>
              </div>
            </div>

            {/* ═══════════════════════════════════════════════
                AMOUNT
            ═══════════════════════════════════════════════ */}
            <div className="rounded-xl bg-brand-500/[.06] p-4 ring-1 ring-inset ring-brand-400/20">
              <p className="text-[10.5px] font-black uppercase tracking-wider text-brand-300">
                Amount requested
              </p>
              <p className="mt-1 text-[28px] font-black tracking-tight text-white">
                {formatNaira(detail.amount)}
              </p>
            </div>

            {/* ═══════════════════════════════════════════════
                SUMMARY — how many serials funded this
            ═══════════════════════════════════════════════ */}
            <div>
              <p className="mb-2 text-[10.5px] font-black uppercase tracking-wider text-ink-500">
                Cashback sources
              </p>

              <div className="grid grid-cols-3 gap-3">
                <SummaryTile
                  label="Total serials"
                  value={String(detail.summary.totalSerials)}
                />
                <SummaryTile
                  label="With staff scan"
                  value={String(detail.summary.withStaffDispatch)}
                  tone="green"
                />
                <SummaryTile
                  label="No staff scan"
                  value={String(detail.summary.withoutStaffDispatch)}
                  tone={detail.summary.withoutStaffDispatch > 0 ? 'amber' : 'slate'}
                />
              </div>
            </div>

            {/* ═══════════════════════════════════════════════
                LINKED SERIALS — the full trail
            ═══════════════════════════════════════════════ */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[10.5px] font-black uppercase tracking-wider text-ink-500">
                  Every serial that funded this withdrawal
                </p>
                <span className="text-[10.5px] font-bold text-ink-500">
                  {detail.linkedSerials.length} serials
                </span>
              </div>

              {detail.linkedSerials.length === 0 ? (
                <div className="rounded-xl border border-dashed border-surface-border bg-white/[.02] px-4 py-6 text-center">
                  <p className="text-[12.5px] font-bold text-ink-400">
                    No serials linked
                  </p>
                  <p className="mt-1 text-[11px] text-ink-500">
                    This withdrawal has no cashback credits attached — check
                    the transactions table.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {detail.linkedSerials.map((s) => (
                    <SerialTrailRow key={s.serialNumber} link={s} />
                  ))}
                </div>
              )}
            </div>

            {/* ═══════════════════════════════════════════════
                DECLINE REASON
            ═══════════════════════════════════════════════ */}
            {detail.status === 'declined' && detail.declineReason && (
              <div className="rounded-xl bg-rose-500/[.06] p-4 ring-1 ring-inset ring-rose-400/20">
                <p className="text-[10.5px] font-black uppercase tracking-wider text-rose-300">
                  Reason for decline
                </p>
                <p className="mt-1 text-[12.5px] font-medium text-rose-100">
                  {detail.declineReason}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Approve confirmation */}
      <ConfirmDialog
        open={!!approveTarget}
        onClose={() => setApproveTarget(null)}
        title="Confirm payout"
        confirmLabel="Approve & send"
        message={
          approveTarget ? (
            <div className="space-y-2">
              <p>
                Release{' '}
                <b className="text-white">
                  {formatNaira(approveTarget.amount)}
                </b>{' '}
                to <b className="text-white">{approveTarget.accountName}</b> at{' '}
                <b className="text-white">{approveTarget.bankName}</b>.
              </p>
              <p className="text-[12px] text-ink-500">
                This triggers an automated transfer via the payout gateway.
              </p>
            </div>
          ) : null
        }
        onConfirm={handleApprove}
      />

      {/* Decline modal */}
      <Modal
        open={!!declineTarget}
        onClose={() => setDeclineTarget(null)}
        title="Decline payout"
        subtitle="Funds are returned to the customer's wallet"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeclineTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDecline}>
              Confirm decline
            </Button>
          </>
        }
      >
        <label className="block">
          <span className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-ink-400">
            Reason
          </span>
          <textarea
            rows={3}
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            placeholder="e.g. Incorrect account information provided"
            className="w-full resize-vertical rounded-xl border-0 bg-white/[.04] px-3.5 py-3 text-[13px] font-medium text-white outline-none ring-1 ring-inset ring-white/10 transition placeholder:text-ink-500 focus:ring-2 focus:ring-brand-500"
          />
        </label>
      </Modal>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   Serial trail row — one serial's full journey
═══════════════════════════════════════════════════════════ */
function SerialTrailRow({ link }: { link: WithdrawalSerialLink }) {
  const hasStaff = !!link.dispatchedBy;
  const isOrphan = !link.serialFound;

  return (
    <div className="overflow-hidden rounded-xl border border-surface-border bg-white/[.02]">
      {/* ─── Header row ────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-border bg-white/[.01] px-3.5 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="font-mono text-[11.5px] font-black tracking-wider text-white">
            #{link.serialNumber}
          </span>
          {link.productTitle && (
            <span className="truncate text-[11.5px] font-semibold text-ink-500">
              {link.productTitle}
            </span>
          )}
        </div>

        {/* Status pill */}
        {isOrphan ? (
          <span className="rounded-md bg-rose-500/15 px-2 py-0.5 text-[9.5px] font-black uppercase tracking-wider text-rose-300 ring-1 ring-inset ring-rose-400/25">
            Serial not found
          </span>
        ) : hasStaff ? (
          <span className="rounded-md bg-brand-500/15 px-2 py-0.5 text-[9.5px] font-black uppercase tracking-wider text-brand-300 ring-1 ring-inset ring-brand-400/25">
            ✓ Staff scanned
          </span>
        ) : (
          <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[9.5px] font-black uppercase tracking-wider text-amber-300 ring-1 ring-inset ring-amber-400/25">
            ⚠ No staff scan
          </span>
        )}
      </div>

      {/* ─── Timeline ─────────────────────────────────── */}
      {!isOrphan && (
        <div className="space-y-3 p-3.5">
          {/* Step 1 — Staff dispatch */}
          <TimelineStep
            icon="📦"
            tone={hasStaff ? 'violet' : 'muted'}
            title={
              hasStaff
                ? `Taken for sale by ${link.dispatchedBy!.fullName}`
                : 'No staff dispatch scan'
            }
            subtitle={
              hasStaff
                ? `${link.dispatchedAt ? formatDateTime(link.dispatchedAt) : '—'}`
                : 'Serial was never scanned out by a seller'
            }
          />

          {/* Step 2 — Customer redeem */}
          <TimelineStep
            icon="💰"
            tone="green"
            title={`Redeemed by customer`}
            subtitle={`${formatDateTime(link.creditedAt)} · +${formatNaira(link.creditedAmount)}`}
          />

          {/* Step 3 — Duration */}
          {link.timeToRedeemSeconds !== null &&
            link.timeToRedeemSeconds !== undefined && (
              <div className="flex items-center gap-2 pl-8 text-[11px] font-semibold text-ink-500">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                Time from dispatch to redeem: <b className="text-white">{formatDuration(link.timeToRedeemSeconds)}</b>
              </div>
            )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Timeline step
═══════════════════════════════════════════════════════════ */
function TimelineStep({
  icon,
  tone,
  title,
  subtitle,
}: {
  icon: string;
  tone: 'violet' | 'green' | 'muted';
  title: string;
  subtitle: string;
}) {
  const toneClass = {
    violet: 'bg-violet-500/15 text-violet-300 ring-violet-400/25',
    green: 'bg-brand-500/15 text-brand-300 ring-brand-400/25',
    muted: 'bg-white/[.04] text-ink-500 ring-white/10',
  }[tone];

  return (
    <div className="flex items-start gap-3">
      <span
        className={`grid h-7 w-7 flex-shrink-0 place-items-center rounded-lg text-[11px] ring-1 ring-inset ${toneClass}`}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] font-bold text-white">{title}</p>
        <p className="mt-0.5 text-[11px] font-semibold text-ink-500">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Summary tile
═══════════════════════════════════════════════════════════ */
function SummaryTile({
  label,
  value,
  tone = 'slate',
}: {
  label: string;
  value: string;
  tone?: 'slate' | 'green' | 'amber';
}) {
  const colorClass = {
    slate: 'text-white',
    green: 'text-brand-300',
    amber: 'text-amber-300',
  }[tone];

  return (
    <div className="rounded-xl border border-surface-border bg-white/[.02] p-3">
      <p className="text-[10px] font-black uppercase tracking-wider text-ink-500">
        {label}
      </p>
      <p className={`mt-1 text-[20px] font-black tracking-tight ${colorClass}`}>
        {value}
      </p>
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
        className={`max-w-[60%] break-all text-right text-[12.5px] font-semibold text-white ${
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
function formatDuration(seconds: number | null | undefined): string {
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
