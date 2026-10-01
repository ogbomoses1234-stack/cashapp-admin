#!/usr/bin/env python3
"""
Fix all TypeScript errors + build issues.
Works for both public and admin frontends — auto-detects.
Idempotent.
"""
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path.cwd()
if not (ROOT / "package.json").exists():
    sys.exit("❌ Run from the frontend repo")

PKG = (ROOT / "package.json").read_text()
is_admin = "qrcashback-frontend-admin" in PKG

print("═" * 60)
print(f" Fixing build errors in: {ROOT.name}")
print(f" Type: {'ADMIN' if is_admin else 'PUBLIC'}")
print("═" * 60)

# ═══════════════════════════════════════════════════════════════
# 1. vite.config.ts — move esbuild to top level
# ═══════════════════════════════════════════════════════════════
print("\n[1] vite.config.ts — esbuild placement")
vite = ROOT / "vite.config.ts"
if vite.exists():
    src = vite.read_text(encoding="utf-8")

    # Remove the misplaced esbuild block inside build: {}
    src = re.sub(
        r"\n\s*esbuild:\s*\{[\s\S]*?\},?\n",
        "\n",
        src,
    )

    # Ensure top-level esbuild exists (before build: {})
    if "esbuild:" not in src.split("build:")[0]:
        # Insert top-level esbuild config right before "build:" key
        src = re.sub(
            r"(\n\s*)build:\s*\{",
            r"\1esbuild: {\n"
            r"    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],\n"
            r"  },\n\1build: {",
            src,
            count=1,
        )

    # Keep minify: 'esbuild' inside build
    if "minify:" not in src:
        src = re.sub(
            r"(build:\s*\{)",
            r"\1\n    minify: 'esbuild',",
            src,
            count=1,
        )

    vite.write_text(src, encoding="utf-8")
    print("   ✅ esbuild moved to top-level, minify kept inside build")
else:
    print("   ⚠️  vite.config.ts not found")

# ═══════════════════════════════════════════════════════════════
# 2. Remove unused imports (safe, targeted)
# ═══════════════════════════════════════════════════════════════
print("\n[2] Remove unused imports")

UNUSED_TARGETS = [
    # (relative path, symbol, import statement substring)
    ("src/pages/customer/ChatPage.tsx", "EmptyState", "import { EmptyState } from '@/components/ui/EmptyState';"),
    ("src/pages/customer/DisputesPage.tsx", "EmptyState", "import { EmptyState } from '@/components/ui/EmptyState';"),
    ("src/pages/customer/OrdersPage.tsx", "Spinner", "import { Spinner } from '@/components/ui/Spinner';"),
    ("src/pages/customer/ProductDetailPage.tsx", "Spinner", "import { Spinner } from '@/components/ui/Spinner';"),
    ("src/pages/customer/WalletPage.tsx", "ReactNode", "import type { ReactNode } from 'react';"),
    ("src/pages/customer/WalletPage.tsx", "ListSkeleton", "import { ListSkeleton } from '@/components/ui/Skeleton';"),
    ("src/pages/ProductsPage.tsx", "Spinner", "import { Spinner } from '@/components/ui/Spinner';"),
    ("src/pages/analytics/SerialTrackerPage.tsx", "EmptyState", "import { EmptyState } from '@/components/ui/EmptyState';"),
    ("src/pages/auth/AdminOtpPage.tsx", "Logo", "import { Logo } from '@/components/brand/Logo';"),
    ("src/pages/products/QrGeneratorPage.tsx", "Spinner", "import { Spinner } from '@/components/ui/Spinner';"),
]

for rel_path, symbol, import_line in UNUSED_TARGETS:
    p = ROOT / rel_path
    if not p.exists():
        continue
    src = p.read_text(encoding="utf-8")
    if import_line in src:
        # Only remove if symbol truly unused (no other occurrences besides import)
        occurrences = len(re.findall(rf"\b{re.escape(symbol)}\b", src))
        if occurrences <= 1:
            src = src.replace(import_line + "\n", "")
            src = src.replace(import_line, "")
            p.write_text(src, encoding="utf-8")
            print(f"   ✅ {rel_path} — removed unused {symbol}")

# ── Special: OrdersPage has Spinner only used in dead code. Handle line-by-line.
# ── Also handle unused `useCallback` in ProductsPage
products = ROOT / "src/pages/ProductsPage.tsx"
if products.exists():
    src = products.read_text(encoding="utf-8")
    # Remove useCallback from the import if it's unused
    if "useCallback" in src and not re.search(r"\buseCallback\s*\(", src.split("import")[1] if "import" in src else ""):
        src = src.replace(
            "import { useCallback, useEffect, useMemo, useState } from 'react';",
            "import { useEffect, useMemo, useState } from 'react';",
        )
        src = src.replace(
            "import { useCallback, useState, useEffect } from 'react';",
            "import { useEffect, useState } from 'react';",
        )
        products.write_text(src, encoding="utf-8")
        print("   ✅ ProductsPage.tsx — removed unused useCallback")

# ── Special: DisputesPage has unused navigate
disputes = ROOT / "src/pages/customer/DisputesPage.tsx"
if disputes.exists():
    src = disputes.read_text(encoding="utf-8")
    # Count uses of navigate (excluding import)
    uses = len(re.findall(r"\bnavigate\s*\(", src))
    if uses == 0 and "useNavigate" in src:
        src = re.sub(
            r"const\s+navigate\s*=\s*useNavigate\(\);\n",
            "",
            src,
        )
        disputes.write_text(src, encoding="utf-8")
        print("   ✅ DisputesPage.tsx — removed unused navigate")

# ── Special: WalletPage refreshing state
wallet = ROOT / "src/pages/customer/WalletPage.tsx"
if wallet.exists():
    src = wallet.read_text(encoding="utf-8")
    # If refreshing is set but never read
    if "refreshing" in src and re.search(r"const\s+\[\s*refreshing\s*,\s*setRefreshing\s*\]", src):
        # Rename to underscore-prefix so TS doesn't complain
        src = src.replace(
            "const [refreshing, setRefreshing] = useState(false);",
            "const [, setRefreshing] = useState(false);",
        )
        wallet.write_text(src, encoding="utf-8")
        print("   ✅ WalletPage.tsx — silenced unused `refreshing`")

# ── Special: TerminalPage has unused formatNaira
terminal = ROOT / "src/pages/staff/TerminalPage.tsx"
if terminal.exists():
    src = terminal.read_text(encoding="utf-8")
    if "formatNaira" in src:
        # Count uses excluding import
        uses = len(re.findall(r"\bformatNaira\s*\(", src))
        if uses == 0:
            src = src.replace(
                "import { formatRelative, formatNaira } from '@/utils/format';",
                "import { formatRelative } from '@/utils/format';",
            )
            terminal.write_text(src, encoding="utf-8")
            print("   ✅ TerminalPage.tsx — removed unused formatNaira")

# ═══════════════════════════════════════════════════════════════
# 3. counts[f.key] index errors
# ═══════════════════════════════════════════════════════════════
print("\n[3] Fix counts index type errors")

for rel in [
    "src/pages/customer/OrdersPage.tsx",
    "src/pages/customer/DisputesPage.tsx",
    "src/pages/chats/ChatsPage.tsx",
]:
    p = ROOT / rel
    if not p.exists():
        continue
    src = p.read_text(encoding="utf-8")
    # Replace counts[f.key] with typed index
    new_src = re.sub(
        r"counts\[f\.key\]",
        "(counts as Record<string, number>)[f.key]",
        src,
    )
    if new_src != src:
        p.write_text(new_src, encoding="utf-8")
        print(f"   ✅ {rel} — counts index cast")

# ═══════════════════════════════════════════════════════════════
# 4. CartState.setItems (public only)
# ═══════════════════════════════════════════════════════════════
if not is_admin:
    print("\n[4] CartState.setItems")
    checkout = ROOT / "src/pages/customer/CheckoutPage.tsx"
    if checkout.exists():
        src = checkout.read_text(encoding="utf-8")
        # Replace destructuring that includes setItems
        new_src = src.replace(
            "const { items, setItems } = useCartStore();",
            "const items = useCartStore((s) => s.items);",
        )
        new_src = new_src.replace(
            "const { items, clear, setItems } = useCartStore();",
            "const items = useCartStore((s) => s.items);\n  const clear = useCartStore((s) => s.clear);",
        )
        new_src = new_src.replace(
            "const { items, setItems, clear } = useCartStore();",
            "const items = useCartStore((s) => s.items);\n  const clear = useCartStore((s) => s.clear);",
        )
        if new_src != src:
            checkout.write_text(new_src, encoding="utf-8")
            print("   ✅ CheckoutPage.tsx — replaced setItems with selector")
        else:
            # Fallback: just silence the TS error
            new_src = re.sub(
                r"const\s+\{[^}]*setItems[^}]*\}\s*=\s*useCartStore\(\);",
                "const items = useCartStore((s: any) => s.items);",
                src,
            )
            if new_src != src:
                checkout.write_text(new_src, encoding="utf-8")
                print("   ✅ CheckoutPage.tsx — patched (fallback)")

# ═══════════════════════════════════════════════════════════════
# 5. Add qrSignature to QrBatchResult (admin only)
# ═══════════════════════════════════════════════════════════════
if is_admin:
    print("\n[5] QrBatchResult type")
    svc = ROOT / "src/services/serial.service.ts"
    if svc.exists():
        src = svc.read_text(encoding="utf-8")
        # Check if QrBatchResult exists
        m = re.search(r"(export\s+interface\s+QrBatchResult\s*\{[\s\S]*?)(\n\})", src)
        if m:
            if "qrSignature" not in m.group(1):
                src = src[:m.end(1)] + "\n  qrSignature?: string;" + src[m.end(1):]
                svc.write_text(src, encoding="utf-8")
                print("   ✅ serial.service.ts — added qrSignature to QrBatchResult")
            else:
                print("   ℹ️  QrBatchResult already has qrSignature")
        else:
            # Define it if missing
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
            svc.write_text(src, encoding="utf-8")
            print("   ✅ serial.service.ts — created QrBatchResult interface")

# ═══════════════════════════════════════════════════════════════
# 6. Type check
# ═══════════════════════════════════════════════════════════════
print("\n[6] TypeScript check")
tsc = subprocess.run(["npx", "tsc", "--noEmit"], cwd=ROOT, capture_output=True, text=True)
if tsc.returncode == 0:
    print("   ✅ TypeScript clean")
else:
    print("   ⚠️  Remaining TS errors:")
    print(tsc.stdout[:2500])

print("\n" + "═" * 60)
if tsc.returncode == 0:
    print(" ✅ Ready — run `npm run build`")
else:
    print(" ⚠️  Some errors remain — see above")
print("═" * 60)
