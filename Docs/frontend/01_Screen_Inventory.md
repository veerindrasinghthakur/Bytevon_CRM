# 01_Screen_Inventory.md

# Bytevon Frontend — Screen Inventory

**Project:** Bytevon ERP/CRM  
**Version:** 1.1  
**Status:** Draft (Navigation locked)  
**Last Updated:** 2026-08-13

---

## 1. Purpose

This document lists every screen required by the Bytevon frontend, grouped by module.  
It is derived from:

- Stitch UI exports (main set + Projects set)
- Backend module architecture (Sales, Developer, Attendance, Leave, Approval, etc.)
- Locked navigation decisions

Screens marked **(Pending UI)** do not yet have final Stitch designs but are required by the architecture and must be implemented.

---

## 2. Auth Module

| Screen                    | Route                     | Notes                          |
|---------------------------|---------------------------|--------------------------------|
| Login (Desktop)           | `/login`                  |                                |
| Login (Mobile)            | `/login`                  | Responsive variant             |
| Forgot Password           | `/forgot-password`        |                                |
| Reset Password            | `/reset-password`         | Token-based                    |
| Update Password           | `/profile/password`       | Authenticated                  |
| Session Expired           | `/session-expired`        |                                |
| Access Denied             | `/access-denied`          | 403                            |
| Page Not Found            | `*`                       | 404                            |

---

## 3. Dashboard

| Screen                    | Route                     | Notes                          |
|---------------------------|---------------------------|--------------------------------|
| Role-based Dashboard      | `/dashboard`              | Employee / Manager / Executive / Sales variants |
| Empty / Loading / Error states | —                    | Covered in Stitch              |

---

## 4. Sales Module

| Screen                    | Route                     | Notes                          |
|---------------------------|---------------------------|--------------------------------|
| Leads List                | `/sales/leads`            |                                |
| Create / Edit Lead        | `/sales/leads/new`, `/sales/leads/:id/edit` |                |
| Lead Details              | `/sales/leads/:id`        |                                |
| Clients List              | `/sales/clients`          |                                |
| Client Details            | `/sales/clients/:id`      |                                |
| Sales Analytics           | `/sales/analytics`        |                                |
| Activity Timeline         | `/sales/activity`         |                                |
| Case Study Management     | `/sales/case-studies`     | Optional / lower priority      |

---

## 5. Projects (Developer) Module

| Screen                    | Route                     | Notes                          |
|---------------------------|---------------------------|--------------------------------|
| Projects List             | `/projects`               |                                |
| Create Project            | `/projects/new`           |                                |
| Project Details           | `/projects/:id`           | With right overview panel      |
| Teams List                | `/projects/teams`         | **(Pending UI)** — include now |
| Create Team               | `/projects/teams/new`     | **(Pending UI)**               |
| Team Details              | `/projects/teams/:id`     | **(Pending UI)**               |
| Tasks List                | `/projects/tasks`         |                                |
| Create Task               | `/projects/tasks/new`     |                                |
| Task Details              | `/projects/tasks/:id`     |                                |

---

## 6. Workforce Module

| Screen                    | Route                     | Notes                          |
|---------------------------|---------------------------|--------------------------------|
| Employees List            | `/workforce/employees`    | Multi-select, archive support  |
| Employee Details          | `/workforce/employees/:id`|                                |
| Add / Edit Employee       | `/workforce/employees/new`, `.../edit` |                   |
| Departments List          | `/workforce/departments`  |                                |
| Department Details        | `/workforce/departments/:id` |                             |
| Add / Edit Department     | `/workforce/departments/new`, `.../edit` |               |
| Org Attendance Overview   | `/workforce/attendance`   | All-employees view             |

---

## 7. My Work (Employee Self-Service)

| Screen                    | Route                     | Notes                          |
|---------------------------|---------------------------|--------------------------------|
| My Work Overview          | `/my-work`                | Hub: KPIs, quick actions       |
| My Attendance             | `/my-work/attendance`     | Mark + calendar + history      |
| Mark Attendance           | `/my-work/attendance/mark`| Create / check-in flow         |
| Attendance Details        | `/my-work/attendance/:id` | Day detail                     |
| Attendance Corrections    | `/my-work/attendance/corrections` | Request corrections     |
| My Leave                  | `/my-work/leave`          | Balances + list                |
| Apply for Leave           | `/my-work/leave/apply`    | Create leave request           |
| Leave Balance             | `/my-work/leave/balance`  | Optional deep link to balances |
| Leave Calendar            | `/my-work/leave/calendar` | Optional                       |
| Leave Details             | `/my-work/leave/:id`      | Request detail                 |
| My Tasks                  | `/my-work/tasks`          | Assigned + self-created        |
| Create Task (self)        | `/my-work/tasks/new`      | Employee can create own tasks  |
| Task Details              | `/my-work/tasks/:id`      |                                |
| My Approvals / Requests   | `/my-work/approvals`      | Submitted by me                |
| Request Details           | `/my-work/approvals/:id`  |                                |

**UX rules**

- Create / New actions live **on the list page** (top-right), not only in secondary nav.
- **Back** on create/detail pages returns to the **previous route the user came from** (browser history). Do not hard-wire Back to a fixed parent unless history is empty.

---

## 8. Approvals Module

| Screen                    | Route                     | Notes                          |
|---------------------------|---------------------------|--------------------------------|
| Approval Center           | `/approvals`              |                                |
| Pending Approvals         | `/approvals/pending`      |                                |
| My Requests               | `/approvals/my-requests`  |                                |
| Approval Details          | `/approvals/:id`          |                                |

---

## 9. Administration Module

| Screen                    | Route                     | Notes                          |
|---------------------------|---------------------------|--------------------------------|
| Users Management          | `/admin/users`            |                                |
| Roles & Permissions       | `/admin/roles`            |                                |
| Add / Edit Role           | `/admin/roles/new`, `.../edit` |                           |
| Organization / Master Settings | `/admin/settings`    |                                |
| Audit Logs                | `/admin/audit`            |                                |
| Notifications Management  | `/admin/notifications`    | Compose / Sent / Settings      |
| Security Center           | `/admin/security`         | Optional                       |
| Attendance Settings       | `/admin/settings/attendance` |                             |
| Leave Settings            | `/admin/settings/leave`   |                                |

---

## 10. Notifications & Profile

| Screen                    | Route                     | Notes                          |
|---------------------------|---------------------------|--------------------------------|
| Notification Center       | `/notifications`          |                                |
| User Profile              | `/profile`                |                                |
| Notification Preferences  | `/profile/notifications`  |                                |

---

## 11. Shared / Utility Screens

- Loading states
- Empty states
- Error states
- Access Denied / 403
- 404

---

## 12. Notes

- All list pages should support: search, filters, pagination / infinite scroll, bulk actions where relevant.
- Create / New actions live **on the page** (usually top-right).
- Teams screens are architecturally required even though final Stitch designs are pending.
- **Back navigation:** use browser history so the user returns to the page they came from; fixed `backTo` is only a fallback when history is unavailable.
