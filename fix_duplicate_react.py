#!/usr/bin/env python3
"""
Fix duplicate React in Vite dev server.
- Adds resolve.dedupe to vite.config.ts
- Clears .vite cache
- Verifies only one React in node_modules
"""
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path.cwd()
if not (ROOT / "package.json").exists():
    sys.exit("❌ Run from a frontend repo")

print("═" * 60)
print(f" Fix duplicate React in: {ROOT.name}")
print("═" * 60)

# ═══════════════════════════════════════════════════════════════
# 1. Check for duplicate React in node_modules
# ═══════════════════════════════════════════════════════════════
print("\n[1] Check installed React versions")
r = subprocess.run(
    ["npm", "ls", "react", "react-dom", "--depth=0"],
    cwd=ROOT, capture_output=True, text=True,
)
print(r.stdout.strip() or r.stderr.strip())

# ═══════════════════════════════════════════════════════════════
# 2. Add resolve.dedupe to vite.config.ts
# ═══════════════════════════════════════════════════════════════
print("\n[2] Add resolve.dedupe")

vite = ROOT / "vite.config.ts"
src = vite.read_text(encoding="utf-8")

if "dedupe" in src:
    print("   ℹ️  dedupe already present")
else:
    # Insert resolve.dedupe after plugins: [...] or right after defineConfig({
    if "resolve:" in src:
        # Existing resolve block — add dedupe inside it
        src = re.sub(
            r"(resolve:\s*\{)",
            r"\1\n    dedupe: ['react', 'react-dom', 'react-router-dom'],",
            src, count=1,
        )
    else:
        # Add a fresh resolve block after plugins
        src = re.sub(
            r"(plugins:\s*\[[^\]]*\],)",
            r"\1\n  resolve: {\n    dedupe: ['react', 'react-dom', 'react-router-dom'],\n  },",
            src, count=1,
        )
    vite.write_text(src, encoding="utf-8")
    print("   ✅ dedupe added to vite.config.ts")

# ═══════════════════════════════════════════════════════════════
# 3. Add optimizeDeps to force fresh pre-bundling
# ═══════════════════════════════════════════════════════════════
if "optimizeDeps" not in src:
    src = vite.read_text(encoding="utf-8")
    src = re.sub(
        r"(defineConfig\(\{)",
        r"\1\n  optimizeDeps: {\n    force: true,\n    include: ['react', 'react-dom', 'react/jsx-runtime', 'zustand'],\n  },",
        src, count=1,
    )
    vite.write_text(src, encoding="utf-8")
    print("   ✅ optimizeDeps.force added")

# ═══════════════════════════════════════════════════════════════
# 4. Clear Vite cache
# ═══════════════════════════════════════════════════════════════
print("\n[4] Clear Vite caches")
subprocess.run(["rm", "-rf", str(ROOT / "node_modules/.vite")], check=False)
subprocess.run(["rm", "-rf", str(ROOT / "dist")], check=False)
subprocess.run(["rm", "-rf", str(ROOT / ".vite")], check=False)
print("   ✅ Removed node_modules/.vite, dist, .vite")

# ═══════════════════════════════════════════════════════════════
# 5. Show final vite.config.ts
# ═══════════════════════════════════════════════════════════════
print("\n[5] Current vite.config.ts:")
print(vite.read_text(encoding="utf-8"))

print("\n" + "═" * 60)
print(" ✅ Done")
print("═" * 60)
print("""
Next:

  # 1. Stop this frontend (Ctrl+C)
  # 2. Restart it:
  npm run dev

  # 3. Hard-refresh the browser:
  #    Mac: Cmd + Shift + R
  #    Phone: close tab, reopen
""")
