# 14_Code_Generation_Rules.md

# Bytevon Frontend — Code Generation Rules

**Project:** Bytevon ERP/CRM  
**Version:** 1.0  
**Status:** Locked  
**Last Updated:** 2026-08-07

---

## 1. Purpose

These rules must be followed by any human or AI when converting Stitch screens (or any design) into React code. The goal is consistent, maintainable, and predictable output.

---

## 2. Hard Rules (Must Follow)

1. **Tokens only**  
   Never hardcode colors, spacing, font sizes, radii, or shadows. Always use CSS variables / Tailwind tokens.

2. **No business logic in shared components**  
   Shared UI components receive data and callbacks. They do not know domain rules.

3. **Server state via TanStack Query only**  
   No `useEffect` + `useState` for data fetching.

4. **Forms via React Hook Form + Zod**  
   Every Create/Edit form must use this combination.

5. **Follow the Module Checklist**  
   Every new module must pass the checklist in `12_Module_Implementation_Checklist.md`.

6. **Follow Naming Conventions**  
   File names, component names, hooks, and query keys must match `13_Naming_and_Code_Conventions.md`.

7. **Handle all required page states**  
   Loading, Empty, Error, Success, and No-Permission (see Page State Matrix).

8. **One search bar visible at a time**  
   Respect the Header vs page-level search rule.

9. **Create/New button lives on the page**  
   Never put the primary Create button in the global Header.

10. **Permissions**  
    Hide or disable actions and navigation items the user cannot access.

---

## 3. Preferred Generation Order for a New Screen

1. Identify the module and entity
2. Create / reuse Zod schemas
3. Create / reuse API functions + hooks
4. Create the page component
5. Compose shared UI components
6. Wire loading / empty / error states
7. Add the route + guards
8. Verify permissions and navigation

---

## 4. What to Avoid

- Copy-pasting large HTML/Tailwind blocks without extracting shared components
- Creating one-off styled components that duplicate existing shared ones
- Mixing data-fetching logic inside presentational components
- Using magic numbers or raw hex values
- Ignoring TypeScript (all code must be typed)

---

## 5. Output Expectations

Generated code should be:
- Immediately readable
- Consistent with existing modules
- Ready for review with minimal refactoring
- Free of console errors related to missing keys or unhandled states

---

## 6. Related Documents

- `12_Module_Implementation_Checklist.md`
- `13_Naming_and_Code_Conventions.md`
- `11_State_Management_Conventions.md`
- `15_Page_State_Matrix.md`
