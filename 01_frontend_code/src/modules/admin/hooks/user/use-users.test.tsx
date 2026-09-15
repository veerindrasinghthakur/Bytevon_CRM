import { describe, expect, it } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { useUsersList } from './use-users'

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}

describe('useUsersList', () => {
  it('loads users and exposes filter/selection controls', async () => {
    const { result } = renderHook(() => useUsersList(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.totalCount).toBe(result.current.items.length)
    expect(typeof result.current.setSearch).toBe('function')
    expect(result.current.selectionMode).toBe(false)
  })

  it('narrows results by search', async () => {
    const { result } = renderHook(() => useUsersList(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    if (!result.current.items.length) return
    const first = result.current.items[0]
    result.current.setSearch(first.name.slice(0, 4))

    await waitFor(() =>
      expect(
        result.current.filtered.every((u) =>
          `${u.name} ${u.email} ${u.role} ${u.employeeCode}`
            .toLowerCase()
            .includes(first.name.slice(0, 4).toLowerCase()),
        ),
      ).toBe(true),
    )
  })

  it('filters by status', async () => {
    const { result } = renderHook(() => useUsersList(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    result.current.setStatusFilter('Locked')
    await waitFor(() =>
      expect(result.current.filtered.every((u) => u.status === 'Locked')).toBe(true),
    )
  })
})

