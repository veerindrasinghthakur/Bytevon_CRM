---
name: module-structure-refactor
description: 'Review and refactor frontend module files so types, enums, options, color tokens, forms, schemas, and mock data live in their existing designated files. Route mock data through the API layer, type component props, and replace manual forms with Zod schemas. Use when organizing React TypeScript modules or checking module structure compliance.'
argument-hint: '[file or folder to review]'
user-invocable: true
---

# Module Structure Refactor

## Purpose

Review the requested file or folder against the module organization rules, make the smallest necessary refactor, and verify that behavior and the build remain intact.

## Required Boundaries

Use the repository's existing files and patterns. Do not create new files for extracted declarations unless the user explicitly asks for a new file or no designated file exists.

- Shared interfaces, type aliases, component prop types, query parameter types, and result types belong in the existing module `types.ts`.
- Literal domain values, enum values, select options, filter defaults, status maps, color tokens, icon maps, and style tokens belong in the existing module enum file, normally `schemas/enums.ts`.
- Form schemas, inferred form types, form defaults, and form-specific helpers belong in the existing form schema file, normally `schemas/<entity>-form.ts`.
- API response and domain validation schemas belong in the existing entity schema file, normally `schemas/<entity>.ts`.
- Mock data belongs in the module's existing data/mock file. Pages and hooks must not import mock arrays directly when an API module exists.
- Mock data must flow through the API function, preserving the `env.useMockApi` boundary and the same return shape as the real API path.
- Component props must have a named type or an inline object type. Never leave props untyped or use `any` to avoid typing them.
- Manual form state and hand-written validation should be replaced with `react-hook-form`, `zodResolver`, and a Zod schema in the existing form schema file.

## Procedure

1. Identify the smallest concrete anchor: the requested file, symbol, inline declaration, or failing build output.
2. Inspect only the nearby owning code and the existing module `types.ts`, enum file, form/schema files, API file, and neighboring usage needed to determine the correct destination.
3. Inventory declarations in the target:
   - `type` and `interface` declarations
   - enum-like arrays and option objects
   - filter defaults
   - color, status, icon, and style maps
   - form state, validation, defaults, and submit helpers
   - mock arrays and mock-only data access
   - untyped component props
4. For every declaration, choose an existing destination file using the Required Boundaries section. Preserve public names and exports when practical so callers do not break.
5. Move types to `types.ts`. If a type is inferred from a Zod form schema, keep that inferred form type beside the form schema instead of duplicating it in `types.ts`.
6. Move enum values, options, defaults, and visual tokens to the existing enum file. Keep route-dependent factories or fetched options in the owning API or hook when they cannot be static enum data.
7. Move form schemas and form-specific defaults/helpers to the existing form schema file. Update pages to use `useForm`, `zodResolver`, and the shared inferred type.
8. Move mock data to its existing data file and make the existing API function resolve it when mock mode is enabled. Do not let pages or hooks bypass the API boundary.
9. Give every component with props a named props type when the props are reused or non-trivial. For small one-off props, an inline object type is acceptable, but it must still be explicit.
10. Remove stale duplicate declarations and imports. Do not create temporary extraction files as a shortcut.
11. Run the narrowest available validation immediately after the edit, then run the project build when the change crosses module boundaries. Fix only errors caused by this refactor.
12. Re-scan the target for the moved declaration names and direct mock imports. Confirm each moved item has one source of truth and the build succeeds.

## Decision Rules

- If a declaration is both a type and a form schema inference, the Zod form schema owns the form type; the domain `types.ts` may re-export it only when the module already follows that barrel pattern.
- If options come from an API response, keep the fetched data dynamic and centralize only static enum-backed options and fallback values.
- If a color token is keyed by an enum value, keep the map with the enum/options in the existing enum file.
- If an API currently imports mock data, retain that direction. If a page or hook imports the mock data, move the dependency one hop into the API.
- If no existing destination file exists, stop and ask before creating one unless the user explicitly authorizes new files.
- Do not change runtime behavior, naming, routes, or unrelated formatting while organizing declarations.

## Completion Checklist

- [ ] No target-file-local shared type, enum, option, or token remains when an existing destination file is available.
- [ ] Component props are explicitly typed.
- [ ] Forms use the existing Zod schema file and `zodResolver`.
- [ ] Mock data is owned by the data file and served through the API boundary.
- [ ] Duplicate declarations and stale imports are removed.
- [ ] TypeScript/build validation passes.
- [ ] No unrelated files or behavior were changed.
