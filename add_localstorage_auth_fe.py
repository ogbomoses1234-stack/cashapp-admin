#!/usr/bin/env python3
"""
Frontend — store JWT in localStorage + send via Authorization header.
"""
from pathlib import Path
import re

ROOT = Path.cwd()
if not (ROOT / "package.json").exists():
    raise SystemExit("❌ Run from the frontend repo")

print("═" * 60)
print(f" Adding localStorage auth to: {ROOT.name}")
print("═" * 60)

# ═══════════════════════════════════════════════════════════════
# 1. Create auth-storage utility
# ═══════════════════════════════════════════════════════════════
print("\n[1] Create src/utils/authStorage.ts")
storage_file = ROOT / "src/utils/authStorage.ts"
storage_file.parent.mkdir(parents=True, exist_ok=True)
storage_file.write_text('''/**
 * Access-token storage for cross-domain deployments.
 *
 * On same-domain deployments (production with vickkyaku.com), the backend
 * sets an httpOnly cookie and this file is unused.
 *
 * On cross-domain deployments (sslip.io testing), we store the JWT in
 * localStorage and send it via Authorization: Bearer <token>.
 *
 * The backend accepts BOTH — cookie OR Authorization header.
 */

const TOKEN_KEY = 'qrcb_access_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {}
}

export function clearStoredToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
}
''', encoding="utf-8")
print("   ✅ Created src/utils/authStorage.ts")

# ═══════════════════════════════════════════════════════════════
# 2. API client — add Authorization header
# ═══════════════════════════════════════════════════════════════
print("\n[2] api.ts — add request interceptor")
api_file = ROOT / "src/services/api.ts"
src = api_file.read_text(encoding="utf-8")

if "Authorization" in src and "getStoredToken" in src:
    print("   ℹ️  interceptor already present")
else:
    # Add import at top
    if "authStorage" not in src:
        src = "import { getStoredToken } from '@/utils/authStorage';\n" + src

    # Find a good injection point — after axios instance creation
    injection = '''
// ═══════════════════════════════════════════════════════════
// Inject JWT from localStorage into every request
// (Enables cross-domain auth without cookies.)
// ═══════════════════════════════════════════════════════════
api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

'''

    # Find where axios instance is created (usually `const api = axios.create`)
    m = re.search(r"(const\s+api\s*=\s*axios\.create\s*\([^)]*\)\s*;)", src)
    if m:
        src = src[:m.end()] + "\n" + injection + src[m.end():]
        api_file.write_text(src, encoding="utf-8")
        print("   ✅ interceptor added after axios.create()")
    else:
        # Fallback: append at end
        src += "\n" + injection
        api_file.write_text(src, encoding="utf-8")
        print("   ✅ interceptor appended (fallback)")

# ═══════════════════════════════════════════════════════════════
# 3. Login + VerifyOtp pages — save token after success
# ═══════════════════════════════════════════════════════════════
print("\n[3] LoginPage + VerifyOtpPage — save token")

def patch_import(src: str) -> str:
    """Add setStoredToken import if not present."""
    if "authStorage" in src:
        return src
    # Add after the last import line
    lines = src.split("\n")
    last_import = -1
    for i, line in enumerate(lines):
        if line.startswith("import "):
            last_import = i
    if last_import >= 0:
        lines.insert(last_import + 1, "import { setStoredToken } from '@/utils/authStorage';")
        return "\n".join(lines)
    return "import { setStoredToken } from '@/utils/authStorage';\n" + src

# Login page
login = ROOT / "src/pages/LoginPage.tsx"
if login.exists():
    src = login.read_text(encoding="utf-8")
    src = patch_import(src)
    # Look for the login success handler
    if "setStoredToken" not in src.split("import")[-1]:
        # Try to find "await login(...)" and add after
        m = re.search(r"(const\s+\w+\s*=\s*await\s+login\s*\([^)]*\)\s*;)", src)
        if m:
            src = src[:m.end()] + "\n      if (" + m.group(1).split("=")[0].strip() + "?.accessToken) setStoredToken(" + m.group(1).split("=")[0].strip() + ".accessToken);" + src[m.end():]
            login.write_text(src, encoding="utf-8")
            print("   ✅ LoginPage — saves token")
        else:
            # Just add a comment fallback
            print("   ⚠️  LoginPage — could not auto-patch; you may need to add save manually")

# Verify OTP page
verify = ROOT / "src/pages/VerifyOtpPage.tsx"
if verify.exists():
    src = verify.read_text(encoding="utf-8")
    src = patch_import(src)
    if "setStoredToken" not in src.split("import")[-1]:
        m = re.search(r"(const\s+\w+\s*=\s*await\s+verifyOtp\s*\([^)]*\)\s*;)", src)
        if m:
            varname = m.group(1).split("=")[0].strip().replace("const ", "")
            src = src[:m.end()] + f"\n      if ({varname}?.accessToken) setStoredToken({varname}.accessToken);" + src[m.end():]
            verify.write_text(src, encoding="utf-8")
            print("   ✅ VerifyOtpPage — saves token")
        else:
            # Looser — find "await verifyOtp" call
            m2 = re.search(r"await\s+verifyOtp\s*\([^)]*\)\s*;", src)
            if m2:
                src = src[:m2.end()] + "\n      if ((result as any)?.accessToken) setStoredToken((result as any).accessToken);" + src[m2.end():]
                verify.write_text(src, encoding="utf-8")
                print("   ✅ VerifyOtpPage — saves token (generic)")

# ═══════════════════════════════════════════════════════════════
# 4. Auth store — clear token on logout
# ═══════════════════════════════════════════════════════════════
print("\n[4] authStore.ts — clear token on logout")
store = ROOT / "src/store/authStore.ts"
if store.exists():
    src = store.read_text(encoding="utf-8")
    if "clearStoredToken" not in src:
        # Add import
        src = "import { clearStoredToken } from '@/utils/authStorage';\n" + src
        # Add clearStoredToken() in logout function if exists
        src = re.sub(
            r"(logout\s*:\s*(?:async\s*)?\(\)\s*=>\s*\{)",
            r"\1\n    clearStoredToken();",
            src, count=1,
        )
        store.write_text(src, encoding="utf-8")
        print("   ✅ authStore — clears token on logout")
    else:
        print("   ℹ️  already clears token")

print("\n" + "═" * 60)
print(" Done")
print("═" * 60)
print("""
Next:

  npx tsc --noEmit
  git add .
  git commit -m "Use localStorage JWT for cross-domain auth"
  git push
""")
