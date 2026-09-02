# Module Optimization Report: profile

**Updated:** 2026-09-02  
**Scope:** Form/type alignment, enums, safeNavigate + profileRoutes, tokens. No new components.

---

## Cleared this pass

| Item | Change |
|------|--------|
| Missing path helpers | `profileRoutes` in routes.tsx |
| `createProfileRoutes` `any` | `AnyRoute` generic |
| Hardcoded `/profile/*` nav | Profile / ChangePassword / ActiveSessions |
| emerald palette on password success | `bg-secondary/15` + `text-secondary` |
| Session status classes | `sessionStatusClass` enums |
| LANG / appearance constants | `schemas/enums.ts` |
| types alignment | Form + list response + enums re-exports |
| `useChangePassword` inline import | Proper `ChangePasswordInput` import |
| `toProfileUpdateInput` missing type import | Fixed |
| ChangePassword already RHF+Zod | Kept |

---

## Deferred

- ProfilePage full RHF + `profileFormSchema` (still draft `useState` + edit mode)
- Central query-key factory merge for `profileKeys`
- Orphan `uploadUserAvatar` / unused list schema cleanup
- New shared components

---

*Cleared items removed from action lists.*
