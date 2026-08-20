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

## 4. Design Tokens (CSS) — Locked

- **Single source of truth:** `frontend_code/src/styles/tokens.css`
- **Never hardcode** colors, spacing, radii, motion durations, elevations, opacities, or scrollbar geometry in CSS or component styles.
- All values in `globals.css` must reference CSS variables from tokens.
- Tailwind maps tokens via `tailwind.config.js` (`var(--…)`).
- When a new visual constant is needed, add a token first, then use it.
- Prefer semantic names: `--color-*`, `--spacing-*`, `--radius-*`, `--duration-*`, `--opacity-*`, `--elevation-*`.

---

## 5. Page Logic → Custom Hooks — Locked

- Pages with substantial logic (filters, selection, long-press, data loading, form state, computed lists) **must** extract that logic into a custom hook under the module’s `hooks/` folder.
- Page files should primarily contain React JSX (layout + binding). TypeScript business logic lives in hooks.
- Naming: `use-<entity>-list.ts`, `use-<entity>-detail.ts`, `use-<action>.ts`.
- Data-fetch hooks (react-query wrappers) stay separate from page-UI hooks when both exist.
- Create `hooks/` under a module if it does not exist yet.
- Do not extract trivial one-liner pages; only pages with a meaningful amount of logic.

### Hooks inventory (major modules)

| Module | Hooks |
|--------|-------|
| **sales** | `use-leads-list`, `use-clients-list`, `use-sales-dashboard` |
| **projects** | `use-projects`, `use-projects-list`, `use-tasks`, `use-tasks-list`, `use-teams` |
| **workforce** | `use-employees-list`, `use-departments-list`, `use-teams-list` |
| **payroll** | `use-employee-payroll-history`, `use-run-payroll`, `use-payroll-review`, `use-monthly-payroll` |
| **notifications** | `use-notifications`, `use-notification-center` |
| **approvals** | `use-approval-center`, `use-pending-approvals` |

Remaining form-heavy pages (EmployeeCreate, ApplyLeave, MyLeave, etc.) follow the same pattern when next edited.

---

## 6. Contextual Detail Drawer (Overview Panel) — Locked

- Not permanent; drawer from the right on data-item click.
- Height between App Header and viewport bottom.
- One at a time; full detail pages remain for deep work.

---

## 7. Commit Discipline

- Prefer fewer commits with coherent, related changes.
- Clear conventional commit messages.
- Do not leave partial or broken intermediate states on `main`.
