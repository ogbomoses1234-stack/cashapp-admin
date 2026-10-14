#!/usr/bin/env python3
"""
Auto-save any accessToken in API responses to localStorage.
Also sends it as Authorization header on every request.
"""
import re
from pathlib import Path

ROOT = Path.cwd()
api_file = ROOT / "src/services/api.ts"

if not api_file.exists():
    raise SystemExit("❌ src/services/api.ts not found")

src = api_file.read_text(encoding="utf-8")

# Ensure import
if "authStorage" not in src:
    src = "import { getStoredToken, setStoredToken } from '@/utils/authStorage';\n" + src

# Remove any existing interceptors so we don't duplicate
src = re.sub(
    r"// ═+\n// Inject JWT from localStorage[\s\S]*?\n\}\);\n\n",
    "",
    src,
)
src = re.sub(
    r"api\.interceptors\.response\.use\([\s\S]*?\n\}\);\n\n?",
    "",
    src,
)

interceptors = '''
// ═══════════════════════════════════════════════════════════
// JWT handling for cross-domain deployments
// ═══════════════════════════════════════════════════════════

// 1. Attach stored token to every outgoing request
api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

// 2. Auto-save any accessToken returned by the API
api.interceptors.response.use((response) => {
  const payload: any = response?.data;
  const token =
    payload?.data?.accessToken ??
    payload?.accessToken ??
    payload?.data?.data?.accessToken;
  if (typeof token === 'string' && token.length > 30) {
    setStoredToken(token);
  }
  return response;
});

'''

# Find axios instance creation and inject interceptors right after
m = re.search(r"(const\s+api\s*=\s*axios\.create\s*\([\s\S]*?\)\s*;)", src)
if m:
    src = src[:m.end()] + "\n" + interceptors + src[m.end():]
else:
    src = interceptors + src

api_file.write_text(src, encoding="utf-8")
print("✅ api.ts patched — request + response interceptors installed")
