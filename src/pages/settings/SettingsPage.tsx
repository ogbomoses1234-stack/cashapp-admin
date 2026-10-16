import { useCallback, useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import {
  getSettings,
  updateSetting,
  getNotificationPrefs,
  updateNotificationPrefs,
} from '@/services/settings.service';
import type { AdminSettings, NotificationPreferences } from '@/types';
import { ApiClientError } from '@/services/api';
import { toast } from '@/hooks/useToast';

export default function SettingsPage() {
  /* ─── Core settings ───────────────────────────────────── */
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /* ─── Notification preferences ────────────────────────── */
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [prefsError, setPrefsError] = useState<string | null>(null);

  /** Which toggle is currently saving — disables only that one */
  const [savingKey, setSavingKey] = useState<
    'order' | 'package' | 'withdrawal' | null
  >(null);

  /** Local copy of the email field so we can validate before saving */
  const [emailDraft, setEmailDraft] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [savingEmail, setSavingEmail] = useState(false);

  /* ═══════════════════════════════════════════════════════
     Load — both calls fire in parallel
  ═══════════════════════════════════════════════════════ */
  useEffect(() => {
    let alive = true;

    /* Core settings */
    getSettings()
      .then((s) => alive && setSettings(s))
      .catch(() => alive && setSettings(null))
      .finally(() => alive && setLoading(false));

    /* Notification prefs */
    getNotificationPrefs()
      .then((p) => {
        if (!alive) return;
        setPrefs(p);
        setEmailDraft(p.email);
        setPrefsError(null);
      })
      .catch((e) => {
        if (!alive) return;
        setPrefsError(
          (e as ApiClientError).message ?? 'Could not load preferences'
        );
      })
      .finally(() => {
        if (alive) setPrefsLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  /* ═══════════════════════════════════════════════════════
     Save core setting (existing behaviour)
  ═══════════════════════════════════════════════════════ */
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

  /* ═══════════════════════════════════════════════════════
     Toggle one notification channel
     Optimistic: flips instantly, rolls back on failure
  ═══════════════════════════════════════════════════════ */
  const handleToggle = useCallback(
    async (key: 'order' | 'package' | 'withdrawal', next: boolean) => {
      if (!prefs || savingKey) return;
      const previous = prefs[key];

      /* Optimistic flip */
      setPrefs({ ...prefs, [key]: next });
      setSavingKey(key);

      try {
        const updated = await updateNotificationPrefs({ [key]: next });
        setPrefs(updated);
        setEmailDraft(updated.email);
        toast.success(
          next
            ? `Email alerts on for ${labelFor(key)}`
            : `Email alerts off for ${labelFor(key)}`
        );
      } catch (e) {
        /* Roll back */
        setPrefs((p) => (p ? { ...p, [key]: previous } : p));
        toast.error(
          (e as ApiClientError).message ?? 'Could not update preference'
        );
      } finally {
        setSavingKey(null);
      }
    },
    [prefs, savingKey]
  );

  /* ═══════════════════════════════════════════════════════
     Save the notification email
  ═══════════════════════════════════════════════════════ */
  const handleSaveEmail = async () => {
    const trimmed = emailDraft.trim();

    /* No change — nothing to do */
    if (prefs && trimmed === prefs.email) return;

    /* Client-side guard so we don't hammer the API on typos */
    if (trimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError('Enter a valid email address');
      return;
    }
    setEmailError(null);
    setSavingEmail(true);

    try {
      const updated = await updateNotificationPrefs({ email: trimmed });
      setPrefs(updated);
      setEmailDraft(updated.email);
      toast.success('Notification email saved');
    } catch (e) {
      toast.error((e as ApiClientError).message ?? 'Could not save email');
    } finally {
      setSavingEmail(false);
    }
  };

  /* ═══════════════════════════════════════════════════════
     Loading / error screens
  ═══════════════════════════════════════════════════════ */
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
          {/* ═══════════════════════════════════════════════════
              CASHBACK RULES
          ═══════════════════════════════════════════════════ */}
          <div className="rounded-2xl border border-surface-border bg-white/[.015] p-6">
            <h3 className="mb-5 text-[13.5px] font-bold text-white">
              Cashback rules
            </h3>
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

          {/* ═══════════════════════════════════════════════════
              SECURITY
          ═══════════════════════════════════════════════════ */}
          <div className="rounded-2xl border border-surface-border bg-white/[.015] p-6">
            <h3 className="mb-5 text-[13.5px] font-bold text-white">
              Security
            </h3>
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

          {/* ═══════════════════════════════════════════════════
              EMAIL NOTIFICATIONS
          ═══════════════════════════════════════════════════ */}
          <div className="rounded-2xl border border-surface-border bg-white/[.015] p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-[13.5px] font-bold text-white">
                  Email notifications
                </h3>
                <p className="mt-1 text-[11.5px] font-medium text-ink-500">
                  Get an alert when customer activity needs your attention.
                </p>
              </div>
              <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg bg-brand-500/15 text-sm text-brand-300 ring-1 ring-inset ring-brand-400/25">
                ✉️
              </span>
            </div>

            {prefsLoading ? (
              <div className="flex justify-center py-8">
                <Spinner
                  size={20}
                  className="!border-white/15 !border-t-brand-400"
                />
              </div>
            ) : prefsError || !prefs ? (
              <div className="rounded-xl border border-rose-400/25 bg-rose-500/5 p-4">
                <p className="text-[12.5px] font-bold text-rose-200">
                  {prefsError ?? 'Could not load preferences'}
                </p>
                <p className="mt-1 text-[11.5px] text-rose-300/70">
                  Refresh the page to try again.
                </p>
              </div>
            ) : (
              <>
                {/* ─── The three toggles ─────────────────── */}
                <div className="divide-y divide-white/[.04]">
                  <ToggleRow
                    label="New orders"
                    description="When a customer places a new order"
                    checked={prefs.order}
                    busy={savingKey === 'order'}
                    onChange={(next) => handleToggle('order', next)}
                  />
                  <ToggleRow
                    label="Special package requests"
                    description="When a customer submits a special-order list"
                    checked={prefs.package}
                    busy={savingKey === 'package'}
                    onChange={(next) => handleToggle('package', next)}
                  />
                  <ToggleRow
                    label="Withdrawal requests"
                    description="When a customer requests a payout"
                    checked={prefs.withdrawal}
                    busy={savingKey === 'withdrawal'}
                    onChange={(next) => handleToggle('withdrawal', next)}
                  />
                </div>

                {/* ─── Destination email ─────────────────── */}
                <div className="mt-5 border-t border-surface-border pt-5">
                  <label className="block">
                    <span className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-ink-400">
                      Send alerts to
                    </span>
                    <div className="flex items-stretch gap-2">
                      <input
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        value={emailDraft}
                        onChange={(e) => {
                          setEmailDraft(e.target.value);
                          if (emailError) setEmailError(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSaveEmail();
                          }
                        }}
                        placeholder="admin@example.com"
                        disabled={savingEmail}
                        className={`w-full rounded-xl border-0 bg-white/[.04] px-3.5 py-2.5 text-[13px] font-semibold text-white outline-none ring-1 ring-inset transition placeholder:text-ink-500 focus:bg-white/[.06] focus:ring-2 disabled:opacity-60 ${
                          emailError
                            ? 'ring-rose-400/40 focus:ring-rose-500'
                            : 'ring-white/10 focus:ring-brand-500'
                        }`}
                      />
                      <Button
                        variant="primary"
                        size="md"
                        onClick={handleSaveEmail}
                        loading={savingEmail}
                        disabled={emailDraft.trim() === prefs.email}
                      >
                        Save
                      </Button>
                    </div>
                    {emailError ? (
                      <span className="mt-1 block text-[11px] font-semibold text-rose-400">
                        {emailError}
                      </span>
                    ) : (
                      <span className="mt-1 block text-[11px] text-ink-500">
                        Falls back to the site-wide sender if left blank.
                      </span>
                    )}
                  </label>
                </div>

                {/* ─── Info strip ────────────────────────── */}
                <div className="mt-5 flex items-start gap-2 rounded-xl bg-white/[.03] p-3 ring-1 ring-inset ring-white/5">
                  <span className="text-base leading-none">🔔</span>
                  <p className="text-[11.5px] font-medium leading-relaxed text-ink-400">
                    Alerts are sent from your configured SMTP server. Each toggle
                    saves immediately — no need to click a global save button.
                  </p>
                </div>
              </>
            )}
          </div>

          <Button
            variant="primary"
            size="lg"
            block
            loading={saving}
            onClick={() =>
              toast.success('All changes are saved automatically')
            }
          >
            Done
          </Button>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   Toggle switch row
═══════════════════════════════════════════════════════════ */
function ToggleRow({
  label,
  description,
  checked,
  busy,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  busy?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] font-bold text-white">{label}</p>
        <p className="mt-0.5 text-[11px] font-medium text-ink-500">
          {description}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => !busy && onChange(!checked)}
        disabled={busy}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition ${
          checked ? 'bg-brand-500' : 'bg-white/10'
        } ${busy ? 'cursor-wait opacity-60' : 'cursor-pointer'}`}
      >
        {busy ? (
          <span className="absolute inset-0 grid place-items-center">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          </span>
        ) : (
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
              checked ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        )}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Helper — label for toast messages
═══════════════════════════════════════════════════════════ */
function labelFor(key: 'order' | 'package' | 'withdrawal'): string {
  switch (key) {
    case 'order':
      return 'new orders';
    case 'package':
      return 'package requests';
    case 'withdrawal':
      return 'withdrawal requests';
  }
}