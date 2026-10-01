import { useCallback, useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { ReceiptViewer } from '@/components/orders/ReceiptViewer';
import { listOrders, approveOrder, flagOrder } from '@/services/order.service';
import type { AdminOrder } from '@/types';
import { formatNaira, formatDateTime, getInitials } from '@/utils/format';
import { ApiClientError } from '@/services/api';
import { toast } from '@/hooks/useToast';
import { RefreshButton } from '@/components/ui/RefreshButton';

export default function OrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AdminOrder | null>(null);
  const [flagTarget, setFlagTarget] = useState<AdminOrder | null>(null);
  const [flagReason, setFlagReason] = useState('');

  /* ─── Load ────────────────────────────────────────────── */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listOrders({ status: 'Processing', perPage: 100 });
      const items = Array.isArray(res.items) ? res.items : [];
      setOrders(items);
      setSelected((prev) => {
        if (prev) {
          const stillExists = items.find((o) => o.id === prev.id);
          return stillExists ?? items[0] ?? null;
        }
        return items[0] ?? null;
      });
    } catch (e) {
      toast.error((e as ApiClientError).message);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /* ─── Actions ─────────────────────────────────────────── */
  const handleApprove = async () => {
    if (!selected) return;
    try {
      const updated = await approveOrder(selected.id);
      toast.success('Order authorized — status set to Shipped');
      setOrders((prev) => prev.map((o) => (o.id === selected.id ? updated : o)));
      setSelected(updated);
    } catch (e) {
      toast.error((e as ApiClientError).message);
    }
  };

  const handleFlag = async () => {
    if (!flagTarget) return;
    if (flagReason.trim().length < 5) {
      toast.error('Enter a reason (min 5 chars)');
      return;
    }
    try {
      await flagOrder(flagTarget.id, flagReason.trim());
      toast.success('Order flagged — customer notified');
      setOrders((prev) => prev.filter((o) => o.id !== flagTarget.id));
      if (selected?.id === flagTarget.id) setSelected(null);
      setFlagTarget(null);
      setFlagReason('');
    } catch (e) {
      toast.error((e as ApiClientError).message);
    }
  };

  return (
    <>
      <Header
        title="Order Validation Desk"
        subtitle="Verify uploaded bank transfer receipts before fulfilment"
        actions={<RefreshButton onRefresh={load} label="Refresh orders" tone="dark" />}
      />

      <div className="flex flex-1 gap-4 overflow-hidden p-6">
        {/* ═══════════════════════════════════════════════
            LEFT — Pending orders queue
        ═══════════════════════════════════════════════ */}
        <div className="flex w-[340px] flex-shrink-0 flex-col rounded-2xl border border-surface-border bg-white/[.015]">
          <div className="border-b border-surface-border px-4 py-3">
            <h3 className="text-[12.5px] font-bold text-white">
              Pending transfer orders
            </h3>
            <p className="mt-0.5 text-[11px] font-semibold text-ink-500">
              {orders.length} awaiting review
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="flex justify-center py-10">
                <Spinner size={20} className="!border-white/15 !border-t-brand-400" />
              </div>
            ) : orders.length === 0 ? (
              <EmptyState
                icon="✅"
                title="All caught up"
                hint="No pending transfer orders."
              />
            ) : (
              <div className="space-y-1">
                {orders.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setSelected(o)}
                    className={`w-full rounded-lg px-3 py-2.5 text-left transition ${
                      selected?.id === o.id
                        ? 'bg-brand-500/10 ring-1 ring-inset ring-brand-400/25'
                        : 'hover:bg-white/[.03]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11.5px] font-bold text-white">
                        #{o.orderNumber}
                      </span>
                      <Badge tone="amber">Pending</Badge>
                    </div>
                    <p className="mt-1 truncate text-[12px] font-semibold text-ink-300">
                      {o.customer.fullName}
                    </p>
                    <p className="mt-0.5 text-[11px] font-black text-white">
                      {formatNaira(o.totalAmount)}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════
            RIGHT — Order detail + Receipt Viewer
        ═══════════════════════════════════════════════ */}
        <div className="flex flex-1 overflow-hidden rounded-2xl border border-surface-border bg-white/[.015]">
          {!selected ? (
            <div className="flex h-full w-full items-center justify-center">
              <EmptyState
                icon="🧾"
                title="Select an order"
                hint="Choose a pending order from the queue to review."
              />
            </div>
          ) : (
            <div className="flex h-full w-full flex-col">
              {/* ─── Detail header ─────────────────────── */}
              <div className="flex items-center justify-between border-b border-surface-border px-6 py-4">
                <div>
                  <h3 className="font-mono text-[14px] font-black text-white">
                    #{selected.orderNumber}
                  </h3>
                  <p className="mt-0.5 text-[11.5px] font-semibold text-ink-500">
                    Placed {formatDateTime(selected.createdAt)}
                  </p>
                </div>
                <Badge tone="amber">Awaiting verification</Badge>
              </div>

              {/* ─── Detail body ───────────────────────── */}
              <div className="grid flex-1 grid-cols-2 gap-6 overflow-y-auto p-6">
                {/* LEFT COLUMN — customer + items + payment */}
                <div className="space-y-5">
                  {/* Customer */}
                  <div>
                    <h4 className="mb-3 text-[11px] font-black uppercase tracking-wider text-ink-500">
                      Customer
                    </h4>

                    <div className="mb-3 flex items-center gap-3">
                      <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-400 to-violet-600 text-[11px] font-black text-white">
                        {getInitials(selected.customer.fullName)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-bold text-white">
                          {selected.customer.fullName}
                        </p>
                        <p className="truncate text-[11px] text-ink-500">
                          {selected.customer.email}
                        </p>
                      </div>
                    </div>

                    <dl className="space-y-2.5">
                      <Row label="Phone" value={selected.customer.phoneNumber ?? '—'} />
                      <Row label="Address" value={selected.customer.deliveryAddress} />
                    </dl>
                  </div>

                  {/* Items */}
                  <div>
                    <h4 className="mb-3 text-[11px] font-black uppercase tracking-wider text-ink-500">
                      Items
                    </h4>
                    <div className="space-y-2">
                      {selected.items.map((it) => (
                        <div
                          key={it.id}
                          className="flex items-center justify-between rounded-lg bg-white/[.03] px-3 py-2.5"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-[12.5px] font-bold text-white">
                              {it.productTitle}
                            </p>
                            <p className="text-[11px] text-ink-500">
                              Qty × {it.quantity}
                            </p>
                          </div>
                          <span className="ml-3 whitespace-nowrap text-[13px] font-black text-white">
                            {formatNaira(it.unitPrice)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="rounded-xl bg-white/[.03] p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-bold text-ink-400">
                        Total
                      </span>
                      <span className="text-[16px] font-black text-white">
                        {formatNaira(selected.totalAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Payment */}
                  <div>
                    <h4 className="mb-2 text-[11px] font-black uppercase tracking-wider text-ink-500">
                      Payment
                    </h4>
                    <p className="text-[12.5px] font-semibold text-white">
                      Bank Transfer
                    </p>
                    {selected.receiptObjectKey && (
                      <p className="mt-1 truncate font-mono text-[11px] text-ink-500">
                        {selected.receiptObjectKey.split('/').pop()}
                      </p>
                    )}
                  </div>
                </div>

                {/* RIGHT COLUMN — Receipt viewer */}
                <div className="flex flex-col">
                  <ReceiptViewer
                    orderId={selected.id}
                    receiptObjectKey={selected.receiptObjectKey}
                  />
                </div>
              </div>

              {/* ─── Footer actions ────────────────────── */}
              <div className="flex items-center justify-end gap-3 border-t border-surface-border px-6 py-4">
                <Button
                  variant="danger"
                  onClick={() => {
                    setFlagTarget(selected);
                    setFlagReason('');
                  }}
                >
                  ⚑ Flag / Reject
                </Button>
                <Button variant="primary" onClick={handleApprove}>
                  ✓ Authorize &amp; Pack
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          FLAG MODAL
      ═══════════════════════════════════════════════ */}
      <Modal
        open={!!flagTarget}
        onClose={() => setFlagTarget(null)}
        title="Flag transaction"
        subtitle="Halt fulfilment and notify the customer"
        footer={
          <>
            <Button variant="ghost" onClick={() => setFlagTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleFlag}>
              Flag order
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
            value={flagReason}
            onChange={(e) => setFlagReason(e.target.value)}
            placeholder="e.g. Receipt does not match the order amount"
            className="w-full rounded-xl border-0 bg-white/[.04] px-3.5 py-3 text-[13px] font-medium text-white outline-none ring-1 ring-inset ring-white/10 transition focus:ring-2 focus:ring-brand-500"
          />
        </label>
      </Modal>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   Detail row helper
═══════════════════════════════════════════════════════════ */
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-[11.5px] font-bold uppercase tracking-wider text-ink-500">
        {label}
      </dt>
      <dd className="max-w-[60%] text-right text-[12.5px] font-semibold text-white">
        {value}
      </dd>
    </div>
  );
}
