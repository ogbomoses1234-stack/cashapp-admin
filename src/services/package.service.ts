import { get, patch, post } from './api';
import type {
  AdminPackage,
  AdminPackageEditRequest,
  AdminPackageItem,
  AdminPackageMessage,
  PackageEditStatus,
  PackageStatus,
  Paginated,
} from '@/types';
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
function bool(v: unknown, fallback = false): boolean {
  if (typeof v === 'boolean') return v;
  if (v === 'true' || v === 1) return true;
  if (v === 'false' || v === 0) return false;
  return fallback;
}

function normalizeItem(input: unknown, index = 0): AdminPackageItem {
  const r = (input ?? {}) as Loose;
  return {
    id: str(r.id ?? r._id ?? `item-${index}`),
    name: str(r.name ?? r.title ?? 'Item'),
    details: (r.details ?? r.notes ?? null) as string | null,
    quantity: num(r.quantity, 1),
    estimatedPrice: (r.estimatedPrice ?? r.estimated_price ?? null) as string | null,
    imageUrl: (r.imageUrl ?? r.image_url ?? null) as string | null,
    imageObjectKey: (r.imageObjectKey ?? r.image_object_key ?? null) as string | null,
    createdAt: str(r.createdAt ?? r.created_at ?? new Date().toISOString()),
  };
}

function normalizeMessage(input: unknown, index = 0): AdminPackageMessage {
  const r = (input ?? {}) as Loose;
  return {
    id: str(r.id ?? r._id ?? `msg-${index}`),
    requestId: str(r.requestId ?? r.request_id ?? ''),
    senderId: str(r.senderId ?? r.sender_id ?? ''),
    senderRole: ((r.senderRole ?? r.sender_role ?? 'customer') as AdminPackageMessage['senderRole']),
    body: str(r.body ?? r.message ?? r.text ?? ''),
    attachmentObjectKey: (r.attachmentObjectKey ?? r.attachment_object_key ?? null) as string | null,
    createdAt: str(r.createdAt ?? r.created_at ?? new Date().toISOString()),
  };
}

function normalizeEditRequest(input: unknown): AdminPackageEditRequest {
  const r = (input ?? {}) as Loose;
  return {
    id: str(r.id ?? ''),
    requestId: str(r.requestId ?? r.request_id ?? ''),
    reason: str(r.reason ?? ''),
    status: ((r.status as PackageEditStatus) ?? 'pending'),
    adminNote: (r.adminNote ?? r.admin_note ?? null) as string | null,
    createdAt: str(r.createdAt ?? r.created_at ?? new Date().toISOString()),
    resolvedAt: (r.resolvedAt ?? r.resolved_at ?? null) as string | null,
  };
}

function normalizePackage(input: unknown): AdminPackage {
  const r = (input ?? {}) as Loose;

  const rawItems = (r.items ?? r.packageItems ?? r.package_items ?? []) as unknown;
  const items = Array.isArray(rawItems)
    ? (rawItems as Loose[]).map((x, i) => normalizeItem(x, i))
    : [];

  const rawMessages = (r.messages ?? []) as unknown;
  const messages = Array.isArray(rawMessages)
    ? (rawMessages as Loose[]).map((x, i) => normalizeMessage(x, i))
    : undefined;

  const rawAllEdits = (r.allEditRequests ?? r.all_edit_requests ?? []) as unknown;
  const allEditRequests = Array.isArray(rawAllEdits)
    ? (rawAllEdits as Loose[]).map(normalizeEditRequest)
    : undefined;

  const rawPendingEdit = (r.pendingEditRequest ?? r.pending_edit_request ?? null) as Loose | null;
  const pendingEditRequest = rawPendingEdit ? normalizeEditRequest(rawPendingEdit) : null;

  const customerSource = r.customer ?? r.user ?? r.buyer;
  const customer = customerSource ? normalizeCustomer(customerSource) : undefined;

  return {
    id: str(r.id ?? r._id ?? ''),
    reference: str(r.reference ?? r.code ?? '—'),
    title: str(r.title ?? 'Untitled'),
    status: ((r.status as PackageStatus) ?? 'draft'),
    isEditable: bool(r.isEditable ?? r.is_editable, false),
    notes: (r.notes ?? null) as string | null,
    country: str(r.country ?? r.state ?? ''),
    city: str(r.city ?? ''),
    deliveryAddress: str(r.deliveryAddress ?? r.delivery_address ?? ''),
    contactPhone: str(r.contactPhone ?? r.contact_phone ?? ''),
    quotedTotal: (r.quotedTotal ?? r.quoted_total ?? null) as string | null,
    currency: str(r.currency ?? 'NGN'),
    items,
    pendingEditRequest,
    allEditRequests,
    customer,
    messages,
    messageCount: num(r.messageCount ?? r.message_count, 0) || undefined,
    lastMessageAt: (r.lastMessageAt ?? r.last_message_at ?? null) as string | null,
    createdAt: str(r.createdAt ?? r.created_at ?? new Date().toISOString()),
    updatedAt: str(r.updatedAt ?? r.updated_at ?? new Date().toISOString()),
  };
}

export async function listPackages(
  params: { status?: string; search?: string; page?: number; perPage?: number } = {}
): Promise<Paginated<AdminPackage>> {
  const data = await get<unknown>('/api/admin/packages', params as Record<string, unknown>);

  if (Array.isArray(data)) {
    const items = (data as Loose[]).map(normalizePackage);
    return { items, page: 1, perPage: items.length, total: items.length, totalPages: 1 };
  }

  const obj = (data ?? {}) as Loose;
  const rawList = (obj.items ?? obj.packages ?? obj.data ?? []) as unknown;
  const items = Array.isArray(rawList) ? (rawList as Loose[]).map(normalizePackage) : [];

  return {
    items,
    page: num(obj.page, 1),
    perPage: num(obj.perPage ?? obj.per_page, items.length),
    total: num(obj.total, items.length),
    totalPages: num(obj.totalPages ?? obj.total_pages, 1),
  };
}

export async function getPackage(id: string): Promise<AdminPackage> {
  const data = await get<unknown>(`/api/admin/packages/${id}`);
  const obj = (data ?? {}) as Loose;
  const raw = (obj.package ?? obj) as Loose;
  return normalizePackage(raw);
}

export async function replyToPackage(
  id: string,
  body: string,
  attachmentKey?: string
): Promise<AdminPackageMessage> {
  const data = await post<unknown>(`/api/admin/packages/${id}/reply`, { body, attachmentKey });
  const obj = (data ?? {}) as Loose;
  const raw = (obj.message ?? obj) as Loose;
  return normalizeMessage(raw);
}

export async function setPackageStatus(
  id: string,
  status: Exclude<PackageStatus, 'draft'>,
  reason?: string
): Promise<AdminPackage> {
  const data = await patch<unknown>(`/api/admin/packages/${id}/status`, { status, reason });
  const obj = (data ?? {}) as Loose;
  const raw = (obj.package ?? obj) as Loose;
  return normalizePackage(raw);
}

export async function setPackageQuote(
  id: string,
  quotedTotal: string,
  currency = 'NGN'
): Promise<AdminPackage> {
  const data = await patch<unknown>(`/api/admin/packages/${id}/quote`, { quotedTotal, currency });
  const obj = (data ?? {}) as Loose;
  const raw = (obj.package ?? obj) as Loose;
  return normalizePackage(raw);
}

export async function resolveEditRequest(
  packageId: string,
  editId: string,
  status: 'approved' | 'denied',
  adminNote?: string
): Promise<AdminPackageEditRequest> {
  const data = await patch<unknown>(
    `/api/admin/packages/${packageId}/edit-requests/${editId}`,
    { status, adminNote }
  );
  const obj = (data ?? {}) as Loose;
  const raw = (obj.editRequest ?? obj.edit_request ?? obj) as Loose;
  return normalizeEditRequest(raw);
}
