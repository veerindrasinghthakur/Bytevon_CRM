import { useEffect, useState } from 'react'

/** Reactive matchMedia hook (SSR-safe: defaults to false until mounted). */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mql = window.matchMedia(query)
    setMatches(mql.matches)
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return matches
}

/** True below the md breakpoint — shell switches sidebars to overlay mode. */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)')
}
