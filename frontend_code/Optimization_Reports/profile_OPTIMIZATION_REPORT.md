# Module Optimization Report: profile

**Updated:** 2026-09-02

---

## Cleared

| Item | Change |
|------|--------|
| Query key factory | `queryKeys.profile` + `invalidate.profile` |
| Local `profileKeys` in hook | Uses central factory |
| Orphan `uploadUserAvatar` | Removed from API surface (self avatar via `uploadAvatar` remains) |
| Nav / tokens / enums | Prior pass |

---

## Deferred

- ProfilePage full RHF + `profileFormSchema` (still draft `useState` + `useEditMode`)
- New shared components

---
