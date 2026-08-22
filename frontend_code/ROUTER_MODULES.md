# Module route factories

Each module exports `create*Routes(parentRoute)` from `routes.tsx`.
`app/router/index.tsx` only owns root/auth shell and spreads module factories.

| Module | Factory |
|--------|---------|
| dashboard | `createDashboardRoutes(appLayoutRoute)` |
| profile | `createProfileRoutes(appLayoutRoute)` |
| notifications | `createNotificationRoutes(appLayoutRoute)` |
| my-work | `createMyWorkRoutes(appLayoutRoute)` |
| approvals | `createApprovalRoutes(appLayoutRoute)` |
| sales | `createSalesRoutes(appLayoutRoute)` |
| projects | `createProjectsRoutes(appLayoutRoute)` |
| payroll | `createPayrollRoutes(appLayoutRoute)` |
| workforce | `createWorkforceRoutes(appLayoutRoute)` |
| organization | `createOrganizationSettingsRoutes(settingsLayout)` + `createWorkforceShiftRoutes(appLayout)` |
| admin | `createAdminRoutes(appLayout)` + `createAdminSettingsLayoutRoute` + `createAdminSettingsCoreRoutes` |

## Organization

- API: `env.useMockApi` branch in `api/organization.ts`
- State: TanStack Query hooks in `hooks/use-locations.ts`, `use-shifts.ts`, `use-organization.ts`
- `LocationDetailPage` / `ShiftDetailPage`: shared `BackButton`, `EditButton`, `useEditMode`, loading/error states
- `can()` **must** be called as `can({ action, resource })` — never two positional args

## Wire pattern

```ts
const adminSettingsLayoutRoute = createAdminSettingsLayoutRoute(appLayoutRoute)

appLayoutRoute.addChildren([
  ...createDashboardRoutes(appLayoutRoute),
  ...createProfileRoutes(appLayoutRoute),
  ...createNotificationRoutes(appLayoutRoute),
  ...createMyWorkRoutes(appLayoutRoute),
  ...createApprovalRoutes(appLayoutRoute),
  ...createSalesRoutes(appLayoutRoute),
  ...createProjectsRoutes(appLayoutRoute),
  ...createPayrollRoutes(appLayoutRoute),
  ...createWorkforceRoutes(appLayoutRoute),
  ...createWorkforceShiftRoutes(appLayoutRoute),
  ...createAdminRoutes(appLayoutRoute),
  adminSettingsLayoutRoute.addChildren([
    ...createAdminSettingsCoreRoutes(adminSettingsLayoutRoute),
    ...createOrganizationSettingsRoutes(adminSettingsLayoutRoute),
  ]),
])
```
