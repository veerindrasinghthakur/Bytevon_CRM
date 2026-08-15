# 16_Take_a_Break.md

# Bytevon Frontend — Take a Break

**Project:** Bytevon ERP/CRM  
**Version:** 1.0  
**Status:** Implemented (client-side)  
**Branch:** `sales`  
**Last Updated:** 2026-08-14

---

## 1. Purpose

Let employees start a short break from anywhere in the app. Support a **timed countdown** or an **open stopwatch** that runs until the user ends the break. Surface status in the shell header and on **My Work** overview.

---

## 2. Entry points

| Location | Behaviour |
|----------|-----------|
| Header chip (left of clock) | Label **Take a break**; when running, shows live remaining/elapsed time. Links to `/my-work/break`. |
| My Work overview | **Breaks** status card: current break or last completed; actions Open / End / Take a break. |
| Route | `/my-work/break` — full page to start or manage a break. |
| Secondary nav (My Work) | Optional item **Take a Break** → `/my-work/break`. |

---

## 3. Behaviour rules

1. User may enter **duration in minutes** (optional presets: 5 / 10 / 15 / 30).
2. If duration is **empty or invalid** → mode = **stopwatch**; timer increases until **End break**.
3. If duration is a positive number → mode = **countdown**; show remaining time; when it hits zero, break auto-ends and is stored in history.
4. Optional **note** (coffee, walk, lunch…).
5. Only **one active** break at a time; starting while one is active is a no-op (returns existing).
6. **End break** always stops the active session and appends it to local history.

---

## 4. Implementation (current)

| Piece | Path |
|-------|------|
| Session API | `frontend_code/src/modules/my-work/lib/break-session.ts` |
| Page | `frontend_code/src/modules/my-work/pages/TakeABreakPage.tsx` |
| Dashboard card | `frontend_code/src/modules/my-work/components/BreakStatusCard.tsx` |
| Header chip | `frontend_code/src/shared/components/layout/HeaderBreakChip.tsx` |

**Persistence (browser only until API exists):**

- `localStorage` key `bytevon.activeBreak` — active session JSON  
- `localStorage` key `bytevon.breakHistory` — last 20 completed sessions  
- Custom event `bytevon:break-change` for same-tab UI sync  

**Session shape:**

```ts
{
  id: string
  mode: 'countdown' | 'stopwatch'
  startedAt: string // ISO
  durationMinutes?: number
  endedAt?: string
  note?: string
}
```

---

## 5. Future (backend)

- POST/GET break sessions per employee  
- Attendance / timesheet integration (paid vs unpaid break)  
- Manager visibility and policies (max break length, frequency)  

Until then, do not treat localStorage as a source of truth for payroll.

---

## 6. Related documents

- `01_Screen_Inventory.md` (add Take a Break under My Work when inventory is revised)  
- `12_Module_Implementation_Checklist.md`  
- `15_Page_State_Matrix.md`  
