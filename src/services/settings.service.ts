import { get, patch } from './api';
import type { AdminSettings, NotificationPreferences } from '@/types';

/* ═══════════════════════════════════════════════════════════
   Core settings
═══════════════════════════════════════════════════════════ */
export function getSettings() {
  return get<AdminSettings>('/api/admin/settings');
}

export function updateSetting(key: string, value: string | number) {
  return patch<AdminSettings>('/api/admin/settings', { key, value });
}

/* ═══════════════════════════════════════════════════════════
   Admin notification preferences
   Backed by the SystemSetting key/value table on the server.
═══════════════════════════════════════════════════════════ */
export function getNotificationPrefs() {
  return get<NotificationPreferences>('/api/admin/settings/notifications');
}

export function updateNotificationPrefs(
  patchBody: Partial<NotificationPreferences>
) {
  return patch<NotificationPreferences>(
    '/api/admin/settings/notifications',
    patchBody
  );
}