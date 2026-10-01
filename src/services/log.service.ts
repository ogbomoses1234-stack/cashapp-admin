import { get } from './api';
import type { AuditLogRow, Paginated } from '@/types';

export async function listLogs(params: {
  event?: string;
  actorId?: string;
  from?: string;
  to?: string;
  page?: number;
  perPage?: number;
} = {}) {
  const data = await get<unknown>('/api/admin/logs', params as Record<string, unknown>);
  if (Array.isArray(data)) {
    return { items: data as AuditLogRow[], page: 1, perPage: data.length, total: data.length, totalPages: 1 } as Paginated<AuditLogRow>;
  }
  return data as Paginated<AuditLogRow>;
}
