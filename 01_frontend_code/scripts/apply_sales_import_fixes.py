#!/usr/bin/env python3
"""Run from repo root AFTER restructure-sales-module.sh.
Rewrites relative imports for domain depth (+1), updates routes/index if needed.
"""
from __future__ import annotations
from pathlib import Path

ROOT = Path("01_frontend_code/src/modules/sales")

def rewrite(text: str, pairs: list[tuple[str, str]]) -> str:
    for a, b in pairs:
        text = text.replace(a, b)
    return text

# Files moved one level deeper (hooks/*/*, pages/*/*, components/*/*, schemas/*/*)
DEPTH1 = [
    ("from '../api/sales'", "from '../../api/sales'"),
    ("from '../api/sources'", "from '../../api/source'"),
    ("from '../api/source'", "from '../../api/source'"),
    ("from '../api/lead'", "from '../../api/lead'"),
    ("from '../api/client'", "from '../../api/client'"),
    ("from '../types'", "from '../../types'"),
    ("from '../routes'", "from '../../routes'"),
    ("from '../schemas/enums'", "from '../../schemas/enums'"),
    ("from '../schemas/lead'", "from '../../schemas/lead/lead'"),
    ("from '../schemas/lead-form'", "from '../../schemas/lead/lead-form'"),
    ("from '../schemas/client'", "from '../../schemas/client/client'"),
    ("from '../schemas/client-form'", "from '../../schemas/client/client-form'"),
    ("from '../schemas/case-study'", "from '../../schemas/case-study/case-study'"),
    ("from '../schemas/case-study-form'", "from '../../schemas/case-study/case-study-form'"),
    ("from '../schemas/activity'", "from '../../schemas/activity/activity'"),
    ("from '../lib/", "from '../../lib/"),
    ("from '../data/", "from '../../data/"),
    ("from '../components/LeadMetricsRow'", "from '../../components/lead/LeadMetricsRow'"),
    ("from './use-sales'", "from '../use-sales'"),
    ("from './sales-cache'", "from '../sales-cache'"),
    ("from '../hooks/use-leads-list'", "from '../../hooks/lead/use-leads'"),
    ("from '../hooks/use-clients-list'", "from '../../hooks/client/use-clients'"),
    ("from '../hooks/use-case-studies-list'", "from '../../hooks/case-study/use-case-studies'"),
    ("from '../hooks/use-sales-dashboard'", "from '../../hooks/dashboard/use-dashboard'"),
    ("from '../hooks/use-sales'", "from '../../hooks/use-sales'"),
]

def process_tree(sub: str) -> None:
    base = ROOT / sub
    if not base.exists():
        return
    for p in base.rglob("*"):
        if p.suffix not in {".ts", ".tsx"} or not p.is_file():
            continue
        # only domain subfolders (one extra level)
        rel = p.relative_to(ROOT)
        if len(rel.parts) < 3:
            continue
        text = p.read_text(encoding="utf-8")
        new = rewrite(text, DEPTH1)
        if new != text:
            p.write_text(new, encoding="utf-8")
            print("updated", p)

def main() -> None:
    for sub in ("hooks", "pages", "components", "schemas"):
        process_tree(sub)
    print("done")

if __name__ == "__main__":
    main()
