# auth — inventory & plan

Validation library: **zod** (`schemas/auth-form.ts`, `schemas/auth.ts`, `schemas/enums.ts`). Stay with zod.

## Inventory (19 files)

| File | Lines | Contains | Fails |
|---|---|---|---|
| `index.ts` | 29 | barrel | OK; extend to new barrels |
| `routes.tsx` | 87 | route defs + lazy pages | OK at root (logged as conventional) |
| `types.ts` | 86 | module types at root (login/session/user shapes) | **misplaced** (must live under `types/`) |
| `api/auth.ts` | 310 | login/refresh/logout/session fns + `interface BackendLoginResponse` (line 29) | **inline type**; **naming** → `auth-api.ts` |
| `components/SessionExpiryHost.tsx` | 39 | presenter listening to session expiry | **naming** → `session-expiry-host.tsx` |
| `context/AuthContext.tsx` | 113 | provider + `interface AuthContextValue` (line 22) | **inline type**; **location** (`context/` not in target → move provider wiring into `hooks/` + keep context object co-located, or `lib/`; decision: `hooks/auth-context.tsx`? logged in ambiguous.md) |
| `hooks/useAuthBootstrap.ts` | 67 | bootstrap session on app start | **naming** → `use-auth-bootstrap.ts` |
| `hooks/useForgotPasswordForm.ts` | 58 | form state + zod submit | **naming** → `use-forgot-password-form.ts` |
| `hooks/useLoginForm.ts` | 72 | form state + zod submit | **naming** → `use-login-form.ts` |
| `hooks/useResetPasswordForm.ts` | 83 | form state + zod submit | **naming** → `use-reset-password-form.ts` |
| `pages/AccessDeniedPage.tsx` | 29 | static + RBAC note | OK |
| `pages/ForgotPasswordPage.tsx` | 133 | composes useForgotPasswordForm + presentational markup | OK size; check for inline types (none found) |
| `pages/LoginPage.tsx` | 175 | composes useLoginForm | OK |
| `pages/NotFoundPage.tsx` | 21 | static | OK |
| `pages/ResetPasswordPage.tsx` | 125 | composes useResetPasswordForm | OK |
| `pages/SessionExpiredPage.tsx` | 26 | static | OK |
| `schemas/auth-form.ts` | 43 | 4 zod schemas + 4 `z.infer` types (LoginInput, ForgotPasswordInput, ResetPasswordInput, ChangePasswordInput) | `z.infer` aliases are schema-derived (stay in schema); **naming** → `auth-form.schema.ts` |
| `schemas/auth.ts` | 45 | zod + `interface AuthUser`, `interface AuthSession` (lines 21, 37) | **inline interfaces** → move to `types/`; rename → `auth.schema.ts` |
| `schemas/enums.ts` | 11 | constants | rename → `auth-enums.schema.ts` or fold into schema index; decide during execution |

Missing checks: **no `types/` folder** (root `types.ts` must be split into `types/*.types.ts`); **no barrels** for pages/components/hooks/api/schema/types; no file exceeds large-file guidelines (largest page 175, largest hook 83) — no splits needed.

## Type extraction plan → `types/`

- `types/auth.types.ts`: everything from root `types.ts` + `BackendLoginResponse` (api) + `AuthContextValue` (context) + `AuthUser`, `AuthSession` (schemas/auth.ts).
- `types/index.ts` re-exports.

## Rename / move plan (via `git mv`)

- `types.ts` → `types/auth.types.ts`
- `api/auth.ts` → `api/auth-api.ts`
- `components/SessionExpiryHost.tsx` → `components/session-expiry-host.tsx`
- `context/AuthContext.tsx` → `hooks/auth-context.tsx` (context object + provider; hook-adjacent, logged) — fallback `lib/` if provider breaks hook lint rules; decide during execution, log it.
- `hooks/useAuthBootstrap.ts` → `hooks/use-auth-bootstrap.ts`, etc. (all 4 hooks kebab-cased)
- `schemas/auth-form.ts` → `schema/auth-form.schema.ts`; `schemas/auth.ts` → `schema/auth.schema.ts`; `schemas/enums.ts` → `schema/auth-enums.schema.ts` (folder `schemas/` → `schema/` per target singular)
- New barrels: `pages/index.ts`, `components/index.ts`, `hooks/index.ts`, `api/index.ts`, `schema/index.ts`, `types/index.ts`; root `index.ts` re-exports all.

## Import fixes (whole repo)

- `@/modules/auth/types` → `@/modules/auth/types` (path stays valid via barrel; update to `.../types/auth.types` where deep-imported).
- `api/auth` imports (context, hooks, tests auth-*) → `api/auth-api`.
- `context/AuthContext` imports (app providers, tests) → new location.
- Schema import paths in hooks/pages/tests → `schema/*`.

## Verification

`npx tsc -b`, `npx eslint src/modules/auth`, `npx vite build`, `vitest run tests/auth-* src/modules/auth`. No behavior change: bootstrap/session/refresh flows untouched.
