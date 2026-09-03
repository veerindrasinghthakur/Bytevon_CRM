/** Profile module constants / style maps — semantic tokens only. */

export const PROFILE_LANG_OPTIONS = [
  { value: 'en', label: 'English (US)' },
  { value: 'de', label: 'German (DE)' },
  { value: 'fr', label: 'French (FR)' },
  { value: 'es', label: 'Spanish (ES)' },
] as const

export const APPEARANCE_OPTIONS = ['light', 'dark', 'system'] as const

/** Session status badge classes */
export const sessionStatusStyles = {
  active: 'status-badge status-success',
  inactive: 'status-badge status-neutral',
} as const

export function sessionStatusClass(_status: string, isActive: boolean): string {
  return isActive ? sessionStatusStyles.active : sessionStatusStyles.inactive
}
