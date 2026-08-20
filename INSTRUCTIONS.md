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

- Not permanent; drawer from the right on data-item click.
- Height between App Header and viewport bottom.
- One at a time; full detail pages remain for deep work.

---

## 5. Sales Module — Completed

Case studies actions, client/lead detail, dashboard+activity merge.

---

## 6. Projects Module — Completed (core)

- Project Detail tabs: Overview, Tasks, Team, Timeline, Documents, **Repository (tab only, not separate route)**.
- Align Repository tab UI with repository information screen.
- Task Detail cards; Team Detail recent projects.

---

## 7. Workforce Module — Progress (2026-08-20)

- **Add Employee:** photo upload, documents section, gender/nationality, contact, address, emergency contact, employment ID (readonly preview), manager select, bank account holder name.
- **Add Department:** Identity + Settings sections.
- **Department Management:** metric cards (total, staffing, active, inactive) + empty state.
- **Department Detail:** employee cards with role/tags, head section, open positions card when > 0, hover effects; add-member bottom-sheet style.
- **Employee Detail:** Download + Deactivate actions, reporting manager block, attendance & leave overview cards on Overview tab.
- **Add Member:** bottom-sheet popup from bottom with search and role assignment.
- Remaining: finer pixel-match when workforce HTML mockups are attached; manager_id persistence in assignment schema.

---

## 8. Commit Discipline

- Prefer fewer commits with coherent, related changes.
- Clear conventional commit messages.
- Do not leave partial or broken intermediate states on `main`.
