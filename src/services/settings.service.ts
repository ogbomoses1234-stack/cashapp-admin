import { get, patch } from './api';
import type { AdminSettings } from '@/types';

export function getSettings() {
  return get<AdminSettings>('/api/admin/settings');
}

export function updateSetting(key: string, value: string | number) {
  return patch<AdminSettings>('/api/admin/settings', { key, value });
}
