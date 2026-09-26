# projects — inventory & plan (~75 files)

Validation library: **zod** (13 schema files in nested folders). Stay with zod.

## Inventory summary

- Root: `index.ts` 42, `routes.tsx` 170, `enums.ts` 85 (6 derived types at root — move types to `types/`, consts to `schema/`/lib), `cssTokens.ts` 70 (**naming** → `lib/css-tokens.ts` or `styles`; logged).
- `api/`: `team.ts` **545**, `task.ts` 330, `project.ts` 315, `document.ts` 288, `note.ts` 119 (inline `BackendNote`), `index.ts` 5. Inline: `CreateTeamApiInput` (team.ts:455). Rename → `*-api.ts`.
- `components/`: LARGE-COMP: `project/ProjectDetailOverview` 276 (inline `Props`), `project/ProjectNotesTab` 217, `project/ProjectTeamTab` 173 (inline `Props`), `task/CreateTaskModal` 280, `team/TeamTopView` 180; small with inline `Props`/`StatusOption`/`UploadMutation`: ProjectDetailDocumentsTab, ProjectDetailTabNav, ProjectDetailTasksTab, TaskDetailSidebar; stubs: `NotesPanel.tsx` 2 (real notes live in `components/project/ProjectNotesTab` + `data/notesMock`), `team/TeamAddMemberPage.tsx` 2 (a Page inside components/ — move to `pages/team/` or delete if dupe).
- `hooks/`: LARGE-HOOKS: `project/use-project-detail` 312, `project/use-projects` 226, `project/use-project-create` 206, `task/use-tasks` 201, `task/use-task-detail` 191, `task/use-task-create` 159 (inline `FormValues` zinfer), `team/use-teams` 218, `team/use-team-detail` 160 (inline `TeamUi`), `team/use-team-add-members` 144 (inline `AddMemberSelection`); small: document 72, note 38; stub `team/use-team-create.ts` 2.
- `pages/`: LARGE-PAGES: `project/ProjectsListPage` 400, `project/ProjectCreatePage` 353, `team/TeamDetailPage` 314, `task/TasksListPage` 306, `team/TeamsListPage` 259, `task/TaskCreatePage` 271, `document/DocumentsPage` 268, `task/TaskDetailPage` 245, `project/ProjectDetailPage` 237, `team/TeamCreatePage` 233; small: note 27, team-members 181, team-add-member 169, assign-project 165 (inline zinfer `AssignProjectForm`), team-edit 108 (inline `FormValues`), team-projects 59.
- `schemas/`: nested `document/document.ts`, `note/note-form.ts`, `note/note.ts`, `project/*` (3), `task/*` (3), `team/*` (4) — flatten to `schema/*.schema.ts` (e.g. `schema/project.schema.ts`, `schema/project-form.schema.ts`). `z.infer` stays; hand `TeamMemberRoleFormValue`, `TeamMemberForm` → `types/`.
- `types/`: `index.ts` 272 (real) + 5 thin files (`document.ts` 1, `note.ts` 1, `project.ts` 18, `task.ts` 10, `team.ts` 16 — near-stubs). Consolidate + rename to `*.types.ts`.
- `data/`: documentsMock 53 (inline `DocumentItem`), notesMock 35, teamMembersMock 13 (inline `TeamMemberMock`) — inline data-item types → `types/`.

## Type extraction plan

- Component `Props` types: each `type Props = {...}` co-located per component is the one exception the task allows debating — rule says move ALL named types to `types/`. Plan: move to `types/<area>.types.ts` as `<Component>NameProps` (e.g. `ProjectDetailOverviewProps`); pages import from types. Log in ambiguous.md (verbose but compliant).
- `BackendNote`, `CreateTeamApiInput`, `TeamUi`, `AddMemberSelection`, `DocumentItem`, `TeamMemberMock`, `StatusOption`, `UploadMutation`, enums-derived types → `types/`.
- Page/form `FormValues`/`AssignProjectForm` zinfer aliases: keep definition in `schema/` (derived), re-export from `types/index.ts` for consumers.

## Split plan

- `team.ts` api 545 → `api/team-api.ts` + `api/team-member-api.ts`; `task.ts` 330 / `project.ts` 315 / `document.ts` 288 → split per action group if mixed (list/detail/mutations), else rename only.
- Each LARGE page → thin page + section components (list pages: table + filters; detail pages: header + tabs reuse existing tab components; create pages: form component).
- `CreateTaskModal` 280, `ProjectDetailOverview` 276 → split into form/section sub-components.
- `use-project-detail` 312, `use-projects` 226, `use-teams` 218 → query + filter/mutation slices.

## Rename / move plan (via `git mv`)

- Kebab-case everything: `cssTokens.ts` → `lib/css-tokens.ts`; `enums.ts` → split (types→`types/`, consts→`schema/project-enums.schema.ts` or `lib/`); `project-detail-helpers.tsx` → `project-detail-helpers.tsx` kebab (already) but mixed case siblings → all kebab; `TeamAddMemberPage.tsx` in components → resolve; `NotesPanel` stub → delete after check.
- Flatten `schemas/*/*` → `schema/*.schema.ts`; `types/*` → `*.types.ts`; `api/*` → `*-api.ts`.
- New barrels everywhere.

## Import fixes (whole repo)

- `projects/enums`, `projects/cssTokens` importers (pages/components) → new paths.
- tests/projects-api.test.ts.

## Verification

`npx tsc -b`, `npx eslint src/modules/projects`, `npx vite build`, `vitest run tests/projects-api.test.ts src/modules/projects`.
