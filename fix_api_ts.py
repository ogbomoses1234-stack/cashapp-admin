#!/usr/bin/env python3
"""
Robust api.ts patcher:
1. Removes all existing interceptors (clean slate)
2. Fixes the authStorage import
3. Inserts interceptors AFTER axios.create() — not before
"""
import re
from pathlib import Path

ROOT = Path.cwd()
api_file = ROOT / "src/services/api.ts"

if not api_file.exists():
    raise SystemExit("❌ src/services/api.ts not found")

src = api_file.read_text(encoding="utf-8")
original = src

# ═══════════════════════════════════════════════════════════
# 1. Remove ALL existing interceptors and JWT imports
# ═══════════════════════════════════════════════════════════
src = re.sub(
    r"// ═+\n// JWT handling[\s\S]*?(?=\n\n//|/\*\*|import |const |export |$)",
    "",
    src,
)
src = re.sub(
    r"// ═+\n// Inject JWT[\s\S]*?(?=\n\n//|/\*\*|import |const |export |$)",
    "",
    src,
)
# Remove any orphaned interceptor blocks
src = re.sub(
    r"api\.interceptors\.(request|response)\.use\([\s\S]*?\n\}\);\s*\n?",
    "",
    src,
)
# Remove any authStorage import
src = re.sub(
    r"import\s*\{[^}]*\}\s*from\s*['\"]@/utils/authStorage['\"];?\s*\n?",
    "",
    src,
)

# ═══════════════════════════════════════════════════════════
# 2. Add clean import at the top
# ═══════════════════════════════════════════════════════════
src = "import { getStoredToken, setStoredToken } from '@/utils/authStorage';\n" + src

# ═══════════════════════════════════════════════════════════
# 3. Find axios.create( ... ); and insert interceptors after
# ═══════════════════════════════════════════════════════════
idx = src.find("axios.create")
if idx < 0:
    raise SystemExit("❌ axios.create not found in api.ts")

# Find the opening paren
open_paren = src.find("(", idx)
if open_paren < 0:
    raise SystemExit("❌ malformed axios.create call")

# Walk to find matching close paren (handles nested parens)
depth = 1
i = open_paren + 1
while i < len(src) and depth > 0:
    if src[i] == "(":
        depth += 1
    elif src[i] == ")":
        depth -= 1
    i += 1

# Find the semicolon that ends the statement
semi = src.find(";", i)
if semi < 0:
    raise SystemExit("❌ could not find end of axios.create statement")

insert_at = semi + 1

interceptors = """

// ═══════════════════════════════════════════════════════════
// JWT handling for cross-domain deployments
// (sslip.io testing; will use httpOnly cookies when we move
// to vickkyaku.com in production.)
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

// 2. Auto-save any accessToken the API returns
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
"""

src = src[:insert_at] + interceptors + src[insert_at:]

api_file.write_text(src, encoding="utf-8")
print("✅ api.ts cleaned and patched")
print("   - authStorage import fixed")
print("   - interceptors placed AFTER axios.create")
