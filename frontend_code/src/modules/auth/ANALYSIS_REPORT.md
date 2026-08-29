===START_LOCAL_OPTIMIZATION===
# Module Optimization Report: auth
## 1. Action Required Summary
### Pages Needing Refactoring
- **pages/NotFoundPage.tsx** — Orphan page: exported in `index.ts` but NOT registered in `routes.tsx` `createAuthRoutes()`. Either add route registration or remove export.
- **pages/LoginPage.tsx** — Inline `new Date().getFullYear()` for copyright year; repeated server error display pattern (also in ForgotPasswordPage, ResetPasswordPage); icon+title+description illustration pattern repeated across auth pages.
- **pages/ForgotPasswordPage.tsx** — Inline `new Date().getFullYear()`; repeated server error display pattern; icon+title+description pattern; "Back to Login" link pattern repeated.
- **pages/ResetPasswordPage.tsx** — Repeated server error display pattern; icon+title+description pattern; show/hide password toggle logic duplicated from LoginPage.
- **pages/SessionExpiredPage.tsx** — Icon+title+description pattern; "Back to Login" button pattern.
- **pages/AccessDeniedPage.tsx** — Icon+title+description pattern; dual-action button group pattern (Dashboard + Login).

### Hooks Needing Refactoring
- **hooks/useForgotPasswordForm.ts** — Direct API call (`forgotPasswordApi`) without `useMutation`; no react-query integration for loading/error/caching; `resetForm` manually resets RHF + local state.
- **hooks/useResetPasswordForm.ts** — Direct API call (`resetPasswordApi`) without `useMutation`; demo token (`'demo'`) logic hardcoded in hook; show/hide password toggle duplicated from `useLoginForm`.
- **hooks/useLoginForm.ts** — `search.redirect` validation logic inline (could be extracted to util); show/hide password toggle could be shared.
- **hooks/useAuthBootstrap.ts** — Mock-specific focus-refresh logic (`if (!env.useMockApi) return`) mixed with production code; `useRef` + `useState` pattern for session could use `useSyncExternalStore` for concurrent safety.
- **context/AuthContext.tsx** — `employmentId` fallback to `getCurrentEmploymentId()` (localStorage) may be stale vs session; `can()` function recreates on every render despite `useMemo` (deps include `employmentId` which changes).

## 2. Orphan Files Identified
- **pages/NotFoundPage.tsx** — Exported in `index.ts:6` but NOT registered in `routes.tsx` `createAuthRoutes()`. No route references it. Either add to auth routes (e.g., catch-all `*`) or remove export.

## 3. Form & Type Violations
- **No `any` types found** in module (only `AnyRoute` from TanStack Router library).
- **All form pages correctly use React Hook Form + Zod** — `useLoginForm`, `useForgotPasswordForm`, `useResetPasswordForm` all use `zodResolver` with typed schemas.
- **No manual `useState` for form fields** in pages — all form state properly delegated to hooks.
- **api/auth.ts:21-25** — Defines `AxiosErrorResponse` interface for typed error handling (good, replaces previous unsafe cast).
- **routes.tsx:35** — Uses generic `TParent extends AnyRoute` properly typed (no `eslint-disable` for `any`).
- **context/AuthContext.tsx:11** — Imports `Action, ResourceName, ScopeName` types and uses strictly in `can()` signature.

===END_LOCAL_OPTIMIZATION===

===START_GLOBAL_SHARED===
## Module Context: auth
### 1. Reusable Component Misuse/Compliance
- **COMPLIANT** — All pages import shared components correctly:
  - `Button` from `@/shared/components/ui/Button`
  - `BrandLogo`, `BrandMark` from `@/shared/components/brand/BrandLogo`
  - `handleEnterAdvance` from `@/shared/lib/enter-advance`
  - `safeNavigate` from `@/shared/lib/safeNavigate`
  - `useEventListener` from `@/shared/hooks/useEventListener` (in `useAuthBootstrap`)
  - `authRoutes` canonical paths used everywhere (no hardcoded route strings)
  - RBAC utilities (`can`, `getCurrentEmploymentId`, `setCurrentEmploymentId`) from `@/shared/rbac`
- **NO REDUNDANT LOCAL VERSIONS** — No local Button, Input, Logo, or navigation utilities recreated.

### 2. Candidates for New Global Shared Components
| Candidate | Location(s) | Description |
|-----------|-------------|-------------|
| **AuthCard / AuthLayout** | `LoginPage.tsx:53-172`, `ForgotPasswordPage.tsx:34-121`, `ResetPasswordPage.tsx:37-124`, `SessionExpiredPage.tsx:7-22`, `AccessDeniedPage.tsx:7-25`, `NotFoundPage.tsx:7-17` | Centered card container with header, illustration, title, description, actions, footer. Shared max-width, padding, border, shadow, background tokens. |
| **StatusIllustration** | `LoginPage.tsx:42-45` (BrandMark), `ForgotPasswordPage.tsx:38-40` (lock_reset), `ForgotPasswordPage.tsx:85-88` (check_circle), `ResetPasswordPage.tsx:56-58` (password), `ResetPasswordPage.tsx:40-43` (check_circle), `SessionExpiredPage.tsx:9-11` (schedule), `AccessDeniedPage.tsx:9-11` (block), `NotFoundPage.tsx:9` (404 text) | Icon + semantic color token + size variants. Replaces repeated `material-symbols-outlined` spans with `bg-{color}/10` wrapper + `text-{color}` icon. |
| **ServerErrorAlert** | `LoginPage.tsx:72-76`, `ForgotPasswordPage.tsx:48-52`, `ResetPasswordPage.tsx:66-70` | Consistent error banner: `rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-body-sm text-error`. Accepts `message` prop. |
| **PasswordVisibilityToggle** | `LoginPage.tsx:118-127`, `ResetPasswordPage.tsx:84-92` | Reusable toggle button with `visibility`/`visibility_off` icon, `aria-label`, `onClick` handler. |
| **AuthFormField** | `LoginPage.tsx:78-99` (username), `LoginPage.tsx:101-132` (password), `ForgotPasswordPage.tsx:53-68` (email), `ResetPasswordPage.tsx:72-116` (password + confirm) | Wrapper combining label, icon prefix, input with RHF `register`, error message, Enter-advance handler. |
| **AuthFooterLinks** | `LoginPage.tsx:166-170`, `ForgotPasswordPage.tsx:124-126` | Copyright + legal links (Privacy, Terms, Help) with responsive layout. |
| **BackLink / PrimaryActionGroup** | `ForgotPasswordPage.tsx:73-79` (Back to Login), `ResetPasswordPage.tsx:49-51` (Go to Login), `SessionExpiredPage.tsx:17-20` (Back to Login), `AccessDeniedPage.tsx:17-23` (Dashboard + Login), `NotFoundPage.tsx:14-16` (Back to Dashboard) | Standardized navigation actions using `authRoutes` + `Button`/`Link` variants. |
| **usePasswordVisibility** | `hooks/useLoginForm.ts:29-30,41-43`, `hooks/useResetPasswordForm.ts:31-32,43-45` | Shared hook: `const [show, setShow] = useState(false); const toggle = () => setShow(v => !v);` |
| **useAuthFormSubmit** | `hooks/useLoginForm.ts:45-63`, `hooks/useForgotPasswordForm.ts:38-49`, `hooks/useResetPasswordForm.ts:47-67` | Generic mutation wrapper: `useMutation` + `safeNavigate` on success + `serverError` state + loading state. |

===END_GLOBAL_SHARED===