---
name: bytevon-frontend-refactor
description: 'Refactor ByteVon CRM frontend modules following established patterns: move types/enums/forms to designated files, route mock data through API layer, add RBAC gates, update routing/nav, and validate with build. Use when reorganizing module structure or applying consistent patterns across modules.'
argument-hint: '[module path or file to refactor]'
user-invocable: true
---

# ByteVon Frontend Module Refactor

## Purpose

Apply consistent structural patterns across ByteVon CRM frontend modules. This skill codifies the repeatable workflow used to reorganize modules (sales, workforce, payroll, dashboard, etc.) so that types, enums, forms, mock data, and RBAC live in their designated files with clean boundaries.

## When to Use

- User asks to "move types to type file, enums to enum file, forms to schema file"
- User wants to "route mock data through API file not directly"
- User requests RBAC gates on a module's pages/routes/APIs
- User wants to restructure routing or navigation for a module
- Any refactor that should follow the established ByteVon module conventions

## Established Patterns (Locked Architecture)

### File Boundaries
- **Types** → `src/modules/<module>/types.ts` (domain interfaces, query params, result types)
- **Enums/Options/Tokens** → `src/modules/<module>/schemas/enums.ts` (literal values, select options, filter defaults, color/icon maps)
- **Form Schemas** → `src/modules/<module>/schemas/<entity>-form.ts` (Zod schema, inferred type, empty form factory)
- **API Schemas** → `src/modules/<module>/schemas/<entity>.ts` (Zod response/request validation)
- **Mock Data** → `src/modules/<module>/data/*.ts` or `src/shared/mock/data/<module>.ts`
- **API Layer** → `src/modules/<module>/api/*.ts` (all mock/backend access goes here)
- **Hooks** → `src/modules/<module>/hooks/*.ts` (React Query, list controls, selection)
- **Pages** → `src/modules/<module>/pages/*.tsx` (UI only, imports from above)

### Data Flow
- Pages/hooks **never** import mock data directly
- Mock data flows through API functions respecting `env.useMockApi`
- API functions return same shape as real backend

### Forms
- Always use `react-hook-form` + `zodResolver` + shared Zod schema
- No manual `useState` per field or hand-written validation

### RBAC (when requested)
- Import `Can`, `useRbac`, `requireView`, `requirePermission`, `withAuthScope` from `@/shared/rbac`
- Import `Action`, `ResourceName` from `@/shared/schema`
- Gate UI with `<Can action={Action.CREATE} resource={ResourceName.LEAD}>`
- Guard routes with `beforeLoad: () => requireView(ResourceName.LEAD)`
- Scope list APIs with `withAuthScope(params, auth, ResourceName.LEAD)`

### Navigation
- Secondary nav defined in `src/shared/components/layout/SecondarySidebar.tsx`
- Module items filtered by VIEW permission via `filterSecondaryNavItems`
- Empty groups render nothing (sidebar auto-hides)

## Procedure

### 1. Inventory & Anchor
- Identify the target module folder or specific file
- List all inline declarations: types, enums, options, forms, mock arrays, untyped props
- Note direct mock imports, manual forms, missing RBAC gates

### 2. Move Declarations to Designated Files
For each declaration, choose the correct existing destination:
- **Type/interface** → `types.ts` (or form schema file if inferred from Zod)
- **Enum/options/tokens** → `schemas/enums.ts`
- **Form schema** → `schemas/<entity>-form.ts` (create if missing, ask first)
- **Mock array** → `data/` file, then expose via API
- **Component props** → named type in `types.ts` or inline object type

### 3. Update Consumers
- Change imports to point to new locations
- Replace manual forms with `useForm` + `zodResolver` + shared schema
- Replace direct mock imports with API function calls

### 4. Add RBAC (if requested)
- Wrap Create/Edit/Delete/Export/Unlock controls with `<Can>`
- Add `beforeLoad` route guards for VIEW/CREATE/UPDATE/DELETE
- Scope list API calls with `withAuthScope`

### 5. Clean Up
- Remove stale duplicate declarations and imports
- Delete temporary extraction files if any were created
- Ensure no `any` types remain for props or shared declarations

### 6. Validate
- Run `npm run build` after each logical change set
- Fix only errors caused by this refactor
- Re-scan for moved declaration names and direct mock imports

## Decision Rules

- If a type is inferred from a Zod form schema, keep it beside the schema; `types.ts` may re-export
- If options come from API response, keep dynamic; centralize only static enum-backed options
- If no existing destination file exists, **stop and ask** before creating one
- Do not change runtime behavior, naming, routes, or unrelated formatting
- Prefer `replace_string_in_file` for precise edits; avoid creating new files unless authorized

## Completion Checklist

- [ ] No target-file-local shared type, enum, option, or token remains when destination exists
- [ ] Component props are explicitly typed
- [ ] Forms use existing Zod schema file and `zodResolver`
- [ ] Mock data owned by data file and served through API boundary
- [ ] Duplicate declarations and stale imports removed
- [ ] TypeScript/build validation passes
- [ ] No unrelated files or behavior changed

## Example Prompts

- "Apply the refactor pattern to the sales module"
- "Move the workforce page types/enums/forms to their files and add RBAC"
- "Restructure the dashboard routing and hide secondary nav on root"
- "Make the icon rail responsive for mobile"

## Related Skills

- `bytevon-rbac-module` — Deep RBAC implementation for a single module
- `module-structure-refactor` — General TypeScript/React module organization