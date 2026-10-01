import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { Header } from '@/components/layout/Header';
import { MetricTile } from '@/components/ui/MetricTile';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { getDashboardMetrics } from '@/services/dashboard.service';
import type { DashboardMetrics } from '@/types';
import { formatNaira, formatNairaShort, formatRelative } from '@/utils/format';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    getDashboardMetrics()
      .then((d) => alive && setData(d))
      .catch(() => alive && setError('Could not load dashboard metrics.'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return (
      <>
        <Header title="Dashboard" subtitle="Real-time overview of your network" />
        <div className="flex flex-1 items-center justify-center">
          <Spinner size={28} className="!border-white/15 !border-t-brand-400" />
        </div>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <Header title="Dashboard" subtitle="Real-time overview of your network" />
        <div className="flex flex-1 items-center justify-center p-6">
          <EmptyState
            icon="⚠️"
            title="Could not load dashboard"
            hint={error ?? 'Please try again shortly.'}
          />
        </div>
      </>
    );
  }

  // ─── Defensive reads ──────────────────────────────────
  const chartData = (data.redemptionChart ?? []).map((d) => ({
    date: (d.date ?? '').slice(5) || d.date || '—',
    amount: parseFloat(d.amount) || 0,
  }));

  const lifecycle = data.serialLifecycle ?? {
    created: 0,
    dispatched: 0,
    redeemed: 0,
    disputed: 0,
  };

  const activity = Array.isArray(data.recentActivity) ? data.recentActivity : [];

  return (
    <>
      <Header
        title="Dashboard"
        subtitle="Real-time overview of your network"
        actions={
          <span className="rounded-lg bg-brand-500/15 px-2.5 py-1 text-[10.5px] font-black text-brand-300 ring-1 ring-inset ring-brand-400/30">
            ● Live
          </span>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        {/* ─── Metric tiles ─────────────────────────────── */}
        <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricTile
            icon="💰"
            iconTone="green"
            value={formatNairaShort(data.totalCashbackRedeemed ?? '0')}
            label="Total Cashback Redeemed"
            delta={{ value: '▲ 12.4%', positive: true }}
          />
          <MetricTile
            icon="🏪"
            iconTone="violet"
            value={(data.activeSellers ?? 0).toLocaleString()}
            label="Active Sellers / Staff"
          />
          <MetricTile
            icon="⏳"
            iconTone="amber"
            value={(data.pendingWithdrawals ?? 0).toLocaleString()}
            label="Pending Cashout Claims"
            delta={{ value: 'Action needed', positive: false }}
          />
          <MetricTile
            icon="🧾"
            iconTone="sky"
            value={(data.pendingOrders ?? 0).toLocaleString()}
            label="Pending Order Transfers"
            delta={{ value: 'Awaiting review', positive: false }}
          />
        </div>

        {/* ─── Chart + lifecycle ────────────────────────── */}
        <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="rounded-2xl border border-surface-border bg-white/[.015] xl:col-span-2">
            <div className="flex items-center justify-between border-b border-surface-border px-5 py-4">
              <h3 className="text-[13.5px] font-bold text-white">
                Cashback Redemption Volume
              </h3>
              <span className="text-[11px] font-semibold text-ink-400">Last 7 days</span>
            </div>
            <div className="p-5">
              {chartData.length === 0 ? (
                <div className="flex h-[220px] items-center justify-center text-[12.5px] font-semibold text-ink-500">
                  No chart data yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData}>
                    <CartesianGrid stroke="rgba(255,255,255,.05)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => formatNairaShort(v)}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#0f1622',
                        border: '1px solid rgba(255,255,255,.1)',
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#fff',
                      }}
                      formatter={(v) => [formatNaira(v as number), 'Redeemed']}
                    />
                    <Bar dataKey="amount" radius={[6, 6, 0, 0]} fill="url(#brandGradient)" />
                    <defs>
                      <linearGradient id="brandGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#34d399" />
                        <stop offset="100%" stopColor="#059669" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-surface-border bg-white/[.015]">
            <div className="border-b border-surface-border px-5 py-4">
              <h3 className="text-[13.5px] font-bold text-white">
                Serial Lifecycle Snapshot
              </h3>
            </div>
            <div className="divide-y divide-white/[.04]">
              <Row label="Created (in warehouse)" value={(lifecycle.created ?? 0).toLocaleString()} />
              <Row label="Dispatched (with sellers)" value={(lifecycle.dispatched ?? 0).toLocaleString()} />
              <Row label="Redeemed (locked)" value={(lifecycle.redeemed ?? 0).toLocaleString()} tone="green" />
              <Row label="Disputed" value={(lifecycle.disputed ?? 0).toLocaleString()} tone="rose" />
            </div>
          </div>
        </div>

        {/* ─── Recent activity ──────────────────────────── */}
        <div className="overflow-hidden rounded-2xl border border-surface-border bg-white/[.015]">
          <div className="flex items-center justify-between border-b border-surface-border px-5 py-4">
            <h3 className="text-[13.5px] font-bold text-white">Recent Network Activity</h3>
            <span className="text-[11px] font-semibold text-ink-400">Auto-refreshing</span>
          </div>

          {activity.length === 0 ? (
            <div className="flex items-center justify-center py-14 text-[12.5px] font-semibold text-ink-500">
              No recent activity
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="border-b border-surface-border bg-white/[.02]">
                    {['Event', 'Actor', 'Reference', 'Time', 'Status'].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-wider text-ink-400"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activity.map((a) => (
                    <tr
                      key={a.id}
                      className="border-b border-surface-border/60 last:border-b-0 hover:bg-white/[.02]"
                    >
                      <td className="px-5 py-3.5 font-semibold text-white">{a.event}</td>
                      <td className="px-5 py-3.5 text-ink-300">
                        {a.actorName}
                        <span className="ml-2 text-[10.5px] text-ink-500">{a.actorRole}</span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[11.5px] text-ink-400">
                        {a.reference}
                      </td>
                      <td className="px-5 py-3.5 text-ink-400">
                        {formatRelative(a.createdAt)}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge
                          tone={
                            /redeemed|credited|dispatched/i.test(a.status)
                              ? 'green'
                              : 'amber'
                          }
                        >
                          {a.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'green' | 'rose';
}) {
  const color =
    tone === 'green' ? 'text-brand-300' : tone === 'rose' ? 'text-rose-300' : 'text-white';
  return (
    <div className="flex items-center justify-between px-5 py-3.5">
      <span className="text-[12.5px] font-semibold text-ink-400">{label}</span>
      <strong className={`text-[14px] font-black ${color}`}>{value}</strong>
    </div>
  );
}
