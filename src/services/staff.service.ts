import { get, patch, post } from './api';
import type { Paginated, StaffMember } from '@/types';

export async function listStaff(params: { search?: string; page?: number; perPage?: number } = {}) {
  const data = await get<unknown>('/api/admin/staff', params as Record<string, unknown>);
  if (Array.isArray(data)) {
    return { items: data as StaffMember[], page: 1, perPage: data.length, total: data.length, totalPages: 1 } as Paginated<StaffMember>;
  }
  return data as Paginated<StaffMember>;
}

export function createStaff(input: {
  fullName: string;
  email: string;
  phoneNumber?: string;
  salesPoint?: string;
  tempPassword?: string;
}) {
  return post<StaffMember>('/api/admin/staff', input);
}

export function updateStaff(id: string, input: Partial<StaffMember>) {
  return patch<StaffMember>(`/api/admin/staff/${id}`, input);
}

export function resetStaffPassword(id: string) {
  return patch<{ tempPassword: string }>(`/api/admin/staff/${id}/reset-password`);
}

export function deactivateStaff(id: string) {
  return patch<StaffMember>(`/api/admin/staff/${id}/deactivate`);
}
