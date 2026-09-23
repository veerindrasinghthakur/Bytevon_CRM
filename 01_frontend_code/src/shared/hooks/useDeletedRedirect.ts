import { useEffect, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { safeNavigate } from '@/shared/lib/safeNavigate'

/**
 * Redirect to an entity list when its detail is definitively gone.
 *
 * Fires only when loading finished AND (data is null OR the query failed
 * with HTTP 404). Network errors / 5xx keep the inline error UI — mirroring
 * the offline-safe refresh pattern (never strand users on failures).
 */
export function isNotFoundError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'response' in err &&
    (err as { response?: { status?: number } }).response?.status === 404
  )
}

export function useDeletedRedirect(opts: {
  ready: boolean
  data: unknown
  error: unknown
  listTo: string
}): void {
  const navigate = useNavigate()
  const fired = useRef(false)
  const { ready, data, error, listTo } = opts
  useEffect(() => {
    if (!ready || fired.current) return
    if (data == null || isNotFoundError(error)) {
      fired.current = true
      safeNavigate(navigate, { to: listTo, replace: true })
    }
  }, [ready, data, error, listTo, navigate])
}
