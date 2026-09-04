/** Session employment id for RBAC (localStorage until auth owns it exclusively). */

const EMPLOYMENT_KEY = 'bytevon_current_employment_id'

export function getCurrentEmploymentId(): number | null {
  try {
    const raw = localStorage.getItem(EMPLOYMENT_KEY)
    if (!raw) return 1
    const n = Number(raw)
    return Number.isFinite(n) ? n : 1
  } catch {
    return 1
  }
}

export function setCurrentEmploymentId(id: number | null) {
  try {
    if (id == null) localStorage.removeItem(EMPLOYMENT_KEY)
    else localStorage.setItem(EMPLOYMENT_KEY, String(id))
  } catch {
    /* ignore */
  }
}
