import { get, patch, post } from './api';
import type { AdminChatMessage, AdminChatThread, ChatStatus } from '@/types';
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
function extractArray(data: unknown, keys: string[]): Loose[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as Loose[];
  const obj = data as Loose;
  for (const k of keys) if (Array.isArray(obj[k])) return obj[k] as Loose[];
  return [];
}

function normalizeThread(input: unknown, index = 0): AdminChatThread {
  const r = (input ?? {}) as Loose;
  const customerSource = r.customer ?? r.user ?? r.buyer ?? r;

  return {
    id: str(r.id ?? r._id ?? `thread-${index}`),
    customer: normalizeCustomer(customerSource),
    subject: str(r.subject ?? r.title ?? 'Conversation'),
    status: ((r.status as ChatStatus) ?? 'open') as ChatStatus,
    lastMessageAt: str(
      r.lastMessageAt ??
        r.last_message_at ??
        r.updatedAt ??
        r.createdAt ??
        new Date().toISOString()
    ),
    createdAt: str(r.createdAt ?? r.created_at ?? new Date().toISOString()),
  };
}

function normalizeMessage(input: unknown, index = 0): AdminChatMessage {
  const r = (input ?? {}) as Loose;
  return {
    id: str(r.id ?? r._id ?? `msg-${index}`),
    senderId: str(r.senderId ?? r.sender_id ?? r.userId ?? ''),
    senderRole:
      ((r.senderRole ?? r.sender_role ?? r.role) as AdminChatMessage['senderRole']) ??
      'customer',
    body: str(r.body ?? r.message ?? r.text ?? r.content ?? ''),
    attachmentObjectKey: (r.attachmentObjectKey ??
      r.attachment_object_key ??
      r.attachmentKey ??
      null) as string | null,
    createdAt: str(r.createdAt ?? r.created_at ?? new Date().toISOString()),
  };
}

export async function listThreads(
  params: { status?: string; page?: number; perPage?: number } = {}
): Promise<{ items: AdminChatThread[]; total: number }> {
  const data = await get<unknown>(
    '/api/admin/chats',
    params as Record<string, unknown>
  );
  const raw = extractArray(data, ['threads', 'items', 'data']);
  const obj = (data ?? {}) as Loose;
  return {
    items: raw.map((r, i) => normalizeThread(r, i)),
    total: num(obj.total, raw.length),
  };
}

export async function getThreadMessages(
  threadId: string
): Promise<{ thread: AdminChatThread | null; messages: AdminChatMessage[] }> {
  const data = await get<unknown>(`/api/admin/chats/${threadId}/messages`);
  const obj = (data ?? {}) as Loose;

  const rawThread = (obj.thread ?? obj.threadInfo ?? null) as Loose | null;
  const rawMessages = extractArray(data, ['messages', 'items', 'data']);

  return {
    thread: rawThread ? normalizeThread(rawThread) : null,
    messages: rawMessages.map((r, i) => normalizeMessage(r, i)),
  };
}

export async function reply(
  threadId: string,
  body: string,
  attachmentKey?: string
): Promise<AdminChatMessage> {
  const data = await post<unknown>(`/api/admin/chats/${threadId}/reply`, {
    body,
    attachmentKey,
  });
  const obj = (data ?? {}) as Loose;
  const raw = (obj.message ?? obj) as Loose;
  return normalizeMessage(raw);
}

export async function closeThread(threadId: string): Promise<AdminChatThread> {
  const data = await patch<unknown>(`/api/admin/chats/${threadId}/close`);
  const obj = (data ?? {}) as Loose;
  const raw = (obj.thread ?? obj) as Loose;
  return normalizeThread(raw);
}

export async function reopenThread(threadId: string): Promise<AdminChatThread> {
  const data = await patch<unknown>(`/api/admin/chats/${threadId}/reopen`);
  const obj = (data ?? {}) as Loose;
  const raw = (obj.thread ?? obj) as Loose;
  return normalizeThread(raw);
}
