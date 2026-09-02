# Module Optimization Report: notifications

**Updated:** 2026-09-02  
**Scope:** Form/type, enums, safeNavigate + route vars, CSS tokens. No new components.

---

## Cleared this pass

| Item | Change |
|------|--------|
| Missing path helpers | `notificationRoutes` in routes.tsx |
| `createNotificationRoutes` `any` parent | `AnyRoute` generic |
| Hardcoded navigate paths | Center / Compose / Sent / Detail → `safeNavigate` + `notificationRoutes` |
| Enums file | `schemas/enums.ts` (priority dots, delivery status, compose options) |
| types alignment | Re-exports enums |
| Compose `useState` import at file bottom | Fixed (imports at top) |
| Palette priority/status colors | Semantic / status-badge tokens |
| `text-deep-navy` on updated pages | `text-on-background` |
| Forms | Compose + Settings already RHF+Zod |

---

## Deferred

- New shared components (Toggle extract, NotificationCard, KPI card, etc.)
- Settings page residual `text-deep-navy` if any remain after visual sweep
- Extract compose form into dedicated hook (optional)

---

*Cleared items removed from action lists.*
