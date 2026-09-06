/**
 * Shared Axios client — used by module API files in real-API mode.
 * Auth token is attached via request interceptor from the stored session.
 */

import axios, {
  type AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { env } from '@/config/env'
import { loadStoredSession, persistSession, refreshApi } from '@/modules/auth/api/auth'

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 30_000,
})

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const session = loadStoredSession()
  const token = session?.tokens?.accessToken
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  // Add X-Login-Id header for logout and other auth endpoints
  const loginId = session?.user?.id
  if (loginId) {
    config.headers = config.headers ?? {}
    config.headers['X-Login-Id'] = String(loginId)
  }
  // Add X-Employment-Id header for employment-scoped endpoints
  const employmentId = session?.user?.employmentId
  if (employmentId) {
    config.headers = config.headers ?? {}
    config.headers['X-Employment-Id'] = String(employmentId)
  }
  return config
})

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    // If we get a 401 and haven't retried yet, attempt token refresh.
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const session = loadStoredSession()
        const refreshToken = session?.tokens?.refreshToken
        if (refreshToken) {
          const newSession = await refreshApi(refreshToken)
          // Update Authorization header with new access token.
          if (original.headers) {
            ;(original.headers as any).Authorization = `Bearer ${newSession.tokens.accessToken}`
          }
          // Retry the original request.
          return apiClient(original)
        }
      } catch (refreshErr) {
        // Only clear the session when refresh definitively failed with 401.
        // Network errors / backend-down must keep the user logged in.
        const status =
          typeof refreshErr === 'object' && refreshErr !== null && 'response' in refreshErr
            ? (refreshErr as { response?: { status?: number } }).response?.status
            : undefined
        if (status === 401) {
          persistSession(null)
          if (
            typeof window !== 'undefined' &&
            !window.location.pathname.startsWith('/login')
          ) {
            const redirect = encodeURIComponent(
              window.location.pathname + window.location.search,
            )
            window.location.assign(`/session-expired?redirect=${redirect}`)
          }
        }
        console.warn('Token refresh skipped/failed without expiry', refreshErr)
      }
    }
    return Promise.reject(error)
  },
)

export default apiClient
