import { get, patch } from './api';
import type { AdminDispute, DisputeStatus, Paginated } from '@/types';
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

function normalizeDispute(input: unknown, index = 0): AdminDispute {
  const r = (input ?? {}) as Loose;
  const customerSource = r.customer ?? r.user ?? r.buyer ?? r;

  return {
    id: str(r.id ?? r._id ?? `dispute-${index}`),
    customer: normalizeCustomer(customerSource),
    serialNumber: str(r.serialNumber ?? r.serial_number ?? r.serial ?? ''),
    description: str(r.description ?? r.message ?? r.reason ?? ''),
    photoObjectKey: (r.photoObjectKey ??
      r.photo_object_key ??
      r.photo ??
      null) as string | null,
    status: ((r.status as DisputeStatus) ?? 'open') as DisputeStatus,
    adminNote: (r.adminNote ?? r.admin_note ?? null) as string | null,
    createdAt: str(r.createdAt ?? r.created_at ?? new Date().toISOString()),
  };
}

export async function listDisputes(
  params: { status?: string; page?: number; perPage?: number } = {}
): Promise<Paginated<AdminDispute>> {
  const data = await get<unknown>(
    '/api/admin/disputes',
    params as Record<string, unknown>
  );

  if (Array.isArray(data)) {
    const items = (data as Loose[]).map((r, i) => normalizeDispute(r, i));
    return {
      items,
      page: 1,
      perPage: items.length,
      total: items.length,
      totalPages: 1,
    };
  }

  const obj = (data ?? {}) as Loose;
  const rawList = (obj.items ?? obj.disputes ?? obj.data ?? []) as unknown;
  const items = Array.isArray(rawList)
    ? (rawList as Loose[]).map((r, i) => normalizeDispute(r, i))
    : [];

  return {
    items,
    page: num(obj.page, 1),
    perPage: num(obj.perPage ?? obj.per_page, items.length),
    total: num(obj.total, items.length),
    totalPages: num(obj.totalPages ?? obj.total_pages, 1),
  };
}

export function updateDispute(id: string, status: string, adminNote?: string) {
  return patch<unknown>(`/api/admin/disputes/${id}`, {
    status,
    adminNote,
  }).then((data) => {
    const obj = (data ?? {}) as Loose;
    const raw = (obj.dispute ?? obj) as Loose;
    return normalizeDispute(raw);
  });
}
