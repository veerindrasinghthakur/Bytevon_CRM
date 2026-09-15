#!/usr/bin/env bash
# Complete sales domain restructure — run from repo root (bytevon_documentation).
# Moves page bodies into domain folders, fixes relative imports, removes thin re-exports.
# Same pattern as projects module restructure.
set -euo pipefail

ROOT="01_frontend_code/src/modules/sales"
if [[ ! -d "$ROOT" ]]; then
  echo "ERROR: run from repo root (directory with 01_frontend_code/)"
  exit 1
fi

cd "$ROOT"
echo "==> sales module: $(pwd)"

# --- 1. Move flat page bodies into domain folders (overwrite thin re-export stubs) ---
move_page() {
  local flat="$1"
  local domain="$2"
  local name
  name="$(basename "$flat")"
  mkdir -p "pages/$domain"
  if [[ -f "pages/$flat" ]]; then
    if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
      git mv -f "pages/$flat" "pages/$domain/$name" 2>/dev/null \
        || { mv -f "pages/$flat" "pages/$domain/$name"; git add -A "pages/$domain/$name" "pages/$flat" 2>/dev/null || true; }
    else
      mv -f "pages/$flat" "pages/$domain/$name"
    fi
    echo "  moved pages/$flat -> pages/$domain/$name"
  elif [[ -f "pages/$domain/$name" ]]; then
    echo "  already at pages/$domain/$name"
  else
    echo "  WARN: missing pages/$flat"
  fi
}

move_page LeadsListPage.tsx lead
move_page LeadCreatePage.tsx lead
move_page LeadDetailPage.tsx lead
move_page ClientsListPage.tsx client
move_page ClientCreatePage.tsx client
move_page ClientDetailPage.tsx client
move_page CaseStudiesListPage.tsx case-study
move_page SourcesListPage.tsx source
move_page SalesDashboardPage.tsx dashboard
move_page SalesAnalyticsPage.tsx dashboard
move_page SalesActivityTimelinePage.tsx activity

# --- 2. Deepen relative imports (pages now one level deeper) ---
deepen_imports() {
  local f="$1"
  [[ -f "$f" ]] || return 0
  if command -v sed >/dev/null; then
    if sed --version >/dev/null 2>&1; then
      sed -i -E \
        -e "s|from '\\.\\./(hooks|components|routes|types|schemas|api|data|lib)|from '../../\\1|g" \
        -e 's|from "\.\./(hooks|components|routes|types|schemas|api|data|lib)|from "../../\1|g' \
        "$f"
    else
      sed -i '' -E \
        -e "s|from '\\.\\./(hooks|components|routes|types|schemas|api|data|lib)|from '../../\\1|g" \
        -e 's|from "\.\./(hooks|components|routes|types|schemas|api|data|lib)|from "../../\1|g' \
        "$f"
    fi
  fi
  echo "  imports fixed: $f"
}

for f in \
  pages/lead/*.tsx \
  pages/client/*.tsx \
  pages/case-study/*.tsx \
  pages/source/*.tsx \
  pages/dashboard/*.tsx \
  pages/activity/*.tsx
do
  deepen_imports "$f"
done

# --- 3. routes.tsx + index.ts already on main (domain paths) — ensure present ---
if ! grep -q "pages/lead/LeadsListPage" routes.tsx 2>/dev/null; then
  echo "WARN: routes.tsx may still point at flat pages — pull latest main first"
fi

# --- 4. Remove leftover flat page files if any ---
for leftover in \
  pages/LeadsListPage.tsx pages/LeadCreatePage.tsx pages/LeadDetailPage.tsx \
  pages/ClientsListPage.tsx pages/ClientCreatePage.tsx pages/ClientDetailPage.tsx \
  pages/CaseStudiesListPage.tsx pages/SourcesListPage.tsx \
  pages/SalesDashboardPage.tsx pages/SalesAnalyticsPage.tsx pages/SalesActivityTimelinePage.tsx
do
  if [[ -f "$leftover" ]]; then
    if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
      git rm -f "$leftover" 2>/dev/null || rm -f "$leftover"
    else
      rm -f "$leftover"
    fi
    echo "  removed leftover $leftover"
  fi
done

echo ""
echo "==> Done. Review with: git status"
echo "    Then: npx tsc -b && git add -A && git commit -m 'refactor(sales): complete domain page split (no thin re-exports)'"
echo "    git push origin main"
