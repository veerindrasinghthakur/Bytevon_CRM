import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  applyTheme,
  resolveTheme,
  setThemePreference,
  readStoredPreference,
  type ThemeMode,
  type ThemePreference,
} from '@/shared/lib/theme'

type ThemeContextValue = {
  theme: ThemeMode
  preference: ThemePreference
  setPreference: (pref: ThemePreference) => void
  setTheme: (mode: ThemeMode) => void
  toggleTheme: () => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(
    () => readStoredPreference() ?? 'system',
  )
  const [theme, setThemeState] = useState<ThemeMode>(() => resolveTheme(readStoredPreference()))

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    if (preference !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      const next = mq.matches ? 'dark' : 'light'
      setThemeState(next)
      applyTheme(next)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [preference])

  const setPreference = useCallback((pref: ThemePreference) => {
    const effective = setThemePreference(pref)
    setPreferenceState(pref)
    setThemeState(effective)
  }, [])

  const setTheme = useCallback(
    (mode: ThemeMode) => {
      setPreference(mode)
    },
    [setPreference],
  )

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next: ThemeMode = prev === 'dark' ? 'light' : 'dark'
      setThemePreference(next)
      setPreferenceState(next)
      return next
    })
  }, [])

  const value = useMemo(
    () => ({
      theme,
      preference,
      setPreference,
      setTheme,
      toggleTheme,
      isDark: theme === 'dark',
    }),
    [theme, preference, setPreference, setTheme, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return ctx
}
