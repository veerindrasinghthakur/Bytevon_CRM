#!/usr/bin/env bash
# Restructure sales module into domain folders (git mv preserves history).
# Run from repo root: bash 01_frontend_code/scripts/restructure-sales-module.sh
set -euo pipefail
ROOT="01_frontend_code/src/modules/sales"
cd "$(git rev-parse --show-toplevel)"

if [[ ! -d "$ROOT" ]]; then
  echo "Missing $ROOT" >&2
  exit 1
fi

mkdir -p \
  "$ROOT/api" \
  "$ROOT/hooks/lead" "$ROOT/hooks/client" "$ROOT/hooks/case-study" \
  "$ROOT/hooks/dashboard" "$ROOT/hooks/activity" "$ROOT/hooks/source" \
  "$ROOT/pages/lead" "$ROOT/pages/client" "$ROOT/pages/case-study" \
  "$ROOT/pages/source" "$ROOT/pages/dashboard" "$ROOT/pages/activity" \
  "$ROOT/components/lead" \
  "$ROOT/schemas/lead" "$ROOT/schemas/client" "$ROOT/schemas/case-study" \
  "$ROOT/schemas/activity" "$ROOT/schemas/source" \
  "$ROOT/types"

[[ -f "$ROOT/api/sources.ts" ]] && git mv "$ROOT/api/sources.ts" "$ROOT/api/source.ts"

[[ -f "$ROOT/hooks/use-leads-list.ts" ]] && git mv "$ROOT/hooks/use-leads-list.ts" "$ROOT/hooks/lead/use-leads.ts"
[[ -f "$ROOT/hooks/use-clients-list.ts" ]] && git mv "$ROOT/hooks/use-clients-list.ts" "$ROOT/hooks/client/use-clients.ts"
[[ -f "$ROOT/hooks/use-case-studies-list.ts" ]] && git mv "$ROOT/hooks/use-case-studies-list.ts" "$ROOT/hooks/case-study/use-case-studies.ts"
[[ -f "$ROOT/hooks/use-sales-dashboard.ts" ]] && git mv "$ROOT/hooks/use-sales-dashboard.ts" "$ROOT/hooks/dashboard/use-dashboard.ts"

[[ -f "$ROOT/pages/LeadsListPage.tsx" ]] && git mv "$ROOT/pages/LeadsListPage.tsx" "$ROOT/pages/lead/LeadsListPage.tsx"
[[ -f "$ROOT/pages/LeadCreatePage.tsx" ]] && git mv "$ROOT/pages/LeadCreatePage.tsx" "$ROOT/pages/lead/LeadCreatePage.tsx"
[[ -f "$ROOT/pages/LeadDetailPage.tsx" ]] && git mv "$ROOT/pages/LeadDetailPage.tsx" "$ROOT/pages/lead/LeadDetailPage.tsx"
[[ -f "$ROOT/pages/ClientsListPage.tsx" ]] && git mv "$ROOT/pages/ClientsListPage.tsx" "$ROOT/pages/client/ClientsListPage.tsx"
[[ -f "$ROOT/pages/ClientCreatePage.tsx" ]] && git mv "$ROOT/pages/ClientCreatePage.tsx" "$ROOT/pages/client/ClientCreatePage.tsx"
[[ -f "$ROOT/pages/ClientDetailPage.tsx" ]] && git mv "$ROOT/pages/ClientDetailPage.tsx" "$ROOT/pages/client/ClientDetailPage.tsx"
[[ -f "$ROOT/pages/CaseStudiesListPage.tsx" ]] && git mv "$ROOT/pages/CaseStudiesListPage.tsx" "$ROOT/pages/case-study/CaseStudiesListPage.tsx"
[[ -f "$ROOT/pages/SourcesListPage.tsx" ]] && git mv "$ROOT/pages/SourcesListPage.tsx" "$ROOT/pages/source/SourcesListPage.tsx"
[[ -f "$ROOT/pages/SalesDashboardPage.tsx" ]] && git mv "$ROOT/pages/SalesDashboardPage.tsx" "$ROOT/pages/dashboard/SalesDashboardPage.tsx"
[[ -f "$ROOT/pages/SalesAnalyticsPage.tsx" ]] && git mv "$ROOT/pages/SalesAnalyticsPage.tsx" "$ROOT/pages/dashboard/SalesAnalyticsPage.tsx"
[[ -f "$ROOT/pages/SalesActivityTimelinePage.tsx" ]] && git mv "$ROOT/pages/SalesActivityTimelinePage.tsx" "$ROOT/pages/activity/SalesActivityTimelinePage.tsx"

[[ -f "$ROOT/components/LeadMetricsRow.tsx" ]] && git mv "$ROOT/components/LeadMetricsRow.tsx" "$ROOT/components/lead/LeadMetricsRow.tsx"

[[ -f "$ROOT/schemas/lead.ts" ]] && git mv "$ROOT/schemas/lead.ts" "$ROOT/schemas/lead/lead.ts"
[[ -f "$ROOT/schemas/lead-form.ts" ]] && git mv "$ROOT/schemas/lead-form.ts" "$ROOT/schemas/lead/lead-form.ts"
[[ -f "$ROOT/schemas/client.ts" ]] && git mv "$ROOT/schemas/client.ts" "$ROOT/schemas/client/client.ts"
[[ -f "$ROOT/schemas/client-form.ts" ]] && git mv "$ROOT/schemas/client-form.ts" "$ROOT/schemas/client/client-form.ts"
[[ -f "$ROOT/schemas/case-study.ts" ]] && git mv "$ROOT/schemas/case-study.ts" "$ROOT/schemas/case-study/case-study.ts"
[[ -f "$ROOT/schemas/case-study-form.ts" ]] && git mv "$ROOT/schemas/case-study-form.ts" "$ROOT/schemas/case-study/case-study-form.ts"
[[ -f "$ROOT/schemas/activity.ts" ]] && git mv "$ROOT/schemas/activity.ts" "$ROOT/schemas/activity/activity.ts"

echo "git mv complete. Next: python3 01_frontend_code/scripts/apply_sales_import_fixes.py"
