# 13_Naming_and_Code_Conventions.md

# Bytevon Frontend — Naming & Code Conventions

**Project:** Bytevon ERP/CRM  
**Version:** 1.0  
**Status:** Locked  
**Last Updated:** 2026-08-07

---

## 1. Purpose

Consistent naming makes code generation and maintenance reliable. All generated and hand-written code must follow these rules.

---

## 2. File & Folder Naming

| Item                    | Convention                  | Example |
|-------------------------|-----------------------------|---------|
| Folders                 | kebab-case                  | `my-work`, `sales` |
| React components        | PascalCase                  | `LeadDetailPage.tsx` |
| Hooks                   | camelCase starting with `use` | `useLeads.ts` |
| API files               | kebab-case or camelCase     | `leads.ts` |
| Zod schemas             | camelCase                   | `lead.ts` |
| Types                   | PascalCase                  | `Lead.ts` or inside schema file |
| CSS / tokens            | kebab-case                  | `tokens.css` |

---

## 3. Component Naming

- Pages end with `Page`: `LeadListPage`, `ProjectDetailPage`
- Forms end with `Form`: `CreateLeadForm`, `EditEmployeeForm`
- Shared UI components are short and generic: `Button`, `StatusBadge`, `DataTable`
- Module-specific components may be prefixed: `LeadStatusBadge` (only if truly specific)

---

## 4. Hook Naming

```
use<Entity>List
use<Entity>
useCreate<Entity>
useUpdate<Entity>
useDelete<Entity>          // or useArchive<Entity>
use<Entity>Mutation        // generic fallback
```

Examples:
- `useLeads`
- `useLead(id)`
- `useCreateLead`
- `useUpdateProject`

---

## 5. Query Key Conventions

```ts
['sales', 'leads']
['sales', 'leads', leadId]
['sales', 'leads', { status, page, search }]
['projects', 'teams', teamId]
['projects', 'teams', teamId, 'members']
['my-work', 'leave', 'balance']
```

Rules:
- Start with module name
- Then entity
- Then id or filters object
- Keep keys serializable and stable

---

## 6. Variable & Function Naming

- `isLoading`, `isError`, `isSuccess` (from TanStack Query)
- `handleSubmit`, `handleDelete`, `onConfirm`
- Boolean props: `isOpen`, `isDisabled`, `isSelected`
- Event handlers: `onClick`, `onChange`, `onSubmit`

---

## 7. Import Order (recommended)

1. React / external libraries
2. Shared internal (`@/shared/...`)
3. Module internal (`../hooks`, `../schemas`)
4. Types
5. Styles (if any)

---

## 8. Related Documents

- `03_Frontend_Project_Structure.md`
- `12_Module_Implementation_Checklist.md`
- `06_API_Integration_Patterns.md`
