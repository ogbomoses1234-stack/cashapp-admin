#!/usr/bin/env python3
"""
Force-remove the 3 unused imports — no safety checks.
TypeScript already confirmed they're unused.
"""
from pathlib import Path

ROOT = Path.cwd()

TARGETS = [
    (
        "src/pages/analytics/SerialTrackerPage.tsx",
        "import { EmptyState } from '@/components/ui/EmptyState';",
    ),
    (
        "src/pages/auth/AdminOtpPage.tsx",
        "import { Logo } from '@/components/brand/Logo';",
    ),
    (
        "src/pages/products/QrGeneratorPage.tsx",
        "import { Spinner } from '@/components/ui/Spinner';",
    ),
]

for rel_path, line in TARGETS:
    p = ROOT / rel_path
    if not p.exists():
        print(f"⚠️  {rel_path} not found")
        continue

    src = p.read_text(encoding="utf-8")

    # Try with newline first
    if line + "\n" in src:
        src = src.replace(line + "\n", "", 1)
        p.write_text(src, encoding="utf-8")
        print(f"✅ Removed from {rel_path}")
    elif line in src:
        src = src.replace(line, "", 1)
        p.write_text(src, encoding="utf-8")
        print(f"✅ Removed (no newline) from {rel_path}")
    else:
        print(f"ℹ️  Line not found in {rel_path}")
        print(f"   Looking for: {line}")
        # Show first 5 imports for debugging
        for i, l in enumerate(src.split("\n")[:10], 1):
            if l.startswith("import"):
                print(f"   {i}: {l}")
