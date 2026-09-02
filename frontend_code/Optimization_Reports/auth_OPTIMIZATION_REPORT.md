# Module Optimization Report: auth

**Updated:** 2026-09-02  
**Scope this pass:** Form & type, hooks (useMutation), types/enums alignment, CSS tokens, safeNavigate/authRoutes.  
**Constraint:** No new components.

---

## Cleared this pass

| Item | Change |
|------|--------|
| Form pages RHF + Zod via hooks | Already true; verified |
| NotFound orphan | Registered in `createAuthRoutes` + `authRoutes.notFound` |
| Forgot/Reset direct API | `useMutation` in hooks |
| Demo token hardcoded string | `AUTH_DEMO_RESET_TOKEN` in `schemas/enums.ts` |
| Mock credentials location | `schemas/enums.ts` |
| Types scatter | `types.ts` re-exports schemas; entity types in `schemas/auth.ts` |
| `emerald-*` success colors | `bg-secondary/10` + `text-secondary` |
| Inline `getFullYear()` | `AUTH_COPYRIGHT_YEAR` |
| Unused imports on Login/Reset pages | Removed |
| Navigation | `authRoutes` + `safeNavigate` / Link variables only |

---

## Deferred (new components section — leave)

AuthCard, StatusIllustration, ServerErrorAlert, PasswordVisibilityToggle, AuthFormField, AuthFooterLinks, BackLink/PrimaryActionGroup, usePasswordVisibility, useAuthFormSubmit.

Also deferred: login `useMutation` wrapper, bootstrap `useSyncExternalStore`, AuthContext memo polish.

---

*Cleared items removed from action lists.*
