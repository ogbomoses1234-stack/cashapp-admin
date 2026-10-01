import { useEffect, useRef, useState } from 'react';
import type { AdminChatMessage, AdminChatThread } from '@/types';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import {
  getThreadMessages,
  reply as apiReply,
  closeThread,
  reopenThread,
} from '@/services/chat.service';
import { formatDateTime, formatRelative, getInitials } from '@/utils/format';
import { ApiClientError } from '@/services/api';
import { toast } from '@/hooks/useToast';

interface Props {
  thread: AdminChatThread | null;
  onThreadUpdated: (t: AdminChatThread) => void;
}

export function ChatThreadPane({ thread, onThreadUpdated }: Props) {
  const [messages, setMessages] = useState<AdminChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* ─── Load messages when thread changes ──────────────────── */
  useEffect(() => {
    if (!thread) {
      setMessages([]);
      return;
    }
    let alive = true;
    setLoading(true);
    getThreadMessages(thread.id)
      .then((res) => {
        if (!alive) return;
        setMessages(Array.isArray(res.messages) ? res.messages : []);
        // Sync thread status if backend returned a fresher copy
        if (res.thread && res.thread.status !== thread.status) {
          onThreadUpdated(res.thread);
        }
      })
      .catch((e) => {
        if (!alive) return;
        toast.error((e as ApiClientError).message);
        setMessages([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [thread?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ─── Auto-scroll to newest ──────────────────────────────── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, loading]);

  /* ─── Auto-grow textarea ─────────────────────────────────── */
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }, [text]);

  /* ─── Send message ───────────────────────────────────────── */
  const handleSend = async () => {
    if (!thread || !text.trim() || sending) return;
    const body = text.trim();

    // Optimistic append
    const optimistic: AdminChatMessage = {
      id: `temp-${Date.now()}`,
      senderId: 'me',
      senderRole: 'admin',
      body,
      attachmentObjectKey: null,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setText('');
    setSending(true);

    try {
      const real = await apiReply(thread.id, body);
      // Replace the optimistic entry with the server's version
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? real : m))
      );
      // Flip the thread status locally
      const nextStatus = thread.status === 'closed' ? 'closed' : 'awaiting_customer';
      if (nextStatus !== thread.status) {
        onThreadUpdated({ ...thread, status: nextStatus });
      }
    } catch (e) {
      // Roll back the optimistic append
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setText(body);
      toast.error((e as ApiClientError).message);
    } finally {
      setSending(false);
    }
  };

  /* ─── Close / reopen thread ──────────────────────────────── */
  const handleToggleClosed = async () => {
    if (!thread) return;
    setClosing(true);
    try {
      const updated =
        thread.status === 'closed'
          ? await reopenThread(thread.id)
          : await closeThread(thread.id);
      onThreadUpdated(updated);
      toast.success(
        thread.status === 'closed' ? 'Thread reopened' : 'Thread closed'
      );
    } catch (e) {
      toast.error((e as ApiClientError).message);
    } finally {
      setClosing(false);
    }
  };

  /* ─── Empty state — no thread selected ───────────────────── */
  if (!thread) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <span className="mb-3 text-5xl opacity-40">💬</span>
        <p className="text-[14px] font-bold text-white">Select a conversation</p>
        <p className="mt-1 max-w-xs text-[12px] font-medium text-ink-500">
          Click a thread on the left to view the messages and reply.
        </p>
      </div>
    );
  }

  const isClosed = thread.status === 'closed';
  const canSend = !isClosed && text.trim().length > 0 && !sending;

  return (
    <div className="flex h-full flex-col">
      {/* ─── Thread header ──────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 border-b border-surface-border px-6 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg bg-gradient-to-br from-violet-400 to-violet-600 text-[11px] font-black text-white">
            {getInitials(thread.customer.fullName)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13.5px] font-bold text-white">
              {thread.customer.fullName}
            </p>
            <p className="truncate text-[11.5px] font-medium text-ink-500">
              {thread.customer.email}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            tone={
              thread.status === 'closed'
                ? 'slate'
                : thread.status === 'awaiting_admin'
                  ? 'amber'
                  : thread.status === 'awaiting_customer'
                    ? 'blue'
                    : 'green'
            }
          >
            {(thread.status ?? 'open').replace('_', ' ')}
          </Badge>
          <Button
            variant={isClosed ? 'primary' : 'outline'}
            size="sm"
            onClick={handleToggleClosed}
            loading={closing}
          >
            {isClosed ? '↻ Reopen' : '✕ Close'}
          </Button>
        </div>
      </div>

      {/* ─── Subject strip ──────────────────────────────── */}
      <div className="border-b border-surface-border bg-white/[.01] px-6 py-3">
        <p className="text-[11px] font-black uppercase tracking-wider text-ink-500">
          Subject
        </p>
        <p className="mt-0.5 text-[13px] font-bold text-white">{thread.subject}</p>
      </div>

      {/* ─── Messages ───────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Spinner size={24} className="!border-white/15 !border-t-brand-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="mb-2 text-3xl opacity-40">📭</span>
            <p className="text-[12.5px] font-semibold text-ink-500">
              No messages in this thread
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((m) => {
              const isAdmin = m.senderRole === 'admin';
              return (
                <div
                  key={m.id}
                  className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[78%] rounded-2xl px-4 py-3 ${
                      isAdmin
                        ? 'bg-brand-500/15 ring-1 ring-inset ring-brand-400/25'
                        : 'bg-white/[.05] ring-1 ring-inset ring-white/10'
                    }`}
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider ${
                          isAdmin ? 'text-brand-300' : 'text-ink-400'
                        }`}
                      >
                        {isAdmin ? 'You (Admin)' : thread.customer.fullName}
                      </span>
                      <span
                        className="text-[10px] font-medium text-ink-500"
                        title={formatDateTime(m.createdAt)}
                      >
                        {formatRelative(m.createdAt)}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-[13px] font-medium leading-relaxed text-white">
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

      {/* ─── Composer ───────────────────────────────────── */}
      <div className="border-t border-surface-border bg-[#0a0e17]/70 px-6 py-4 backdrop-blur">
        {isClosed ? (
          <div className="rounded-xl bg-white/[.04] px-4 py-3 text-center text-[12.5px] font-semibold text-ink-400 ring-1 ring-inset ring-white/10">
            This thread is closed. Reopen it to reply.
          </div>
        ) : (
          <div className="flex items-end gap-3">
            <textarea
              ref={textareaRef}
              rows={1}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type your reply… (Enter to send, Shift+Enter for newline)"
              className="max-h-40 flex-1 resize-none rounded-xl border-0 bg-white/[.04] px-4 py-3 text-[13px] font-medium text-white outline-none ring-1 ring-inset ring-white/10 transition placeholder:text-ink-500 focus:ring-2 focus:ring-brand-500"
            />
            <Button
              variant="primary"
              size="md"
              onClick={handleSend}
              disabled={!canSend}
              loading={sending}
              className="flex-shrink-0"
            >
              Send
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
