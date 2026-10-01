#!/usr/bin/env python3
"""
Fix 3 TS errors:
  1. ChatsPage.tsx — remove unused Badge import
  2. ChatsPage.tsx — fix counts[f.key] index type
  3. product.service.ts — add missing toggleFeatured export
"""
from pathlib import Path
import re

ROOT = Path.home() / "qrcashback-frontend-admin"
if not (ROOT / "package.json").exists():
    raise SystemExit(f"❌ Not the admin repo: {ROOT}")

# ─────────────────────────────────────────────
# 1. ChatsPage.tsx — remove unused Badge import
# ─────────────────────────────────────────────
chats = ROOT / "src/pages/chats/ChatsPage.tsx"
if chats.exists():
    src = chats.read_text(encoding="utf-8")

    # Remove Badge import
    new = re.sub(r"^import\s*\{\s*Badge\s*\}\s*from\s*'@/components/ui/Badge';\s*\n", "", src, flags=re.MULTILINE)
    if new != src:
        print("✅ ChatsPage.tsx — removed unused Badge import")
        src = new
    else:
        print("ℹ️  ChatsPage.tsx — Badge import not found or already removed")

    # Fix counts indexing — cast `counts` access to number safely
    if "counts[f.key]" in src:
        # Replace with a safe lookup that tolerates missing keys
        src = src.replace(
            "const n = counts[f.key] ?? 0;",
            "const n = (counts as Record<string, number>)[f.key] ?? 0;",
        )
        print("✅ ChatsPage.tsx — fixed counts index lookup")

    chats.write_text(src, encoding="utf-8")
else:
    print("⚠️  ChatsPage.tsx not found")

# ─────────────────────────────────────────────
# 2. product.service.ts — add toggleFeatured export
# ─────────────────────────────────────────────
svc = ROOT / "src/services/product.service.ts"
if svc.exists():
    src = svc.read_text(encoding="utf-8")

    if "toggleFeatured" not in src:
        # Append a new exported function at the end of the file
        addition = '''

/**
 * Feature / unfeature a product on the home page carousel.
 * Calls PATCH /api/admin/products/:id/feature
 */
export async function toggleFeatured(
  id: string,
  isFeatured: boolean
): Promise<AdminProduct> {
  const data = await patch<unknown>(`/api/admin/products/${id}/feature`, { isFeatured });
  const obj = (data ?? {}) as Record<string, unknown>;
  const raw = (obj.product ?? obj) as Record<string, unknown>;
  return normalizeProduct(raw);
}
'''
        src = src.rstrip() + addition
        svc.write_text(src, encoding="utf-8")
        print("✅ product.service.ts — added toggleFeatured export")
    else:
        print("ℹ️  product.service.ts — toggleFeatured already present")
else:
    print("⚠️  product.service.ts not found")

print("\nNext:  npx tsc --noEmit")
