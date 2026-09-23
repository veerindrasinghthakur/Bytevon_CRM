import { describe, expect, it } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { useRbac } from '@/shared/rbac'

/**
 * RBAC gating via the useRbac hook (what <Can> renders from).
 * NOTE: importing @/shared/rbac/Can directly in a test yields `undefined`
 * due to an app-level import cycle (Can → use-rbac → api → axios →
 * auth/api/auth → @/shared/rbac barrel → Can). The app boots in an order
 * where this resolves, but tests must enter through the barrel. Flagged
 * for a follow-up: break the cycle (e.g. move setCurrentEmploymentId
 * out of the barrel import in auth/api/auth.ts).
 */

function createWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
  return Wrapper
}

describe('useRbac gating', () => {
  it('denies everything for an employment with no grants', async () => {
    const { result } = renderHook(() => useRbac(-99999), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.isSuperAdmin).toBe(false)
    expect(result.current.can('DELETE', 'payroll')).toBe(false)
    expect(result.current.can('VIEW', 'leave_request')).toBe(false)
    expect(result.current.canDo({ resource: 'x', action: 'VIEW' })).toBe(false)
  })

  it('exposes permissions tree, scope and employment id', async () => {
    const { result } = renderHook(() => useRbac(-99999), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.employmentId).toBe(-99999)
    expect(result.current.scope).toBe('SELF')
    expect(result.current.permissions).toEqual({})
  })
})
