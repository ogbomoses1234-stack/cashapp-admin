import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getPackage,
  replyToPackage,
  resolveEditRequest,
  setPackageQuote,
  setPackageStatus,
} from '@/services/package.service';
import type {
  AdminPackage,
  AdminPackageMessage,
  PackageStatus,
} from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Header } from '@/components/layout/Header';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EditRequestCard } from '@/components/packages/EditRequestCard';
import { QuoteModal } from '@/components/packages/QuoteModal';
import {
  formatNaira,
  formatRelative,
  formatDateTime,
  getInitials,
} from '@/utils/format';
import { toast } from '@/hooks/useToast';
import { ApiClientError } from '@/services/api';

const STATUS_META: Record<
  PackageStatus,
  { label: string; tone: 'slate' | 'blue' | 'violet' | 'green' | 'amber' | 'rose' }
> = {
  draft:       { label: 'Draft',       tone: 'slate' },
  submitted:   { label: 'Submitted',   tone: 'blue' },
  quoted:      { label: 'Quoted',      tone: 'violet' },
  approved:    { label: 'Approved',    tone: 'green' },
  in_progress: { label: 'In progress', tone: 'amber' },
  shipped:     { label: 'Shipped',     tone: 'blue' },
  delivered:   { label: 'Delivered',   tone: 'green' },
  cancelled:   { label: 'Cancelled',   tone: 'rose' },
};

const NEXT_STATUSES: Array<{
  value: Exclude<PackageStatus, 'draft'>;
  label: string;
}> = [
  { value: 'quoted', label: 'Quoted' },
  { value: 'approved', label: 'Approved' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
];

export default function PackageDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [pkg, setPkg] = useState<AdminPackage | null>(null);
  const [loading, setLoading] = useState(true);

  /* Chat */
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  /* Actions */
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [savingQuote, setSavingQuote] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [resolvingEdit, setResolvingEdit] = useState(false);

  /* ─── Load ─────────────────────────────────────── */
  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getPackage(id);
      setPkg(data);
    } catch (e) {
      toast.error((e as ApiClientError).message);
      setPkg(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  /* Auto-scroll chat */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [pkg?.messages?.length]);

  const suggestedTotal = useMemo(() => {
    if (!pkg) return 0;
    return pkg.items.reduce((sum, i) => {
      const p = parseFloat(i.estimatedPrice ?? '0');
      return sum + (isFinite(p) ? p * i.quantity : 0);
    }, 0);
  }, [pkg]);

  /* ─── Send chat ────────────────────────────────── */
  const handleSend = async () => {
    if (!id || !text.trim() || sending) return;
    const body = text.trim();
    setText('');
    setSending(true);

    const optimistic: AdminPackageMessage = {
      id: `temp-${Date.now()}`,
      requestId: id,
      senderId: 'me',
      senderRole: 'admin',
      body,
      attachmentObjectKey: null,
      createdAt: new Date().toISOString(),
    };
    setPkg((p) =>
      p ? { ...p, messages: [...(p.messages ?? []), optimistic] } : p
    );

    try {
      const real = await replyToPackage(id, body);
      setPkg((p) =>
        p
          ? {
              ...p,
              messages: (p.messages ?? []).map((m) =>
                m.id === optimistic.id ? real : m
              ),
            }
          : p
      );
    } catch (e) {
      setPkg((p) =>
        p
          ? {
              ...p,
              messages: (p.messages ?? []).filter(
                (m) => m.id !== optimistic.id
              ),
            }
          : p
      );
      setText(body);
      toast.error((e as ApiClientError).message);
    } finally {
      setSending(false);
    }
  };

  /* ─── Set status ───────────────────────────────── */
  const handleSetStatus = async (
    status: Exclude<PackageStatus, 'draft'>,
    reason?: string
  ) => {
    if (!id) return;
    setStatusBusy(true);
    try {
      const updated = await setPackageStatus(id, status, reason);
      setPkg((prev) => (prev ? { ...prev, ...updated } : updated));
      toast.success(`Status set to "${status}"`);
      load();
    } catch (e) {
      toast.error((e as ApiClientError).message);
    } finally {
      setStatusBusy(false);
    }
  };

  /* ─── Save quote ───────────────────────────────── */
  const handleSaveQuote = async (amount: string) => {
    if (!id) return;
    setSavingQuote(true);
    try {
      const updated = await setPackageQuote(id, amount);
      setPkg((prev) => (prev ? { ...prev, ...updated } : updated));
      toast.success('Quote sent');
      setQuoteOpen(false);
      load();
    } catch (e) {
      toast.error((e as ApiClientError).message);
    } finally {
      setSavingQuote(false);
    }
  };

  /* ─── Resolve edit request ────────────────────── */
  const handleResolveEdit = async (
    editId: string,
    status: 'approved' | 'denied',
    adminNote?: string
  ) => {
    if (!id) return;
    setResolvingEdit(true);
    try {
      await resolveEditRequest(id, editId, status, adminNote);
      toast.success(`Edit request ${status}`);
      load();
    } catch (e) {
      toast.error((e as ApiClientError).message);
    } finally {
      setResolvingEdit(false);
    }
  };

  /* ─── Loading / not found ─────────────────────── */
  if (loading) {
    return (
      <>
        <Header title="Loading…" />
        <div className="flex flex-1 items-center justify-center">
          <Spinner size={28} className="!border-white/15 !border-t-brand-400" />
        </div>
      </>
    );
  }

  if (!pkg) {
    return (
      <>
        <Header title="Not found" />
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          <p className="text-[13px] text-ink-400">
            This list no longer exists.
          </p>
          <Button variant="outline" onClick={() => navigate('/packages')}>
            Back to lists
          </Button>
        </div>
      </>
    );
  }

  const meta = STATUS_META[pkg.status] ?? STATUS_META.draft;
  const isClosed = pkg.status === 'delivered' || pkg.status === 'cancelled';
  const canSend = !isClosed && text.trim().length > 0 && !sending;

  return (
    <>
      <Header
        title={pkg.title}
        subtitle={`#${pkg.reference} · ${meta.label}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge tone={meta.tone}>{meta.label}</Badge>
            <Button variant="outline" size="sm" onClick={load}>
              Refresh
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* ═══════════════════════════════════════
              LEFT
          ═══════════════════════════════════════ */}
          <div className="min-w-0 space-y-5">
            {/* Action bar */}
            <div className="rounded-2xl border border-surface-border bg-white/[.015] p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-1 text-[10px] font-black uppercase tracking-wider text-ink-500">
                  Set status:
                </span>
                {NEXT_STATUSES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => handleSetStatus(s.value)}
                    disabled={statusBusy || isClosed}
                    className={`rounded-lg px-3 py-1.5 text-[11.5px] font-bold transition disabled:opacity-40 ${
                      pkg.status === s.value
                        ? 'bg-brand-500 text-[#04140d]'
                        : 'bg-white/[.04] text-ink-300 ring-1 ring-inset ring-white/10 hover:bg-white/[.08]'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
                <span className="mx-1 h-5 w-px bg-white/10" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuoteOpen(true)}
                  disabled={statusBusy || isClosed}
                >
                  💰 {pkg.quotedTotal ? 'Update quote' : 'Set quote'}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setCancelOpen(true)}
                  disabled={statusBusy || isClosed}
                >
                  Cancel list
                </Button>
              </div>

              {pkg.quotedTotal && (
                <div className="mt-4 flex items-center justify-between rounded-xl bg-brand-500/10 px-4 py-3 ring-1 ring-inset ring-brand-400/25">
                  <span className="text-[11px] font-black uppercase tracking-wider text-brand-300">
                    Current quote
                  </span>
                  <span className="text-[15px] font-black tabular-nums text-brand-200">
                    {formatNaira(pkg.quotedTotal)}
                  </span>
                </div>
              )}
            </div>

            {/* Customer */}
            {pkg.customer && (
              <div className="rounded-2xl border border-surface-border bg-white/[.015] p-4">
                <h3 className="mb-3 text-[10px] font-black uppercase tracking-wider text-ink-500">
                  Customer
                </h3>
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-400 to-violet-600 text-[12px] font-black text-white">
                    {getInitials(pkg.customer.fullName)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-bold text-white">
                      {pkg.customer.fullName}
                    </p>
                    <p className="truncate text-[11px] text-ink-500">
                      {pkg.customer.email}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Delivery */}
            <div className="rounded-2xl border border-surface-border bg-white/[.015] p-4">
              <h3 className="mb-3 text-[10px] font-black uppercase tracking-wider text-ink-500">
                Delivery details
              </h3>
              <p className="text-[13px] font-semibold text-white">
                {pkg.deliveryAddress}
              </p>
              <p className="mt-1 text-[11.5px] text-ink-400">
                {[pkg.city, pkg.country].filter(Boolean).join(', ')}
              </p>
              {pkg.contactPhone && (
                <p className="mt-1 text-[11.5px] text-ink-400">
                  📞 {pkg.contactPhone}
                </p>
              )}
              {pkg.notes && (
                <div className="mt-3 rounded-lg bg-white/[.04] p-3">
                  <p className="text-[10px] font-black uppercase tracking-wider text-ink-500">
                    Customer note
                  </p>
                  <p className="mt-1 text-[12px] text-ink-300">{pkg.notes}</p>
                </div>
              )}
            </div>

            {/* Items */}
            <div className="rounded-2xl border border-surface-border bg-white/[.015] p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-wider text-ink-500">
                  Items ({pkg.items.length})
                </h3>
                {suggestedTotal > 0 && (
                  <span className="text-[11px] font-semibold tabular-nums text-ink-400">
                    Est. {formatNaira(suggestedTotal)}
                  </span>
                )}
              </div>
              {pkg.items.length === 0 ? (
                <p className="text-center text-[12px] text-ink-500">
                  No items.
                </p>
              ) : (
                <div className="space-y-3">
                  {pkg.items.map((it) => (
                    <div
                      key={it.id}
                      className="flex items-start gap-3 rounded-xl bg-white/[.02] p-3"
                    >
                      {it.imageUrl ? (
                        <img
                          src={it.imageUrl}
                          alt={it.name}
                          className="h-14 w-14 flex-shrink-0 rounded-lg object-cover ring-1 ring-white/10"
                        />
                      ) : (
                        <span className="grid h-14 w-14 flex-shrink-0 place-items-center rounded-lg bg-violet-500/15 text-lg">
                          📦
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-bold text-white">
                          {it.name}
                        </p>
                        {it.details && (
                          <p className="mt-0.5 text-[11.5px] leading-snug text-ink-400">
                            {it.details}
                          </p>
                        )}
                        <div className="mt-1.5 flex items-center gap-2 text-[10.5px] font-semibold">
                          <span className="rounded bg-white/[.06] px-1.5 py-0.5 text-ink-300">
                            × {it.quantity}
                          </span>
                          {it.estimatedPrice && (
                            <span className="tabular-nums text-ink-500">
                              ~{formatNaira(it.estimatedPrice)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pending edit request */}
            {pkg.pendingEditRequest && (
              <div>
                <h3 className="mb-2 text-[10px] font-black uppercase tracking-wider text-amber-300">
                  ⏳ Pending edit request
                </h3>
                <EditRequestCard
                  edit={pkg.pendingEditRequest}
                  busy={resolvingEdit}
                  onResolve={(status, note) =>
                    handleResolveEdit(pkg.pendingEditRequest!.id, status, note)
                  }
                />
              </div>
            )}

            {/* Edit history */}
            {pkg.allEditRequests && pkg.allEditRequests.length > 0 && (
              <div>
                <h3 className="mb-2 text-[10px] font-black uppercase tracking-wider text-ink-500">
                  Edit request history
                </h3>
                <div className="space-y-3">
                  {pkg.allEditRequests
                    .filter((e) => e.status !== 'pending')
                    .map((e) => (
                      <EditRequestCard
                        key={e.id}
                        edit={e}
                        onResolve={() => {}}
                        actionable={false}
                      />
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════
              RIGHT — chat
          ═══════════════════════════════════════ */}
          <aside className="min-w-0">
            <div className="sticky top-5 flex h-[calc(100vh-140px)] flex-col overflow-hidden rounded-2xl border border-surface-border bg-white/[.015]">
              <div className="border-b border-surface-border px-4 py-3">
                <h3 className="text-[10px] font-black uppercase tracking-wider text-ink-500">
                  Conversation
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4">
                {(pkg.messages?.length ?? 0) === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <span className="mb-2 text-3xl opacity-30">💬</span>
                    <p className="text-[11.5px] text-ink-500">
                      No messages yet — greet the customer
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(pkg.messages ?? []).map((m) => {
                      const isAdmin = m.senderRole === 'admin';
                      const isSystem = m.senderId === 'system';
                      return (
                        <div
                          key={m.id}
                          className={`flex ${
                            isAdmin ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-[85%] rounded-xl px-3.5 py-2.5 ${
                              isSystem
                                ? 'bg-amber-500/10 ring-1 ring-inset ring-amber-400/20'
                                : isAdmin
                                  ? 'bg-brand-500/15 ring-1 ring-inset ring-brand-400/25'
                                  : 'bg-white/[.05] ring-1 ring-inset ring-white/10'
                            }`}
                          >
                            <div className="mb-1 flex items-center gap-2">
                              <span
                                className={`text-[9.5px] font-black uppercase tracking-wider ${
                                  isSystem
                                    ? 'text-amber-300'
                                    : isAdmin
                                      ? 'text-brand-300'
                                      : 'text-ink-400'
                                }`}
                              >
                                {isSystem
                                  ? 'System'
                                  : isAdmin
                                    ? 'You'
                                    : pkg.customer?.fullName ?? 'Customer'}
                              </span>
                              <span
                                className="text-[9.5px] text-ink-500"
                                title={formatDateTime(m.createdAt)}
                              >
                                {formatRelative(m.createdAt)}
                              </span>
                            </div>
                            <p className="whitespace-pre-wrap text-[12.5px] leading-relaxed text-white">
                              {m.body}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={bottomRef} />
                  </div>
                )}
              </div>

              <div className="border-t border-surface-border p-3">
                {isClosed ? (
                  <div className="rounded-lg bg-white/[.04] py-2.5 text-center text-[11.5px] font-semibold text-ink-400">
                    List is closed
                  </div>
                ) : (
                  <div className="flex items-end gap-2">
                    <textarea
                      rows={1}
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (canSend) handleSend();
                        }
                      }}
                      placeholder="Type your reply…"
                      className="max-h-32 flex-1 resize-none rounded-xl border-0 bg-white/[.04] px-3.5 py-2.5 text-[12.5px] font-medium text-white outline-none ring-1 ring-inset ring-white/10 transition placeholder:text-ink-500 focus:ring-2 focus:ring-brand-500"
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSend}
                      disabled={!canSend}
                      loading={sending}
                    >
                      Send
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Modals */}
      <QuoteModal
        open={quoteOpen}
        initial={pkg.quotedTotal}
        suggestedTotal={suggestedTotal}
        onClose={() => setQuoteOpen(false)}
        onSave={handleSaveQuote}
        saving={savingQuote}
      />

      <ConfirmDialog
        open={cancelOpen}
        title="Cancel this list?"
        message={
          <div className="space-y-3">
            <p>The customer will be notified and the list is final.</p>
            <textarea
              rows={2}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason (required)"
              className="w-full resize-none rounded-xl border-0 bg-white/[.04] px-3.5 py-2.5 text-[12.5px] text-white outline-none ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-rose-500"
            />
          </div>
        }
        confirmLabel="Cancel list"
        danger
        onConfirm={() => {
          if (cancelReason.trim().length < 3) {
            toast.error('Provide a reason');
            return;
          }
          handleSetStatus('cancelled', cancelReason.trim());
        }}
        onClose={() => {
          setCancelOpen(false);
          setCancelReason('');
        }}
      />
    </>
  );
}