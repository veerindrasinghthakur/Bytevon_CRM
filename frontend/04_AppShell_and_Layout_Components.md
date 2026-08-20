# 04_AppShell_and_Layout_Components.md

# Bytevon Frontend — AppShell & Layout Components

**Project:** Bytevon ERP/CRM  
**Version:** 1.1  
**Status:** Locked  
**Last Updated:** 2026-08-20

---

## 1. Purpose

This document defines the structure, behaviour, and responsibilities of the main application shell and its layout components.

All authenticated pages (except pure Auth screens) must render inside the AppShell.

---

## 2. Overall Structure

```
┌────────────┬────────────────────┬──────────────────────────────────┐
│            │                    │  Header                          │
│  Icon Rail │  Secondary Sidebar │  (title / breadcrumbs, search,   │
│  (Primary) │  (Contextual)      │   notifications, profile)        │
│            │                    ├──────────────────────────────────┤
│  80px      │  240px             │                                  │
│  collapsed │  collapsed         │         Main Content             │
│  by default│  by default        │         (Outlet)                 │
│            │                    │                                  │
│  Logout    │                    │                                  │
│  (bottom)  │                    │                                  │
└────────────┴────────────────────┴──────────────────────────────────┘
```

**Widths (CSS variables):**
- `--sidebar-rail-width-collapsed: 80px`
- `--sidebar-rail-width-expanded: 220px` (optional)
- `--sidebar-secondary-width-collapsed: 0px` or icon-only
- `--sidebar-secondary-width-expanded: 240px`

---

## 3. Component Breakdown

### 3.1 AppShell

**Responsibility**
- Owns the overall layout grid.
- Renders IconRail + SecondarySidebar + Header + main content area + Contextual Detail Drawer.
- Manages collapse state for both sidebars.
- Provides context for current primary module so SecondarySidebar can render the correct items.
- Hosts the `QuickOverviewProvider` so any page can open the Contextual Detail Drawer.

**Props / State**
- `isRailCollapsed` (default: `true`)
- `isSecondaryCollapsed` (default: `true`)
- Current active primary route / module

**Children**
- `<Outlet />` from the router for page content.

---

### 3.2 IconRail (Primary Sidebar)

**Purpose**  
Primary module navigation. Always present on authenticated pages.

**Behaviour**
- Collapsed by default (icons only).
- User can expand/collapse.
- On expand: shows icon + short label.
- Active item is clearly highlighted.
- Tooltip on hover when collapsed.
- Logout button fixed at the bottom.

**Items (locked order)**

| Order | Icon                    | Label          | Route Prefix     | Visibility          |
|-------|-------------------------|----------------|------------------|---------------------|
| 1     | `dashboard`             | Dashboard      | `/dashboard`     | Always              |
| 2     | `trending_up`           | Sales          | `/sales`         | Permission          |
| 3     | `folder_managed`        | Projects       | `/projects`      | Permission          |
| 4     | `groups`                | Workforce      | `/workforce`     | Permission          |
| 5     | `person`                | My Work        | `/my-work`       | Always              |
| 6     | `fact_check`            | Approvals      | `/approvals`     | Can-approve         |
| 7     | `admin_panel_settings`  | Administration | `/admin`         | Admin only          |
| —     | `logout`                | Logout         | —                | Bottom of rail      |

**Notes**
- Notifications and Profile are **not** in the Icon Rail (they live in the Header).
- Items are filtered by the current user’s permissions.

---

### 3.3 SecondarySidebar

**Purpose**  
Contextual navigation for the currently active primary module.

**Behaviour**
- Collapsed by default.
- Content changes based on the active IconRail item.
- Supports expand/collapse independently of the Icon Rail.
- On mobile: remains collapsed / icon-only (final mobile pattern TBD).

**Content by Module**

#### Sales
- Leads
- Clients
- Analytics
- Activity

#### Projects
- All Projects
- Teams
- Tasks

#### Workforce
- Employees
- Departments
- Attendance (org-wide)

#### My Work
- My Attendance
- My Leave
- My Tasks
- My Approvals

#### Approvals
- Pending Approvals
- My Requests

#### Administration
- Users
- Roles & Permissions
- Settings
- Audit Logs
- Notifications Management

**Empty state**  
When no secondary items exist for a module (or user has no permission), the secondary sidebar can stay fully collapsed.

---

### 3.4 Header

**Contents (left → right)**
1. Page title or Breadcrumbs
2. Search (see Search Rules)
3. Notifications (icon + unread badge)
4. User Profile (avatar + dropdown)

**Search Rules**
- Default: full search input visible in Header.
- When the current page has its own dedicated search bar → Header search collapses to a **search icon** only.
- Only one visible search bar should exist at any time.

**Not allowed in Header**
- Logout (belongs in Icon Rail)
- Primary “New / Create” button (belongs on the page)

**Height:** `HEADER_HEIGHT_PX = 56` (fixed).

---

### 3.5 Contextual Detail Drawer (Overview Panel)

**Status:** Locked (2026-08-20)

**Purpose**  
Quick look + light actions for any entity while the user remains on the list/grid page.

**Behaviour (locked)**
- **Not permanent.** There is no always-visible split-pane overview panel.
- Appears only when the user clicks a primary data item (employee card/row, project card/row, department, task, lead, client, location, role, etc.).
- Drawer-based — slides in from the right.
- **Height is strictly between the App Header and the bottom of the viewport** (or footer if present). It never covers the global header.
- Only one drawer open at a time. Selecting a different item while open simply replaces the drawer content.
- Closes via X button, Escape key, backdrop click, or navigating away from the page.
- On mobile: becomes a full-height bottom sheet or full-screen panel.

**Content guidelines**
- Identity (name, avatar/status)
- Key status / stage badges
- Most important metadata (owner, dates, counts)
- Primary quick actions (Edit, Archive, Assign, …)
- Optional short activity snippet or related counts
- Link/button to open the full detail page for deeper work

**Relationship to full detail pages**
- The drawer is a lightweight companion.
- Complex editing, multi-tab content, and long forms continue to live on dedicated detail routes or larger form drawers.

**Implementation**
- Provider: `QuickOverviewProvider` (mounted in AppShell)
- Hook: `useQuickOverview()` → `openPanel(title, content)`, `closePanel()`
- Panel: `QuickOverviewPanel` (mounted once in AppShell)

---

### 3.6 PageHeader (optional helper component)

Used inside individual pages for consistency.

Typical structure:
```
[Page Title]                    [Filters]  [New Button]
[Breadcrumbs or description]
```

- The “New” / primary action button lives here (or in the page content), never in the global Header.

---

## 4. Collapse Behaviour Summary

| Element                    | Default State | User Controllable | Mobile Behaviour          |
|----------------------------|---------------|-------------------|---------------------------|
| Icon Rail                  | Collapsed     | Yes               | Collapsed / icon-only     |
| Secondary Sidebar          | Collapsed     | Yes               | Collapsed / icon-only     |
| Header Search              | Expanded      | Auto (page-based) | Icon only                 |
| Contextual Detail Drawer   | Closed        | On item click     | Bottom sheet / full-screen|

---

## 5. Responsive Notes (Current Locked Decisions)

- **Desktop (≥1024px)**: Full Icon Rail + Secondary Sidebar (both start collapsed).
- **Tablet**: Same as desktop for now.
- **Mobile (<768px)**:
  - No bottom navigation (decision deferred).
  - Both sidebars start collapsed / icon-only.
  - Contextual Detail Drawer becomes a full-height bottom sheet or full-screen panel.
  - Header remains the top bar.

---

## 6. Implementation Guidelines

- All widths, colors, and spacing must come from CSS variables (`tokens.css`).
- Icon Rail and Secondary Sidebar should be independent components that receive collapse state via context or props.
- Active route detection should use the router’s current location.
- Permission filtering must happen before rendering items.
- Any list/grid page that shows entity cards or rows should call `openPanel()` on item click so the Contextual Detail Drawer appears.

---

## 7. Related Documents

- `02_Layout_Navigation_Routing.md`
- `03_Frontend_Project_Structure.md`
- Design System tokens
- `design-system/09_Layout_System.md` (Contextual Detail Drawer section)
