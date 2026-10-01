import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { getSettings, updateSetting } from '@/services/settings.service';
import type { AdminSettings } from '@/types';
import { ApiClientError } from '@/services/api';
import { toast } from '@/hooks/useToast';

export default function SettingsPage() {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch(() => setSettings(null))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (key: keyof AdminSettings, value: string) => {
    setSaving(true);
    try {
      const updated = await updateSetting(key, value);
      setSettings(updated);
      toast.success('Setting updated');
    } catch (e) {
      toast.error((e as ApiClientError).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header title="Settings" subtitle="Business rules and security policies" />
        <div className="flex flex-1 items-center justify-center">
          <Spinner size={24} className="!border-white/15 !border-t-brand-400" />
        </div>
      </>
    );
  }

  if (!settings) {
    return (
      <>
        <Header title="Settings" />
        <div className="flex flex-1 items-center justify-center text-ink-400">
          Could not load settings.
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Settings" subtitle="Business rules and security policies" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl space-y-5">
          <div className="rounded-2xl border border-surface-border bg-white/[.015] p-6">
            <h3 className="mb-5 text-[13.5px] font-bold text-white">Cashback rules</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Cashback amount (₦)"
                defaultValue={settings.cashbackAmount}
                onBlur={(e) => handleSave('cashbackAmount', e.target.value)}
              />
              <Input
                label="Min withdrawal (₦)"
                defaultValue={settings.minWithdrawal}
                onBlur={(e) => handleSave('minWithdrawal', e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-surface-border bg-white/[.015] p-6">
            <h3 className="mb-5 text-[13.5px] font-bold text-white">Security</h3>
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Scan rate limit"
                type="number"
                defaultValue={settings.scanRateLimit}
                onBlur={(e) => handleSave('scanRateLimit', e.target.value)}
              />
              <Input
                label="Lockout (minutes)"
                type="number"
                defaultValue={settings.scanLockoutMinutes}
                onBlur={(e) => handleSave('scanLockoutMinutes', e.target.value)}
              />
              <Input
                label="Session TTL (min)"
                type="number"
                defaultValue={settings.sessionTtlMinutes}
                onBlur={(e) => handleSave('sessionTtlMinutes', e.target.value)}
              />
            </div>
          </div>

          <Button variant="primary" size="lg" block loading={saving} onClick={() => toast.success('All changes saved automatically')}>
            Done
          </Button>
        </div>
      </div>
    </>
  );
}
