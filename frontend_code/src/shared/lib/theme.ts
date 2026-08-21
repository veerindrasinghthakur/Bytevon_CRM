/**
 * Global light/dark theme — preference + DOM application.
 * Tokens live in styles/tokens.css (:root) and styles/tokens-dark.css ([data-theme="dark"]).
 */

export type ThemeMode = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'bytevon-theme'

export function getSystemTheme(): ThemeMode {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function readStoredTheme(): ThemeMode | null {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY)
    if (v === 'light' || v === 'dark') return v
  } catch {
    /* private mode / blocked storage */
  }
  return null
}

/** Resolve effective theme: stored preference > system > light */
export function resolveTheme(): ThemeMode {
  return readStoredTheme() ?? getSystemTheme()
}

export function applyTheme(mode: ThemeMode): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.setAttribute('data-theme', mode)
  // Keep Tailwind darkMode: 'class' in sync for any rare dark: utilities
  root.classList.toggle('dark', mode === 'dark')
  root.classList.toggle('light', mode === 'light')
}

export function persistTheme(mode: ThemeMode): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode)
  } catch {
    /* ignore */
  }
}

export function setTheme(mode: ThemeMode): void {
  applyTheme(mode)
  persistTheme(mode)
}

export function toggleTheme(current: ThemeMode): ThemeMode {
  const next: ThemeMode = current === 'dark' ? 'light' : 'dark'
  setTheme(next)
  return next
}
