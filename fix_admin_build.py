#!/usr/bin/env python3
"""
Fix remaining 5 errors in the admin frontend:
  1. Remove local QrBatchResult that conflicts with @/types
  2. Add qrSignature to the real QrBatchResult in @/types
  3. Remove 3 unused imports (EmptyState, Logo, Spinner)
"""
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path.cwd()
if not (ROOT / "package.json").exists():
    sys.exit("❌ Run from ~/qrcashback-frontend-admin")

print("═" * 60)
print(" Fix admin build errors")
print("═" * 60)

# ═══════════════════════════════════════════════════════════════
# 1. serial.service.ts — remove local QrBatchResult interface
# ═══════════════════════════════════════════════════════════════
print("\n[1] serial.service.ts — remove local QrBatchResult")

svc = ROOT / "src/services/serial.service.ts"
if svc.exists():
    src = svc.read_text(encoding="utf-8")

    # Remove any local QrBatchResult interface declaration
    # Handle: export interface QrBatchResult { ... }
    #         interface QrBatchResult { ... }
    src = re.sub(
        r"\n\s*(?:export\s+)?interface\s+QrBatchResult\s*\{[\s\S]*?\n\s*\}\s*\n",
        "\n",
        src,
    )
    print("   ✅ Removed local QrBatchResult interface")

    svc.write_text(src, encoding="utf-8")
else:
    print("   ⚠️  serial.service.ts not found")

# ═══════════════════════════════════════════════════════════════
# 2. types/index.ts — ensure QrBatchResult has qrSignature
# ═══════════════════════════════════════════════════════════════
print("\n[2] types/index.ts — add qrSignature to QrBatchResult")

types = ROOT / "src/types/index.ts"
if types.exists():
    src = types.read_text(encoding="utf-8")

    m = re.search(
        r"(export\s+interface\s+QrBatchResult\s*\{[\s\S]*?)(\n\})",
        src,
    )
    if m:
        if "qrSignature" not in m.group(1):
            src = src[:m.end(1)] + "\n  qrSignature?: string;" + src[m.end(1):]
            types.write_text(src, encoding="utf-8")
            print("   ✅ Added qrSignature to QrBatchResult")
        else:
            print("   ℹ️  QrBatchResult already has qrSignature")
    else:
        # Interface doesn't exist — create it
        src += """

export interface QrBatchResult {
  id?: string;
  serialNumber?: string;
  productTitle?: string;
  qrSignature?: string;
  status?: string;
  batchId?: string;
  createdAt?: string;
}
"""
        types.write_text(src, encoding="utf-8")
        print("   ✅ Created QrBatchResult interface")
else:
    print("   ⚠️  types/index.ts not found")

# ═══════════════════════════════════════════════════════════════
# 3. Remove the 3 unused imports
# ═══════════════════════════════════════════════════════════════
print("\n[3] Remove unused imports")

def remove_unused_import(rel_path: str, import_line: str, symbol: str):
    p = ROOT / rel_path
    if not p.exists():
        return
    src = p.read_text(encoding="utf-8")
    if import_line not in src:
        return
    # Verify the symbol truly isn't used elsewhere
    uses = len(re.findall(rf"\b{re.escape(symbol)}\b", src))
    if uses <= 1:
        src = src.replace(import_line + "\n", "")
        src = src.replace(import_line, "")
        p.write_text(src, encoding="utf-8")
        print(f"   ✅ {rel_path} — removed {symbol}")

remove_unused_import(
    "src/pages/analytics/SerialTrackerPage.tsx",
    "import { EmptyState } from '@/components/ui/EmptyState';",
    "EmptyState",
)
remove_unused_import(
    "src/pages/auth/AdminOtpPage.tsx",
    "import { Logo } from '@/components/brand/Logo';",
    "Logo",
)
remove_unused_import(
    "src/pages/products/QrGeneratorPage.tsx",
    "import { Spinner } from '@/components/ui/Spinner';",
    "Spinner",
)

# ═══════════════════════════════════════════════════════════════
# 4. Type check
# ═══════════════════════════════════════════════════════════════
print("\n[4] TypeScript check")
tsc = subprocess.run(["npx", "tsc", "--noEmit"], cwd=ROOT, capture_output=True, text=True)
if tsc.returncode == 0:
    print("   ✅ TypeScript clean")
else:
    print("   ⚠️  Remaining TS errors:")
    print(tsc.stdout[:2000])

print("\n" + "═" * 60)
if tsc.returncode == 0:
    print(" ✅ Ready — run npm run build")
else:
    print(" ⚠️  Some errors remain")
print("═" * 60)
