/**
 * Global light/dark theme — preference + DOM application.
 * Tokens live in styles/tokens.css (:root) and styles/tokens-dark.css ([data-theme="dark"]).
 */

/** Effective applied theme on the document */
export type ThemeMode = 'light' | 'dark'

/** User preference including follow-system */
export type ThemePreference = 'light' | 'dark' | 'system'

export const THEME_STORAGE_KEY = 'bytevon-theme'

export function getSystemTheme(): ThemeMode {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function readStoredPreference(): ThemePreference | null {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY)
    if (v === 'light' || v === 'dark' || v === 'system') return v
  } catch {
    /* private mode / blocked storage */
  }
  return null
}

/** @deprecated use readStoredPreference */
export function readStoredTheme(): ThemeMode | null {
  const p = readStoredPreference()
  if (p === 'light' || p === 'dark') return p
  return null
}

/** Resolve effective theme from preference */
export function resolveTheme(preference?: ThemePreference | null): ThemeMode {
  const pref = preference ?? readStoredPreference() ?? 'system'
  if (pref === 'system') return getSystemTheme()
  return pref
}

export function applyTheme(mode: ThemeMode): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.setAttribute('data-theme', mode)
  root.classList.toggle('dark', mode === 'dark')
  root.classList.toggle('light', mode === 'light')
}

export function persistPreference(pref: ThemePreference): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, pref)
  } catch {
    /* ignore */
  }
}

export function setThemePreference(pref: ThemePreference): ThemeMode {
  persistPreference(pref)
  const effective = resolveTheme(pref)
  applyTheme(effective)
  return effective
}

/** @deprecated prefer setThemePreference */
export function setTheme(mode: ThemeMode): void {
  setThemePreference(mode)
}

export function toggleTheme(current: ThemeMode): ThemeMode {
  const next: ThemeMode = current === 'dark' ? 'light' : 'dark'
  setThemePreference(next)
  return next
}
