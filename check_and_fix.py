#!/usr/bin/env python3
"""
Verify the Full Update — Products CRUD + Feature Toggle
Applies only what's missing.
"""
import re
import subprocess
from pathlib import Path

ADMIN = Path.home() / "qrcashback-frontend-admin"
BACKEND = Path.home() / "qrcashback-backend"

print("═" * 60)
print(" Checking what's missing")
print("═" * 60)

# ═══════════════════════════════════════════════════════════════
# 1. AdminProduct.isFeatured
# ═══════════════════════════════════════════════════════════════
print("\n[1] AdminProduct.isFeatured")
types = ADMIN / "src/types/index.ts"
if types.exists() and "isFeatured" in types.read_text():
    print("  ✅ DONE")
else:
    print("  ❌ MISSING — would need manual patch")

# ═══════════════════════════════════════════════════════════════
# 2. toggleFeatured in product.service
# ═══════════════════════════════════════════════════════════════
print("\n[2] toggleFeatured() in product.service.ts")
svc = ADMIN / "src/services/product.service.ts"
if svc.exists() and "export async function toggleFeatured" in svc.read_text():
    print("  ✅ DONE")
else:
    print("  ❌ MISSING")

# ═══════════════════════════════════════════════════════════════
# 3. ★ column in ProductsPage
# ═══════════════════════════════════════════════════════════════
print("\n[3] ★ column in ProductsPage.tsx")
pp = ADMIN / "src/pages/products/ProductsPage.tsx"
if pp.exists():
    src = pp.read_text(encoding="utf-8")
    has_featured_col = "key: 'featured'" in src or 'key: "featured"' in src
    has_toggle_import = "toggleFeatured" in src
    if has_featured_col and has_toggle_import:
        print("  ✅ DONE — ★ column + toggleFeatured import present")
    else:
        print(f"  ❌ MISSING — feature column={has_featured_col}, toggle import={has_toggle_import}")
        print("     → The Full Update guide's ProductsPage.tsx rewrite must be applied")
else:
    print("  ⚠️  ProductsPage.tsx not found")

# ═══════════════════════════════════════════════════════════════
# 4. Backend PATCH /:id/feature route
# ═══════════════════════════════════════════════════════════════
print("\n[4] Backend PATCH /products/:id/feature route")
found_route = False
if BACKEND.exists():
    result = subprocess.run(
        ["grep", "-rn", "id/feature\\|featureToggle", str(BACKEND / "src"), "--include=*.ts"],
        capture_output=True,
        text=True,
    )
    if result.stdout.strip():
        found_route = True
        print("  ✅ DONE — matches:")
        for line in result.stdout.strip().split("\n")[:5]:
            print(f"     {line}")
    else:
        print("  ❌ MISSING — no route/handler found")
else:
    print("  ⚠️  Backend repo not at ~/qrcashback-backend")

# ═══════════════════════════════════════════════════════════════
# Summary
# ═══════════════════════════════════════════════════════════════
print("\n" + "═" * 60)
print(" Summary")
print("═" * 60)

if not (pp.exists() and "key: 'featured'" in pp.read_text()):
    print("\n→ ACTION NEEDED: rewrite ProductsPage.tsx")
    print("  The Full Update guide's full-file replacement is required.")
    print("  Paste it into: ~/qrcashback-frontend-admin/src/pages/products/ProductsPage.tsx")

if not found_route and BACKEND.exists():
    print("\n→ ACTION NEEDED: add backend feature toggle route")
    print("  Paste into: ~/qrcashback-backend/src/routes/admin/product.routes.ts")

if found_route and pp.exists() and "key: 'featured'" in pp.read_text():
    print("\n🎉 Everything is in place. Build and test:")
    print("     rm -rf node_modules/.vite && npm run build && npm run dev")
    print("     → http://localhost:5174/products")
