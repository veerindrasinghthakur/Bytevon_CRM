# notifications — inventory & plan (~53 files)

Validation library: **zod** (8 schema files). Stay with zod.

## Inventory summary

- Root: `index.ts` 21, `routes.tsx` 100, `types.ts` 45 (real-ish shapes at root AND `types/` exists — duplicate homes, must consolidate).
- `api/` (10 files): `attachments.ts` 51 (inline `NotificationAttachment`), `center.ts` 329, `compose.ts` 60, `drafts.ts` 120 (inline `NotificationDraft`, `DraftInput`), `notifications.ts` 15, `preference.ts` 59 (inline `PreferenceChannel`, `NotificationPreference`), `sent.ts` 80 (inline `SentListParams`), `settings-global.ts` 69 (inline `GlobalTrigger`, `GlobalChannel`, `GlobalSettings`), `settings.ts` 29, `template.ts` 133 (inline `NotificationTemplate`, `TemplateCreateInput`, `TemplateUpdateInput`). Namings → `*-api.ts`.
- `components/`: `center/*` 104/43/107/186 (`NotificationInlineDetail` **186 LARGE-COMP**; `CenterKpiCards` inline `CenterKpi`), `sent/*` 14/45 (inline `SentKpi`).
- `hooks/`: 4 two-line stubs at top shadowing `center/*`, `settings/*`, `sent/*`; LARGE-HOOKS: `center/use-notification-center.ts` 258, `settings/use-notification-settings.ts` 155; small: bell 37, use-notifications 74, preferences 55, sent 80, templates 71.
- `pages/`: LARGE-PAGES: `compose/ComposeNotificationPage` **544** (!), `settings/NotificationSettingsPage` 299, `sent/SentNotificationsPage` 233, `center/NotificationDetailPage` 227, `template/TemplatesListPage` 252 (inline `ModalMode`), `center/NotificationCenterPage` 172; small: preferences 82.
- `schemas/` → `schema/` + `.schema.ts` (8 files; `z.infer` stays).
- `types/`: 6 thin files (center 24, compose 7, preference 3, sent 7, settings 11, template 2) + root `types.ts` 45 — consolidate, no stubs to delete (content real but split).

## Type extraction plan

- `types/attachments.types.ts`: `NotificationAttachment`.
- `types/drafts.types.ts`: `NotificationDraft`, `DraftInput`.
- `types/preference.types.ts`: merge existing + `PreferenceChannel`, `NotificationPreference`.
- `types/sent.types.ts`: merge existing + `SentListParams`, `SentKpi` (component).
- `types/settings.types.ts`: merge existing + `GlobalTrigger`, `GlobalChannel`, `GlobalSettings`.
- `types/template.types.ts`: merge existing + `NotificationTemplate`, `TemplateCreateInput`, `TemplateUpdateInput`.
- `types/center.types.ts`: merge existing + `CenterKpi` (component).
- Root `types.ts` content distributed into the above; root becomes barrel shim then removed.

## Split plan

- `ComposeNotificationPage` 544 → page + `components/compose/compose-form.tsx`, `compose-preview.tsx`, `compose-attachments.tsx` + `hooks/compose/use-compose-form.ts` (extract state).
- `NotificationSettingsPage` 299, `SentNotificationsPage` 233, `NotificationDetailPage` 227, `TemplatesListPage` 252 → page + 2–3 section/table/form components each.
- `NotificationInlineDetail` 186 → + `notification-inline-header.tsx`.
- `use-notification-center` 258 → query hook + `use-notification-filters.ts`; `use-notification-settings` 155 → query + form hooks.
- Delete 4 stub hooks after moving real files to the same top-level paths (`hooks/use-notification-center.ts` etc. become the real locations; subfolder files git-mv'd up).

## Rename / move plan (via `git mv`)

- `api/*.ts` → `*-api.ts`; `schemas/` → `schema/*.schema.ts`; `types/*.ts` → `*.types.ts`.
- Flatten `hooks/center/*`, `hooks/sent/*`, `hooks/settings/*`, `hooks/preference/*`, `hooks/template/*` up to `hooks/` kebab (delete stubs first via mv-overwrite or rm+mv — log).
- New barrels everywhere.

## Import fixes (whole repo)

- `api/center`, `api/template`, etc. imports in pages/hooks/tests (notifications-api.test.ts) → new names.
- Stub-hook importers keep working (same final paths).

## Verification

`npx tsc -b`, `npx eslint src/modules/notifications`, `npx vite build`, `vitest run tests/notifications-api.test.ts src/modules/notifications`.
