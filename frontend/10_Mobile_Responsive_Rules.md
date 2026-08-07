# 10_Mobile_Responsive_Rules.md

# Bytevon Frontend — Mobile & Responsive Rules

**Project:** Bytevon ERP/CRM  
**Version:** 1.0  
**Status:** Draft (partially locked)  
**Last Updated:** 2026-08-07

---

## 1. Purpose

Captures the current decisions and open points regarding responsive behaviour.

---

## 2. Locked Decisions

### Desktop (≥ 1024px)
- Icon Rail + Secondary Sidebar
- Both start **collapsed by default**
- User can expand/collapse each independently

### Tablet (768px – 1023px)
- Follow desktop behaviour for now (both sidebars collapsed by default)

### Mobile (< 768px)
- **No bottom navigation** (decision deferred — will be revisited later)
- Both sidebars start collapsed / icon-only
- Secondary sidebar is collapsed or icon-only
- Header remains the top bar (title + icons)
- Exact mobile navigation pattern (drawer, sheet, etc.) is **not yet finalized**

---

## 3. Search Behaviour

- On mobile the Header search is typically an icon that opens a search experience (full-screen or expanded input).
- Page-level search bars (when present) still follow the “only one visible search at a time” rule.

---

## 4. Tables & Lists on Mobile

- Prefer card-based layouts or horizontally scrollable tables.
- Critical actions should remain reachable without horizontal scrolling.
- Bulk selection UX needs careful design on small screens.

---

## 5. Open Points (to be decided later)

- Final mobile primary navigation pattern (bottom nav vs drawer vs other)
- Whether the Icon Rail becomes a hamburger-triggered drawer on mobile
- Gesture support (swipe to open/close sidebars)
- Safe-area handling for notched devices

---

## 6. Implementation Notes

- Use CSS variables for breakpoints and sidebar widths.
- Prefer container queries or Tailwind responsive prefixes consistently.
- Test collapse/expand behaviour thoroughly across breakpoints.

---

## 7. Related Documents

- `04_AppShell_and_Layout_Components.md`
- `02_Layout_Navigation_Routing.md`
