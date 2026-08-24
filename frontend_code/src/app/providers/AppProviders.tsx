import type { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { Provider } from 'react-redux'
import { queryClient } from '@/shared/lib/query-client'
import { AuthProvider } from '@/modules/auth'
import { ThemeProvider } from '@/shared/theme/ThemeProvider'
import store from '@/shared/store'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  )
}
