import { del, get, patch } from './api';
import type { Paginated, Role, UserRow } from '@/types';

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
function bool(v: unknown, fallback = true): boolean {
  if (typeof v === 'boolean') return v;
  if (v === 'true' || v === 1 || v === '1') return true;
  if (v === 'false' || v === 0 || v === '0') return false;
  return fallback;
}

function normalizeUser(input: unknown, index = 0): UserRow {
  const r = (input ?? {}) as Loose;
  return {
    id: str(r.id ?? r._id ?? `user-${index}`),
    fullName: (r.fullName ?? r.full_name ?? r.name ?? null) as string | null,
    email: str(r.email ?? ''),
    role: ((r.role as Role) ?? 'customer') as Role,
    phoneNumber: (r.phoneNumber ?? r.phone_number ?? r.phone ?? null) as
      | string
      | null,
    walletBalance: str(r.walletBalance ?? r.wallet_balance ?? r.balance ?? 0),
    isActive: bool(r.isActive ?? r.is_active ?? r.active, true),
    emailVerified: bool(r.emailVerified ?? r.email_verified ?? false, false),
    createdAt: str(r.createdAt ?? r.created_at ?? new Date().toISOString()),
  };
}

export async function listUsers(
  params: {
    role?: string;
    status?: string;
    search?: string;
    page?: number;
    perPage?: number;
  } = {}
): Promise<Paginated<UserRow>> {
  const data = await get<unknown>(
    '/api/admin/users',
    params as Record<string, unknown>
  );

  if (Array.isArray(data)) {
    const items = (data as Loose[]).map((r, i) => normalizeUser(r, i));
    return {
      items,
      page: 1,
      perPage: items.length,
      total: items.length,
      totalPages: 1,
    };
  }

  const obj = (data ?? {}) as Loose;
  const rawList = (obj.items ?? obj.users ?? obj.data ?? []) as unknown;
  const items = Array.isArray(rawList)
    ? (rawList as Loose[]).map((r, i) => normalizeUser(r, i))
    : [];

  return {
    items,
    page: num(obj.page, 1),
    perPage: num(obj.perPage ?? obj.per_page, items.length),
    total: num(obj.total, items.length),
    totalPages: num(obj.totalPages ?? obj.total_pages, 1),
  };
}

export function deactivateUser(id: string, reason: string) {
  return patch<unknown>(`/api/admin/users/${id}/deactivate`, { reason }).then(
    (data) => {
      const obj = (data ?? {}) as Loose;
      const raw = (obj.user ?? obj) as Loose;
      return normalizeUser(raw);
    }
  );
}

export function reactivateUser(id: string) {
  return patch<unknown>(`/api/admin/users/${id}/reactivate`).then((data) => {
    const obj = (data ?? {}) as Loose;
    const raw = (obj.user ?? obj) as Loose;
    return normalizeUser(raw);
  });
}

export function resetUserPassword(id: string) {
  return patch<{ tempPassword: string }>(
    `/api/admin/users/${id}/reset-password`
  );
}

export function purgeUser(id: string) {
  return del<{ purged: true }>(`/api/admin/users/${id}/purge`);
}
