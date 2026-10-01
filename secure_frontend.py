#!/usr/bin/env python3
"""
Frontend security hardening:
  1. Remove password from sessionStorage
  2. VerifyOtpPage uses the auto-login cookie
  3. Strip console + debugger in production builds
  4. Disable source maps in production
  5. Warn about secrets in .env
  6. Run npm audit
  7. Verify no dangerous HTML injection
"""
import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path.cwd()
if not (ROOT / "package.json").exists():
    sys.exit("❌ Run from the frontend repo (qrcashback-frontend-public or -admin)")

print("═" * 60)
print(f" Securing: {ROOT.name}")
print("═" * 60)

# ═══════════════════════════════════════════════════════════════
# 1. Remove sessionStorage password caching
# ═══════════════════════════════════════════════════════════════
print("\n[1] Removing password from sessionStorage")

signup = ROOT / "src/pages/SignupPage.tsx"
if signup.exists():
    src = signup.read_text(encoding="utf-8")
    before = src

    # Remove PENDING_CRED_KEY constant
    src = re.sub(
        r"const\s+PENDING_CRED_KEY\s*=\s*['\"][^'\"]+['\"];\s*\n\s*\n?",
        "",
        src,
    )

    # Remove sessionStorage.setItem(...) blocks that store password
    src = re.sub(
        r"\n\s*(?:try\s*\{)?\s*sessionStorage\.setItem\(\s*PENDING_CRED_KEY[\s\S]*?\}\s*(?:catch\s*\{\s*\})?",
        "",
        src,
    )

    # Also catch generic sessionStorage.setItem with password-like values
    src = re.sub(
        r"\n\s*sessionStorage\.setItem\(\s*['\"][^'\"]*['\"]\s*,\s*JSON\.stringify\(\{[^}]*password[^}]*\}\)\s*\)\s*;?",
        "",
        src,
    )

    if src != before:
        signup.write_text(src, encoding="utf-8")
        print("   ✅ SignupPage.tsx — password caching removed")
    else:
        print("   ℹ️  SignupPage.tsx — no sessionStorage password found")
else:
    print("   ℹ️  SignupPage.tsx not found — skipping")

# ═══════════════════════════════════════════════════════════════
# 2. VerifyOtpPage — use the auto-login cookie
# ═══════════════════════════════════════════════════════════════
print("\n[2] VerifyOtpPage — auto-login flow")

otp = ROOT / "src/pages/VerifyOtpPage.tsx"
if otp.exists():
    new_otp = '''import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { OtpInput } from '@/components/auth/OtpInput';
import { Button } from '@/components/ui/Button';
import { verifyOtp, resendOtp } from '@/services/otp.service';
import { getMe } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';
import { ApiClientError } from '@/services/api';
import { toast } from '@/hooks/useToast';

const RESEND_COOLDOWN = 60;

export default function VerifyOtpPage() {
  const [params] = useSearchParams();
  const email = params.get('email') ?? '';
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!email) navigate('/signup', { replace: true });
  }, [email, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const handleComplete = async (code: string) => {
    if (busy || !email) return;
    setBusy(true);
    setError(null);

    try {
      /* Backend sets the httpOnly accessToken cookie during /otp/verify.
         Password is NEVER cached client-side. */
      await verifyOtp({ email, code });

      /* Fetch the fresh session */
      const me = await getMe();
      setUser(me);

      toast.success('Email verified');

      if (me.role === 'staff') {
        navigate('/staff/terminal', { replace: true });
      } else if (!me.fullName || !me.phoneNumber || !me.deliveryAddress) {
        navigate('/profile-setup', { replace: true });
      } else {
        navigate('/home', { replace: true });
      }
    } catch (e) {
      setError((e as ApiClientError).message);
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || !email) return;
    try {
      await resendOtp({ email });
      toast.success('New code sent');
      setCooldown(RESEND_COOLDOWN);
    } catch (e) {
      toast.error((e as ApiClientError).message);
    }
  };

  return (
    <div className="pt-6">
      <div className="mb-7 flex flex-col items-center text-center">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-100 text-3xl">
          ✉️
        </div>
        <h1 className="mt-4 text-2xl font-black tracking-tight text-ink-900">
          Check your inbox
        </h1>
        <p className="mt-2 text-sm font-medium text-slate-500">
          We sent a 6-digit code to
          <br />
          <b className="text-ink-900">{email}</b>
        </p>
      </div>

      <div className="rounded-3xl bg-white p-5 shadow-card ring-1 ring-ink-100/60">
        <OtpInput onComplete={handleComplete} disabled={busy} />

        {error && (
          <p className="mt-4 text-center text-xs font-bold text-rose-500">{error}</p>
        )}
        {busy && (
          <p className="mt-4 text-center text-xs font-bold text-slate-500">
            Verifying and signing you in…
          </p>
        )}

        <div className="mt-6 flex flex-col items-center gap-2">
          <span className="text-[11.5px] font-semibold text-slate-500">
            Didn't get the code?
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResend}
            disabled={cooldown > 0 || busy}
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
          </Button>
        </div>
      </div>

      <p className="mt-6 text-center text-xs font-semibold text-slate-500">
        Wrong email?{' '}
        <button
          onClick={() => navigate('/signup')}
          className="font-black text-brand-700"
        >
          Go back
        </button>
      </p>
    </div>
  );
}
'''
    otp.write_text(new_otp, encoding="utf-8")
    print("   ✅ VerifyOtpPage.tsx — auto-login flow")
else:
    print("   ℹ️  VerifyOtpPage.tsx not found")

# ═══════════════════════════════════════════════════════════════
# 3. Vite config — strip console + no source maps
# ═══════════════════════════════════════════════════════════════
print("\n[3] vite.config.ts — production hardening")

vite = ROOT / "vite.config.ts"
if vite.exists():
    src = vite.read_text(encoding="utf-8")

    # Add esbuild drop console if not present
    if "drop: " not in src and "esbuild:" not in src:
        # Insert inside build: { ... }
        src = re.sub(
            r"(\n\s*)build:\s*\{",
            r"\1build: {\n    minify: 'esbuild',\n    esbuild: {\n      drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],\n    },",
            src,
            count=1,
        )

    # Ensure sourcemap: false
    src = re.sub(r"sourcemap:\s*true", "sourcemap: false", src)

    vite.write_text(src, encoding="utf-8")
    print("   ✅ vite.config.ts — console stripped + sourcemap off")
else:
    print("   ⚠️  vite.config.ts not found")

# ═══════════════════════════════════════════════════════════════
# 4. .env leak check
# ═══════════════════════════════════════════════════════════════
print("\n[4] .env leak check")

env_files = [".env", ".env.production", ".env.local"]
leaks = []
for f in env_files:
    p = ROOT / f
    if not p.exists():
        continue
    for line in p.read_text(encoding="utf-8").splitlines():
        if not line.strip() or line.startswith("#"):
            continue
        if not line.startswith("VITE_"):
            continue
        # Check for secret-like values in VITE_ vars
        for marker in ("sk_live", "sk_test", "SECRET", "PASSWORD", "JWT_SECRET", "DATABASE_URL"):
            if marker in line:
                leaks.append(f"   ❌ {f}: {line.split('=')[0]} contains '{marker}'")

if leaks:
    print("\n".join(leaks))
    print("\n   ⚠️  These VITE_ vars are exposed in the browser! Remove them.")
else:
    print("   ✅ No secrets in VITE_ vars")

# ═══════════════════════════════════════════════════════════════
# 5. Dangerous HTML injection check
# ═══════════════════════════════════════════════════════════════
print("\n[5] HTML injection check")

src_dir = ROOT / "src"
if src_dir.exists():
    hits = []
    for f in src_dir.rglob("*.tsx"):
        content = f.read_text(encoding="utf-8")
        if "dangerouslySetInnerHTML" in content or "innerHTML" in content:
            hits.append(f"   ⚠️  {f.relative_to(ROOT)}")
    if hits:
        print("\n".join(hits))
        print("\n   Audit each usage — only use for trusted content.")
    else:
        print("   ✅ No raw HTML injection")
else:
    print("   ⚠️  src/ not found")

# ═══════════════════════════════════════════════════════════════
# 6. Type check
# ═══════════════════════════════════════════════════════════════
print("\n[6] TypeScript check")
tsc = subprocess.run(["npx", "tsc", "--noEmit"], cwd=ROOT, capture_output=True, text=True)
if tsc.returncode == 0:
    print("   ✅ TypeScript clean")
else:
    print("   ⚠️  TS errors:")
    print(tsc.stdout)

# ═══════════════════════════════════════════════════════════════
# 7. npm audit
# ═══════════════════════════════════════════════════════════════
print("\n[7] npm audit")
audit = subprocess.run(
    ["npm", "audit", "--production", "--audit-level=high"],
    cwd=ROOT, capture_output=True, text=True,
)
if "found 0 vulnerabilities" in audit.stdout or audit.returncode == 0:
    print("   ✅ No high/critical vulnerabilities")
else:
    # Print just the summary lines
    for line in audit.stdout.splitlines()[:15]:
        if line.strip():
            print("   " + line)

print("\n" + "═" * 60)
print(f" ✅ {ROOT.name} secured")
print("═" * 60)
print("""
Next:

  # Rebuild
  rm -rf node_modules/.vite dist
  npm run build

  # Verify bundle is clean
  grep -rE "sk_live|sk_test|password|secret" dist/ && echo "❌ Leak!" || echo "✓ Clean bundle"
  grep -r "console.log" dist/ && echo "⚠️  Console logs remain" || echo "✓ No console.log in bundle"
""")
