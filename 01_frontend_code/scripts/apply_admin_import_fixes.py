#!/usr/bin/env python3
"""Run from repo root AFTER restructure-admin-module.sh.
Updates imports, splits organization API into domain files, writes api/hooks barrels,
updates routes.tsx + index.ts paths, adds types/* domain re-exports.

Full implementation is large; if this file is incomplete after clone, use the
companion script from the project artifacts or re-run from the agent deliverable.
"""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path("01_frontend_code/src/modules/admin")

def main() -> None:
    # Prefer external full script if present next to this file
    sibling = Path(__file__).with_name("apply_admin_import_fixes_full.py")
    if sibling.is_file():
        print("Delegating to", sibling)
        code = compile(sibling.read_text(encoding="utf-8"), str(sibling), "exec")
        exec(code, {"__name__": "__main__", "__file__": str(sibling)})
        return

    print("ERROR: Full apply script not found.")
    print("Expected either:")
    print("  1) 01_frontend_code/scripts/apply_admin_import_fixes_full.py")
    print("  2) Or re-pull the complete apply_admin_import_fixes.py from the agent.")
    print("After restructure-admin-module.sh, the apply step must rewrite imports")
    print("and split api/organization.ts into location/shift/working-week/holiday-calendar/position/department.")
    sys.exit(1)

if __name__ == "__main__":
    main()
