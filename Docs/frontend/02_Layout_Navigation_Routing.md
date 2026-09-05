# 02_Layout_Navigation_Routing.md

# Bytevon Frontend — Layout, Navigation & Routing

**Project:** Bytevon ERP/CRM  
**Version:** 1.2  
**Status:** Locked (updated 2026-08-08)  
**Last Updated:** 2026-08-08

---

## Maintainability

Any architecture or UX rule change must be updated in this repo (frontend docs + code) in the same change set.

---

## Shell heights (aligned)

- **Header height:** `56px` (`h-14`). Constant: `HEADER_HEIGHT_PX`.
- **Secondary sidebar title / collapse row:** same **56px** height so the bottom border lines up with the header.
- Main content `margin-top` / height use `HEADER_HEIGHT_PX`.

---

## Search

- Header global search stays **full** for now (do not collapse to icon until product decides).
- List pages still have their own search **on the left**, filter dropdowns on the **right** (Projects is the reference pattern for Teams, Tasks, and other lists).

---

## Breadcrumbs & Back

- Pages opened **from the nav bars** (list roots: `/projects`, `/projects/teams`, `/projects/tasks`, `/sales/leads`, …): **no path breadcrumbs**, **no back button**.
- Pages opened **from those list pages** (create, detail, edit): **show path + Back** (`BackButton` / `PageHeader` with `showBack`).

---

## Tasks belong to Projects

- A **task is a sub-part of a project** (`projectId` required in domain model).
- Global Tasks list shows all tasks; **Project detail** lists that project’s tasks and can **Create task** pre-bound to the project.
- Create task route accepts optional `projectId` search param.

---

## Related

- `01_Screen_Inventory.md`, `03_Frontend_Project_Structure.md`, `04_AppShell_and_Layout_Components.md`
