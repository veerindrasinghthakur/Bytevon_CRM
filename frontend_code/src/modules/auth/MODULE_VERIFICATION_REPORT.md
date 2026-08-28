# Module Verification Report: auth

## 1. Action Required Summary

### Pages Needing Refactoring
- **pages/LoginPage.tsx** — Extract form logic to custom hook `useLoginForm`; replace inline hex colors (`bg-deep-navy`, `bg-electric-blue/20`, `via-surface-container`, `to-secondary/10`, `bg-white`) with CSS variables; replace manual `useState` for `showPassword`/`serverError` with hook state
- **pages/ForgotPasswordPage.tsx** — Extract form logic to custom hook `useForgotPasswordForm`; replace inline style `style={{ fontVariationSettings: "'FILL' 1" }}` with CSS class; replace manual `useState` for `sentTo`/`serverError` with hook state
- **pages/ResetPasswordPage.tsx** — Extract form logic to custom hook `useResetPasswordForm`; replace inline style `style={{ fontVariationSettings: "'FILL' 1" }}` with CSS class; replace manual `useState` for `serverError`/`done`/`showPassword` with hook state
- **pages/SessionExpiredPage.tsx** — Replace hardcoded color classes (`bg-amber-100`, `text-amber-700`) with semantic CSS variables
- **pages/AccessDeniedPage.tsx** — Replace hardcoded color classes (`bg-error/10`, `text-error`) with semantic CSS variables
- **pages/NotFoundPage.tsx** — Replace hardcoded color class (`text-electric-blue`) with semantic CSS variable

### Hooks Needing Refactoring
- **context/AuthContext.tsx** — Replace hardcoded `ENABLE_FOCUS_REFRESH` constant with env flag; replace direct `window.addEventListener`/`removeEventListener` with `useEventListener` hook; extract session bootstrap logic to `useAuthBootstrap` hook; consider replacing manual `useState` session with `useReducer` for complex transitions

## 2. Orphan Files Identified
- **pages/NotFoundPage.tsx** — Exported in `index.ts` but NOT registered in `routes.tsx` `createAuthRoutes()`; no route references it. Either add to auth routes or remove export.

## 3. Form & Type Violations
- **api/auth.ts:137-138** — Uses `any` type via unsafe cast: `(err as { response?: { status?: number } })` — replace with typed error interface
- **routes.tsx:32** — Uses `@typescript-eslint/no-explicit-any` eslint-disable for `authLayoutRoute: any` — add proper route parent type
- **context/AuthContext.tsx:19** — Imports `type { Action, ResourceName, ScopeName }` but uses string fallbacks in `can()` — tighten to strict types
- All form pages (**LoginPage**, **ForgotPasswordPage**, **ResetPasswordPage**) correctly use React Hook Form + Zod — no violations