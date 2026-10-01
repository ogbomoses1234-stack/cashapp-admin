import { get, patch } from './api';
import type { AdminWithdrawal, Paginated, TrackerUser } from '@/types';
import { normalizeCustomer } from './order.service';

type Loose = Record<string, unknown>;

function str(v: unknown, fallback = ''): string {
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  return fallback;
}
function num(v: unknown, fallback = 0): number {
  if (typeof v === 'number' && isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = parseFloat(v);
    if (isFinite(n)) return n;
  }
  return fallback;
}

/* Nigerian bank codes → names (fallback map for when backend
   doesn't return bankName) */
const BANK_NAMES: Record<string, string> = {
  '044': 'Access Bank',
  '063': 'Access Bank (Diamond)',
  '035': 'ALAT by Wema',
  '035A': 'ALAT by Wema',
  '057': 'Zenith Bank',
  '058': 'GTBank',
  '011': 'First Bank',
  '033': 'UBA',
  '214': 'First City Monument Bank',
  '070': 'Fidelity Bank',
  '076': 'Polaris Bank',
  '082': 'Keystone Bank',
  '084': 'Enterprise Bank',
  '100': 'SunTrust Bank',
  '101': 'Providus Bank',
  '221': 'Stanbic IBTC',
  '232': 'Sterling Bank',
  '301': 'Jaiz Bank',
  '302': 'Wema Bank',
  '303': 'Union Bank',
  '304': 'Stanbic IBTC',
  '305': 'Paycom (OPay)',
  '307': 'Ecobank',
  '309': 'Fbn Mobile (Firstmonie)',
  '311': 'Parkway',
  '315': 'Gtb Mobile',
  '327': 'Paga',
  '328': 'Page MFBank',
  '329': 'Fortis Mobile',
  '332': 'Stanbic Mobile Money',
  '334': 'UBA Monaco',
  '336': 'Zenith Mobile',
  '340': 'Access Mobile',
  '501': 'FSDH Merchant Bank',
  '502': 'Rand Merchant Bank',
  '503': 'Standard Chartered',
  '504': 'Sterling Bank',
  '505': 'SunTrust Bank',
  '508': 'Heritage Bank',
  '512': 'Fidelity Bank',
  '513': 'Keystone Bank',
  '514': 'Union Bank',
  '526': 'Parallex Bank',
  '999991': 'Moniepoint MFB',
  '999992': 'OPay Digital',
  '100033': 'PalmPay',
};

function normalizeWithdrawal(input: unknown, index = 0): AdminWithdrawal {
  const r = (input ?? {}) as Loose;
  const customerSource = r.customer ?? r.user ?? r.buyer ?? r;

  const rawStatus = str(r.status ?? 'pending').toLowerCase();

  /* Bank name — try every key, then fall back to the code map */
  const bankCode = str(r.bankCode ?? r.bank_code ?? r.bank ?? '');
  const bankName =
    str(
      r.bankName ??
        r.bank_name ??
        r.bankLabel ??
        r.bank_label ??
        ''
    ) ||
    BANK_NAMES[bankCode] ||
    (bankCode ? `Bank (${bankCode})` : '—');

  return {
    id: str(r.id ?? r._id ?? `wd-${index}`),
    customer: normalizeCustomer(customerSource),
    amount: str(r.amount ?? 0),
    bankCode,
    bankName,
    accountNumber: str(
      r.accountNumber ?? r.account_number ?? r.account ?? ''
    ),
    accountName: str(r.accountName ?? r.account_name ?? '—'),
    status: (rawStatus as AdminWithdrawal['status']) ?? 'pending',
    declineReason: (r.declineReason ?? r.decline_reason ?? null) as
      | string
      | null,
    createdAt: str(r.createdAt ?? r.created_at ?? new Date().toISOString()),
    processedAt: (r.processedAt ?? r.processed_at ?? null) as string | null,
    processedBy: (r.processedBy ?? r.processed_by ?? null) as string | null,
  };
}

export async function listWithdrawals(
  params: { status?: string; page?: number; perPage?: number } = {}
): Promise<Paginated<AdminWithdrawal>> {
  const data = await get<unknown>(
    '/api/admin/withdrawals',
    params as Record<string, unknown>
  );

  if (Array.isArray(data)) {
    const items = (data as Loose[]).map((r, i) => normalizeWithdrawal(r, i));
    return {
      items,
      page: 1,
      perPage: items.length,
      total: items.length,
      totalPages: 1,
    };
  }

  const obj = (data ?? {}) as Loose;
  const rawList = (obj.items ?? obj.withdrawals ?? obj.data ?? []) as unknown;
  const items = Array.isArray(rawList)
    ? (rawList as Loose[]).map((r, i) => normalizeWithdrawal(r, i))
    : [];

  return {
    items,
    page: num(obj.page, 1),
    perPage: num(obj.perPage ?? obj.per_page, items.length),
    total: num(obj.total, items.length),
    totalPages: num(obj.totalPages ?? obj.total_pages, 1),
  };
}

export function approveWithdrawal(id: string) {
  return patch<unknown>(`/api/admin/withdrawals/${id}/approve`).then((data) => {
    const obj = (data ?? {}) as Loose;
    const raw = (obj.withdrawal ?? obj) as Loose;
    return normalizeWithdrawal(raw);
  });
}

export function declineWithdrawal(id: string, reason: string) {
  return patch<unknown>(`/api/admin/withdrawals/${id}/decline`, {
    reason,
  }).then((data) => {
    const obj = (data ?? {}) as Loose;
    const raw = (obj.withdrawal ?? obj) as Loose;
    return normalizeWithdrawal(raw);
  });
}

/* ═══════════════════════════════════════════════════════════
   Fetch a single withdrawal with its full cashback trail
═══════════════════════════════════════════════════════════ */
import type { WithdrawalDetail, WithdrawalSerialLink } from '@/types';

function normalizeTrackerUser(input: unknown): TrackerUser | null {
  if (!input || typeof input !== 'object') return null;
  const r = input as Record<string, unknown>;
  const id = String(r.id ?? '');
  const email = String(r.email ?? '');
  if (!id && !email) return null;
  return {
    id,
    fullName: String(r.fullName ?? r.full_name ?? r.name ?? '—'),
    email,
    phoneNumber: (r.phoneNumber ?? r.phone_number ?? null) as string | null,
  };
}

function normalizeLinkedSerial(input: unknown, index = 0): WithdrawalSerialLink {
  const r = (input ?? {}) as Record<string, unknown>;
  return {
    serialNumber: String(r.serialNumber ?? r.serial_number ?? `—${index}`),
    productTitle: (r.productTitle ?? r.product_title ?? undefined) as string | undefined,
    serialStatus: (r.serialStatus ?? r.serial_status ?? r.status ?? undefined) as string | undefined,
    creditedAt: String(r.creditedAt ?? r.credited_at ?? new Date().toISOString()),
    creditedAmount: String(r.creditedAmount ?? r.credited_amount ?? '0'),
    serialFound: Boolean(r.serialFound ?? r.serial_found ?? false),
    dispatchedBy: normalizeTrackerUser(r.dispatchedBy ?? r.dispatched_by ?? null),
    dispatchedAt: (r.dispatchedAt ?? r.dispatched_at ?? null) as string | null,
    redeemedBy: normalizeTrackerUser(r.redeemedBy ?? r.redeemed_by ?? null),
    redeemedAt: (r.redeemedAt ?? r.redeemed_at ?? null) as string | null,
    timeToRedeemSeconds: (r.timeToRedeemSeconds ?? r.time_to_redeem_seconds ?? null) as number | null,
  };
}

export async function getWithdrawalDetail(id: string): Promise<WithdrawalDetail> {
  const raw = await get<unknown>(`/api/admin/withdrawals/${id}`);
  const obj = (raw ?? {}) as Record<string, unknown>;

  /* Reuse the list normalizer for the base withdrawal shape */
  const base = normalizeWithdrawal(obj);

  const linkedRaw = (obj.linkedSerials ?? obj.linked_serials ?? []) as unknown;
  const linkedSerials = Array.isArray(linkedRaw)
    ? (linkedRaw as Record<string, unknown>[]).map((r, i) => normalizeLinkedSerial(r, i))
    : [];

  const summaryRaw = (obj.summary ?? {}) as Record<string, unknown>;

  return {
    ...base,
    linkedSerials,
    summary: {
      totalSerials: Number(summaryRaw.totalSerials ?? summaryRaw.total_serials ?? linkedSerials.length),
      withStaffDispatch: Number(
        summaryRaw.withStaffDispatch ?? summaryRaw.with_staff_dispatch ??
          linkedSerials.filter((s) => s.serialFound && s.dispatchedBy).length
      ),
      withoutStaffDispatch: Number(
        summaryRaw.withoutStaffDispatch ?? summaryRaw.without_staff_dispatch ??
          linkedSerials.filter((s) => s.serialFound && !s.dispatchedBy).length
      ),
      totalCredited: String(
        summaryRaw.totalCredited ?? summaryRaw.total_credited ??
          linkedSerials.reduce((sum, s) => sum + Number(s.creditedAmount || 0), 0).toFixed(2)
      ),
    },
  };
}
