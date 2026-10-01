import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OtpInput } from '@/components/auth/OtpInput';
import { Button } from '@/components/ui/Button';
import { verifyOtp } from '@/services/auth.service';
import { getMe } from '@/services/auth.service';
import { useAdminAuthStore } from '@/store/adminAuthStore';
import { ApiClientError } from '@/services/api';
import { toast } from '@/hooks/useToast';
import type { LoginChallenge } from '@/types';

export default function AdminOtpPage() {
  const navigate = useNavigate();
  const setAdmin = useAdminAuthStore((s) => s.setAdmin);
  const [challenge, setChallenge] = useState<LoginChallenge | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('qrcb_admin_challenge');
      if (!raw) {
        navigate('/login', { replace: true });
        return;
      }
      setChallenge(JSON.parse(raw) as LoginChallenge);
    } catch {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  const handleComplete = async (code: string) => {
    if (!challenge || busy) return;
    setBusy(true);
    setError(null);
    try {
      await verifyOtp({ challengeId: challenge.challengeId, code });
      const me = await getMe();
      setAdmin(me);
      sessionStorage.removeItem('qrcb_admin_challenge');
      toast.success('Welcome back');
      navigate('/dashboard', { replace: true });
    } catch (e) {
      const err = e as ApiClientError;
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!challenge) {
    return null;
  }

  return (
    <div className="animate-fade-up">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-brand-500/15 text-2xl ring-1 ring-inset ring-brand-400/30">
          ✉️
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white">
          Verify your identity
        </h1>
        <p className="mt-2 text-[12.5px] font-medium text-ink-400">
          Enter the 6-digit code sent to
          <br />
          <b className="text-white">{challenge.email}</b>
        </p>
      </div>

      <div className="rounded-2xl border border-surface-border bg-[#0a0e17]/80 p-6 backdrop-blur shadow-elevated">
        <OtpInput onComplete={handleComplete} disabled={busy} />

        {error && (
          <p className="mt-4 text-center text-[12px] font-bold text-rose-400">
            {error}
          </p>
        )}

        {busy && (
          <p className="mt-4 text-center text-[11.5px] font-semibold text-ink-500">
            Verifying…
          </p>
        )}

        <div className="mt-6 flex flex-col items-center gap-2">
          <span className="text-[11px] font-medium text-ink-500">
            Didn&apos;t receive the code?
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/login', { replace: true })}
            disabled={busy}
          >
            Back to login
          </Button>
        </div>
      </div>

      <p className="mt-6 text-center text-[11px] font-semibold text-ink-600">
        Code expires in 5 minutes
      </p>
    </div>
  );
}
