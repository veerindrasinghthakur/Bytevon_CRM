import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/shared/lib/query-client'
import type { ReactNode } from 'react'

interface AppProvidersProps {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}