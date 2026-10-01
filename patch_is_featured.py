#!/usr/bin/env python3
"""
Add isFeatured to:
  1. src/types/index.ts        (AdminProduct interface)
  2. src/services/product.service.ts  (normalizeProduct + ProductInput)
Idempotent — safe to re-run.
"""
from pathlib import Path
import re

ROOT = Path.home() / "qrcashback-frontend-admin"
if not (ROOT / "package.json").exists():
    raise SystemExit(f"❌ Not the admin repo: {ROOT}")

# ─────────────────────────────────────────────
# 1. src/types/index.ts — add to AdminProduct
# ─────────────────────────────────────────────
types_path = ROOT / "src/types/index.ts"
if types_path.exists():
    src = types_path.read_text(encoding="utf-8")

    # Find AdminProduct interface
    if "interface AdminProduct" not in src:
        print("⚠️  AdminProduct interface not found in types/index.ts")
    elif "isFeatured" in src:
        print("ℹ️  AdminProduct already has isFeatured")
    else:
        # Insert isFeatured right before `createdAt` inside AdminProduct
        pattern = r"(interface AdminProduct\s*\{[\s\S]*?)(\n\s*createdAt\s*:\s*string;?)"
        replacement = r"\1\n  isFeatured?: boolean;\2"
        new_src, n = re.subn(pattern, replacement, src, count=1)
        if n == 0:
            # Fallback: insert before the closing brace
            pattern = r"(interface AdminProduct\s*\{[\s\S]*?)(\n\})"
            new_src, n = re.subn(pattern, r"\1\n  isFeatured?: boolean;\2", src, count=1)
        if n > 0:
            types_path.write_text(new_src, encoding="utf-8")
            print("✅ types/index.ts — added isFeatured to AdminProduct")
        else:
            print("⚠️  Could not insert into AdminProduct — add manually")
else:
    print("⚠️  types/index.ts not found")

# ─────────────────────────────────────────────
# 2. src/services/product.service.ts
#    - add isFeatured to normalizeProduct
#    - add isFeatured to ProductInput
# ─────────────────────────────────────────────
svc_path = ROOT / "src/services/product.service.ts"
if svc_path.exists():
    src = svc_path.read_text(encoding="utf-8")
    changed = False

    # ── a) normalizeProduct — add isFeatured line after isActive line
    if "isFeatured:" not in src.split("ProductInput")[0]:
        # Normalizer block — look for `isActive:` assignment
        pattern = r"(isActive:\s*bool\([^)]*\),)"
        match = re.search(pattern, src)
        if match:
            insert_after = match.group(1)
            new_line = "\n    isFeatured: Boolean(r.isFeatured ?? r.is_featured ?? false),"
            if "isFeatured:" not in insert_after:
                src = src.replace(insert_after, insert_after + new_line, 1)
                changed = True
                print("✅ product.service.ts — added isFeatured to normalizer")
        else:
            print("⚠️  Could not find isActive in normalizer — add isFeatured manually")
    else:
        print("ℹ️  normalizer already has isFeatured")

    # ── b) ProductInput — add isFeatured field
    input_match = re.search(r"interface ProductInput\s*\{([\s\S]*?)\}", src)
    if input_match:
        block = input_match.group(1)
        if "isFeatured" not in block:
            new_block = block.rstrip() + "\n  isFeatured?: boolean;\n"
            src = src.replace(input_match.group(0), f"interface ProductInput {{{new_block}}}", 1)
            changed = True
            print("✅ product.service.ts — added isFeatured to ProductInput")
        else:
            print("ℹ️  ProductInput already has isFeatured")
    else:
        print("⚠️  ProductInput interface not found")

    if changed:
        svc_path.write_text(src, encoding="utf-8")
else:
    print("⚠️  services/product.service.ts not found")

print("\nNext:  cd ~/qrcashback-frontend-admin && npx tsc --noEmit")
