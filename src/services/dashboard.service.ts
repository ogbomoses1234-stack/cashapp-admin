import { get } from './api';
import type { DashboardMetrics } from '@/types';

type Loose = Record<string, unknown>;

/* ─── Type-safe coercion helpers ──────────────────────────── */
function num(v: unknown, fallback = 0): number {
  if (typeof v === 'number' && isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = parseFloat(v);
    if (isFinite(n)) return n;
  }
  return fallback;
}

function str(v: unknown, fallback = '0.00'): string {
  if (typeof v === 'string') return v;
  if (typeof v === 'number' && isFinite(v)) return v.toFixed(2);
  return fallback;
}

function pickNum(obj: Loose, keys: string[]): number {
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && v !== null) {
      const n = num(v, NaN);
      if (!isNaN(n)) return n;
    }
  }
  return 0;
}

function pickStr(obj: Loose, keys: string[], fallback = '0.00'): string {
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && v !== null) {
      const s = str(v, '');
      if (s) return s;
    }
  }
  return fallback;
}

/* ─── Normalize the whole dashboard payload ──────────────── */
function normalizeDashboard(input: unknown): DashboardMetrics {
  const raw = (input ?? {}) as Loose;

  const lifecycleRaw = (raw.serialLifecycle ??
    raw.serial_lifecycle ??
    raw.lifecycle ??
    {}) as Loose;

  const chartRaw =
    (raw.redemptionChart ?? raw.redemption_chart ?? raw.chart ?? []) as unknown;

  const activityRaw =
    (raw.recentActivity ?? raw.recent_activity ?? raw.activity ?? []) as unknown;

  return {
    totalCashbackRedeemed: pickStr(raw, [
      'totalCashbackRedeemed',
      'total_cashback_redeemed',
      'totalRedeemed',
      'total_redeemed',
      'cashbackRedeemed',
    ]),
    activeSellers: pickNum(raw, [
      'activeSellers',
      'active_sellers',
      'activeStaff',
      'active_staff',
      'sellers',
    ]),
    pendingWithdrawals: pickNum(raw, [
      'pendingWithdrawals',
      'pending_withdrawals',
      'pendingCashouts',
      'pending_cashouts',
    ]),
    pendingOrders: pickNum(raw, [
      'pendingOrders',
      'pending_orders',
      'pendingTransfers',
      'pending_transfers',
    ]),
    redemptionChart: Array.isArray(chartRaw)
      ? chartRaw.map((row) => {
          const r = row as Loose;
          return {
            date: String(r.date ?? r.day ?? r.label ?? ''),
            amount: str(r.amount ?? r.value ?? r.total ?? 0),
          };
        })
      : [],
    serialLifecycle: {
      created: pickNum(lifecycleRaw, [
        'created',
        'inWarehouse',
        'in_warehouse',
        'warehouse',
      ]),
      dispatched: pickNum(lifecycleRaw, [
        'dispatched',
        'withSellers',
        'with_sellers',
        'inMarket',
        'in_market',
      ]),
      redeemed: pickNum(lifecycleRaw, [
        'redeemed',
        'claimed',
        'locked',
      ]),
      disputed: pickNum(lifecycleRaw, [
        'disputed',
        'flagged',
      ]),
    },
    recentActivity: Array.isArray(activityRaw)
      ? activityRaw.map((row, i) => {
          const r = row as Loose;
          return {
            id: String(r.id ?? r._id ?? i),
            event: String(r.event ?? r.type ?? 'Event'),
            actorName: String(r.actorName ?? r.actor_name ?? r.actor ?? '—'),
            actorRole: String(r.actorRole ?? r.actor_role ?? r.role ?? '—'),
            reference: String(r.reference ?? r.serial ?? r.ref ?? '—'),
            status: String(r.status ?? r.result ?? '—'),
            createdAt: String(
              r.createdAt ?? r.created_at ?? new Date().toISOString()
            ),
          };
        })
      : [],
  };
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const data = await get<unknown>('/api/admin/dashboard/metrics');
  return normalizeDashboard(data);
}
