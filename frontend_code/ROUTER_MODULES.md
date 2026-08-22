# Module route factories

Each module exports `create*Routes(parentRoute)` from `routes.tsx`.

| Module | Factory |
|--------|---------|
| notifications | `createNotificationRoutes(appLayoutRoute)` |
| my-work | `createMyWorkRoutes(appLayoutRoute)` |
| approvals | `createApprovalRoutes(appLayoutRoute)` |
| dashboard | `createDashboardRoutes(appLayoutRoute)` |
| organization | `createOrganizationSettingsRoutes(settingsLayout)` + `createWorkforceShiftRoutes(appLayout)` |
| sales | `createSalesRoutes(appLayoutRoute)` |
| projects | `createProjectsRoutes(appLayoutRoute)` |
| payroll | `createPayrollRoutes(appLayoutRoute)` |
| profile | `createProfileRoutes(appLayoutRoute)` |

Wire in `app/router/index.tsx`:

```ts
appLayoutRoute.addChildren([
  ...createDashboardRoutes(appLayoutRoute),
  ...createProfileRoutes(appLayoutRoute),
  ...createNotificationRoutes(appLayoutRoute),
  ...createMyWorkRoutes(appLayoutRoute),
  ...createApprovalRoutes(appLayoutRoute),
  ...createSalesRoutes(appLayoutRoute),
  ...createProjectsRoutes(appLayoutRoute),
  ...createPayrollRoutes(appLayoutRoute),
  ...createWorkforceShiftRoutes(appLayoutRoute),
  // admin layout + ...createOrganizationSettingsRoutes(adminSettingsLayoutRoute)
])
```

Admin + workforce employee/dept trees still partially inline until `admin/routes.tsx` and `workforce/routes.tsx` are fully extracted.

## Organization ShiftDetail fix

`can()` accepts **one** object: `can({ action: Action.CREATE, resource: ResourceName.SHIFT })`.
Calling `can(Action.CREATE, ResourceName.SHIFT)` caused **Expected 1 arguments, but got 2**.
