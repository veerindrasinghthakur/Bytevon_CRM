# Module Verification Report: Profile

## 1. Action Required Summary
### Pages Needing Refactoring
- **pages/ProfilePage.tsx** — Extract draft/edit logic to custom hook (`useProfileDraft`), replace inline strings with global ROUTES constant, replace hardcoded hex colors (`emerald-50`, `emerald-600`) with CSS variables, replace manual `useState` form with React Hook Form + Zod (`profileFormSchema`), extract local compute logic (`initials`, `activeSessions`, `currentSession`, `otherSession`) to selectors/hooks, replace direct `navigate()` with `safeNavigate()`
- **pages/ChangePasswordPage.tsx** — Replace hardcoded hex colors (`emerald-50`, `emerald-600`) with CSS variables, replace direct `navigate()` with `safeNavigate()`
- **pages/ActiveSessionsPage.tsx** — Replace hardcoded color logic (`bg-secondary/15`, `bg-surface-container`) with CSS variables, ensure BackButton uses `safeNavigate()`

### Hooks Needing Refactoring
- **hooks/use-profile.ts** — Hardcoded query keys (`profileKeys.me`, `profileKeys.sessions`, `profileKeys.activity`) should use centralized query key factory; no direct `navigate()` calls present
- **api/profile.ts** — Local compute logic in mock mode (`structuredClone`, `URL.createObjectURL`, session status mutations) should be replaced with API fields from backend; `uploadUserAvatar` function is orphaned/unused

## 2. Orphan Files Identified
- **api/profile.ts** — `uploadUserAvatar` function (lines 64–80) is not imported/used anywhere in the codebase
- **schemas/profile.ts** — `profileListResponseSchema` and `ProfileListResponse` type (lines 63–68) are defined but not exported/used

## 3. Form & Type Violations
- **pages/ProfilePage.tsx** — Manual `useState` for `draft` (line 39) instead of React Hook Form + Zod; inline component types (`Info`, `EditableInfo`, `ToggleRow`) lack explicit props interfaces
- **routes.tsx** — Uses `any` type explicitly (line 8: `eslint-disable-next-line @typescript-eslint/no-explicit-any`); `appLayoutRoute` parameter should be typed
- **hooks/use-profile.ts** — Line 79 uses inline `import()` for `ChangePasswordInput` type instead of proper import