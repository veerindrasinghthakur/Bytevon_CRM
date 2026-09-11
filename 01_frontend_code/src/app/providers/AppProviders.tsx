import type { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { Provider } from 'react-redux'
import { queryClient } from '@/shared/lib/query-client'
import { AuthProvider } from '@/modules/auth'
import { ThemeProvider } from '@/shared/theme/ThemeProvider'
import { ToastHost } from '@/shared/components/feedback/ToastHost'
import store from '@/shared/store'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <ToastHost />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  )
}
