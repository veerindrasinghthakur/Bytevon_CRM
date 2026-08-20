# Bytevon Documentation — Working Instructions

**Last Updated:** 2026-08-20

These rules apply to every code or documentation change in this repository.

---

## 1. Creating / Syncing a New Page

- The page must match the provided UI screen (HTML mockup) as closely as possible.
- Use only fields that exist in the schema or can be computed from existing data. If a field in the UI has no corresponding data, note it in the response and do not invent it.
- Do **not** remove existing hover, cursor, animation, or micro-interaction effects. Prefer adding more from the UI screen.
- Prefer fewer, larger commits. Collect related changes and commit in batches.
- Do not remove older working sections unless explicitly asked.

---

## 2. Instruction File Maintenance

- If the generation process or any rule changes, update this file.
- If this file does not exist, create it and append the new instructions.
- Always inform the user in the response when instructions are updated.

---

## 3. General UI Rules

- Pages that render a significant amount of data must include a search bar and filters.
- When adding something new, do not remove the older working version unless asked.
- Make row scrollbars as thin as possible and hide them when the user is not scrolling.
- If a section exists in code but is not present in the current UI screen, leave it unchanged until explicitly asked to modify it.
- Always prefer necessary changes only. Do not introduce unrelated refactors.

---

## 4. Contextual Detail Drawer (Overview Panel) — Locked

- The overview panel is **not permanent**.
- It appears when the user clicks any data item (employee card, project card, department, task, lead, client, etc.).
- Behaviour is **drawer-based** (slides in from the right).
- Height is strictly **between the App Header and the footer / bottom of the viewport**.
- Only one drawer open at a time; selecting a new item updates its content.
- Full detail pages remain for deep work.

Implementation: `QuickOverviewProvider` + `useQuickOverview()` + `QuickOverviewPanel` in AppShell.

---

## 5. Sales Module — Completed (2026-08-20)

- Case Studies: View / Edit / Share actions.
- Client Detail / Lead Detail: richer layouts synced to UI.
- Dashboard + Activity merge: revenue, growth, funnel, top performers, timeline.
- Nav: single Dashboard entry.

---

## 6. Projects Module — In progress / completed items (2026-08-20)

- **Project Detail:** Tabbed UI — Overview, Tasks (with search/status filter), Team, Timeline (status enum), Documents, **Repository**.
- Overview includes KPI cards, description, team summary, client card, key dates, resources, activity.
- **Task Detail:** Description card + assignee card + metadata sidebar aligned with UI.
- List page already opens QuickOverview drawer on row click; KPI metrics present.
- Remaining optional: richer Team Detail layout, extra list filters (phase/priority/lead) when schema supports them.

---

## 7. Commit Discipline

- Prefer fewer commits with coherent, related changes.
- Use clear conventional commit messages.
- Do not leave partial or broken intermediate states on `main`.
