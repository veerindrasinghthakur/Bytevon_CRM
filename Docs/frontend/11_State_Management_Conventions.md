# 11_State_Management_Conventions.md

# Bytevon Frontend — State Management Conventions

**Project:** Bytevon ERP/CRM  
**Version:** 1.0  
**Status:** Locked  
**Last Updated:** 2026-08-07

---

## 1. Purpose

Defines clear rules for every kind of state in the application so that code stays consistent and predictable across all modules.

---

## 2. State Categories

| Category              | Tool / Location                    | Examples |
|-----------------------|------------------------------------|----------|
| Server state          | TanStack Query                     | Lists, details, user profile, permissions |
| URL state             | Router search params               | Filters, pagination, tabs, selected id |
| Form state            | React Hook Form                    | Create / Edit forms |
| Local UI state        | `useState` / `useReducer`          | Modal open, sidebar collapse, temporary toggles |
| Global client state   | React Context (sparingly)          | Auth session, theme, toast |

**Rule:** Prefer the highest category that fits. Do not put server data into local state or context.

---

## 3. Server State (TanStack Query)

- All data that comes from the backend must go through TanStack Query.
- Query keys must be hierarchical and stable (see API Integration Patterns).
- Mutations must invalidate the relevant query keys.
- Do not store server data in Zustand, Redux, or Context unless there is a very strong reason.

---

## 4. URL State

Use search params for:
- Filters
- Pagination (`page`, `pageSize`)
- Active tab
- Sort field / direction
- Selected entity when it should be shareable / bookmarkable

Do **not** put ephemeral UI state (modal open, hover, temporary selection) into the URL.

---

## 5. Form State

- Always use React Hook Form + Zod resolver for Create/Edit forms.
- Default values come from:
  - Empty object for Create
  - Query result for Edit
- Submit handlers call mutations. Do not keep a separate “form data” store.

---

## 6. Local UI State

Allowed for:
- Modal / drawer open state
- Sidebar collapse (can also be lifted to AppShell context)
- Temporary multi-select before bulk action
- Local toggles that do not affect other users or the URL

Keep it as close to the component that needs it as possible.

---

## 7. Global Client State

Only these are allowed at global level for now:
- Auth session (user, tokens, permissions)
- Theme (if needed)
- Toast / notification system

Everything else should stay local or in TanStack Query.

---

## 8. Anti-Patterns (Forbidden)

- Fetching data with `useEffect` + `useState` instead of TanStack Query
- Storing list/detail data in Context or a global store
- Putting form values into URL or global state
- Duplicating server state in local state “for convenience”

---

## 9. Related Documents

- `06_API_Integration_Patterns.md`
- `08_Form_Patterns.md`
- `05_Routing_and_Guards.md`
