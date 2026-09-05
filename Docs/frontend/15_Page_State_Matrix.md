# 15_Page_State_Matrix.md

# Bytevon Frontend — Page State Matrix

**Project:** Bytevon ERP/CRM  
**Version:** 1.0  
**Status:** Locked  
**Last Updated:** 2026-08-07

---

## 1. Purpose

Every page must explicitly handle a defined set of states. This matrix is the checklist for both humans and code generation.

---

## 2. Core States (Required for almost every page)

| State            | Description                                      | Typical UI |
|------------------|--------------------------------------------------|------------|
| Loading          | Data is being fetched                            | Skeleton or spinner |
| Success          | Data loaded successfully                         | Main content |
| Empty            | Request succeeded but there is no data           | EmptyState + CTA |
| Error            | Request failed                                   | Error message + Retry |
| No Permission    | User is authenticated but lacks permission       | Access denied message or redirect |

---

## 3. State Requirements by Page Type

### List Pages (Leads, Projects, Employees, etc.)

- Loading
- Success (with data)
- Empty
- Error
- No Permission
- (Optional) Partial loading when filters change

### Detail Pages

- Loading
- Success
- Not Found (entity does not exist)
- Error
- No Permission

### Create Pages

- Idle / Ready
- Submitting
- Success (then redirect or show success message)
- Validation Error (field level)
- Server Error
- No Permission

### Edit Pages

- Loading (initial data)
- Ready (form prefilled)
- Submitting
- Success
- Validation Error
- Server Error
- Not Found
- No Permission

### Dashboard / Overview Pages

- Loading
- Success (widgets may load independently)
- Error (per widget or global)
- Empty (no widgets / no data)
- No Permission (hide whole dashboard or sections)

---

## 4. Implementation Rules

- Never show a blank white screen.
- Prefer skeletons over generic spinners for list and detail pages.
- Empty states must offer a clear next action when possible (e.g. “Create first lead”).
- Error states must offer a Retry action when the error is recoverable.
- No-Permission should either redirect to `/access-denied` or show an in-place restricted view.

---

## 5. Quick Checklist for Code Generation

When generating any page, confirm:

- [ ] Loading state exists
- [ ] Empty state exists (for lists)
- [ ] Error state exists
- [ ] Success state exists
- [ ] No-Permission is handled
- [ ] Not-Found is handled (for detail pages)

---

## 6. Related Documents

- `12_Module_Implementation_Checklist.md`
- `14_Code_Generation_Rules.md`
- `09_Table_and_List_Patterns.md`
- `08_Form_Patterns.md`
