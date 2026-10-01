import { useCallback, useEffect, useMemo, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ChatThreadPane } from '@/components/chats/ChatThreadPane';
import { listThreads } from '@/services/chat.service';
import type { AdminChatThread, ChatStatus } from '@/types';
import { formatRelative, getInitials } from '@/utils/format';
import { useDebounce } from '@/hooks/useDebounce';
import { ApiClientError } from '@/services/api';
import { toast } from '@/hooks/useToast';

const FILTERS: Array<{ key: 'all' | ChatStatus; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'awaiting_admin', label: 'Awaiting you' },
  { key: 'awaiting_customer', label: 'Awaiting customer' },
  { key: 'closed', label: 'Closed' },
];

export default function ChatsPage() {
  const [threads, setThreads] = useState<AdminChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AdminChatThread | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | ChatStatus>('all');

  const debouncedSearch = useDebounce(search, 300);

  /* ─── Load threads ──────────────────────────────────────── */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listThreads({ perPage: 200 });
      const items = Array.isArray(res.items) ? res.items : [];
      setThreads(items);
      // Auto-select first thread on initial load
      setSelected((prev) => {
        if (prev) {
          const stillExists = items.find((t) => t.id === prev.id);
          return stillExists ?? items[0] ?? null;
        }
        return items[0] ?? null;
      });
    } catch (e) {
      toast.error((e as ApiClientError).message);
      setThreads([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /* ─── Filter + search ───────────────────────────────────── */
  const visible = useMemo(() => {
    let list = threads;
    if (filter !== 'all') {
      list = list.filter((t) => t.status === filter);
    }
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(
        (t) =>
          t.subject.toLowerCase().includes(q) ||
          t.customer.fullName.toLowerCase().includes(q) ||
          t.customer.email.toLowerCase().includes(q)
      );
    }
    return list;
  }, [threads, filter, debouncedSearch]);

  /* ─── Counts for filter chips ───────────────────────────── */
  const counts = useMemo(
    () => ({
      all: threads.length,
      awaiting_admin: threads.filter((t) => t.status === 'awaiting_admin').length,
      awaiting_customer: threads.filter((t) => t.status === 'awaiting_customer').length,
      closed: threads.filter((t) => t.status === 'closed').length,
    }),
    [threads]
  );

  /* ─── Thread updated callback ───────────────────────────── */
  const handleThreadUpdated = (updated: AdminChatThread) => {
    setThreads((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    if (selected?.id === updated.id) setSelected(updated);
  };

  return (
    <>
      <Header
        title="Chat Inbox"
        subtitle="Support conversations with customers"
        actions={
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            ↻ Refresh
          </Button>
        }
      />

      <div className="flex flex-1 gap-4 overflow-hidden p-6">
        {/* ─── LEFT: Thread list ──────────────────────── */}
        <div className="flex w-[360px] flex-shrink-0 flex-col rounded-2xl border border-surface-border bg-white/[.015]">
          {/* Search */}
          <div className="border-b border-surface-border p-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search threads or customers…"
              className="w-full rounded-xl border-0 bg-white/[.04] px-3.5 py-2.5 text-[12.5px] font-semibold text-white outline-none ring-1 ring-inset ring-white/10 transition placeholder:text-ink-500 focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Filter chips */}
          <div className="flex flex-wrap gap-1.5 border-b border-surface-border px-3 py-2.5">
            {FILTERS.map((f) => {
              const isActive = filter === f.key;
              const n = (counts as Record<string, number>)[f.key] ?? 0;
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`rounded-lg px-2.5 py-1.5 text-[11px] font-black uppercase tracking-wider transition ${
                    isActive
                      ? 'bg-brand-500/15 text-brand-300 ring-1 ring-inset ring-brand-400/30'
                      : 'text-ink-500 hover:bg-white/[.04] hover:text-white'
                  }`}
                >
                  {f.label} · {n}
                </button>
              );
            })}
          </div>

          {/* Thread list */}
          <div className="flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="flex justify-center py-10">
                <Spinner size={20} className="!border-white/15 !border-t-brand-400" />
              </div>
            ) : visible.length === 0 ? (
              <EmptyState
                icon="💬"
                title={filter === 'all' ? 'No conversations' : 'Nothing here'}
                hint={
                  filter === 'all'
                    ? 'Customer messages will appear here.'
                    : 'Try a different filter.'
                }
              />
            ) : (
              <div className="space-y-1">
                {visible.map((t) => (
                  <ThreadRow
                    key={t.id}
                    thread={t}
                    isActive={selected?.id === t.id}
                    onClick={() => setSelected(t)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── RIGHT: Thread detail ────────────────────── */}
        <div className="flex flex-1 overflow-hidden rounded-2xl border border-surface-border bg-white/[.015]">
          <ChatThreadPane
            thread={selected}
            onThreadUpdated={handleThreadUpdated}
          />
        </div>
      </div>
    </>
  );
}

/* ─── Thread row ─────────────────────────────────────────── */
function ThreadRow({
  thread,
  isActive,
  onClick,
}: {
  thread: AdminChatThread;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-lg px-3 py-3 text-left transition ${
        isActive
          ? 'bg-brand-500/10 ring-1 ring-inset ring-brand-400/25'
          : 'hover:bg-white/[.03]'
      }`}
    >
      <div className="flex items-start gap-2.5">
        <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg bg-gradient-to-br from-violet-400 to-violet-600 text-[10px] font-black text-white">
          {getInitials(thread.customer.fullName)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-[12.5px] font-bold text-white">
              {thread.customer.fullName}
            </span>
            <StatusDot status={thread.status} />
          </div>
          <p className="mt-0.5 truncate text-[12px] font-semibold text-ink-300">
            {thread.subject}
          </p>
          <p className="mt-1 text-[10.5px] font-medium text-ink-500">
            {formatRelative(thread.lastMessageAt)}
          </p>
        </div>
      </div>
    </button>
  );
}

function StatusDot({ status }: { status: ChatStatus }) {
  const config: Record<ChatStatus, { color: string; label: string }> = {
    open: { color: 'bg-emerald-400', label: 'Open' },
    awaiting_admin: { color: 'bg-amber-400', label: 'Awaiting you' },
    awaiting_customer: { color: 'bg-sky-400', label: 'Awaiting them' },
    closed: { color: 'bg-ink-500', label: 'Closed' },
  };
  const c = config[status] ?? config.open;
  return (
    <span
      className={`h-2 w-2 flex-shrink-0 rounded-full ${c.color}`}
      title={c.label}
    />
  );
}
