# Module Optimization Report: workforce

**Updated:** 2026-09-02  
**Status:** Attendance API + EmployeeCreate RHF cleared.

---

## Cleared

- Employment state tokens + EmployeeDetail RHF
- ChangeAssignment / AssignProject / DepartmentCreate / ShiftCreate → RHF+Zod
- List + detail palette / login styles
- Route helpers on nav flows
- **Attendance mock → API** — `api/attendance.ts` + `hooks/use-attendance.ts`; dashboard / employees list / detail / day detail on TanStack Query; seed via shared mock when `env.useMockApi`
- **EmployeeCreate multi-step RHF** — profile step `useForm` + `zodResolver(employmentFormSchema)` + Controllers on Selects; UI-only fields local; auth step optional post-create
- AttendanceEmployees semantic `workforceAttendanceStatusStyles` + `workforceRoutes.attendanceRecordPath`

## Deferred

- New shared components
- Auth step formal RHF schema (low value; simple 3-field optional step)
- Roster still synthesizes status from employments list (no dedicated roster endpoint yet)

---
