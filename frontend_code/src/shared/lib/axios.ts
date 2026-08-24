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
        // Refresh failed – fall through to logout handling.
        console.warn('Token refresh failed', refreshErr)
      }
      // If refresh didn't work, clear session and redirect.
      persistSession(null)
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        const redirect = encodeURIComponent(window.location.pathname + window.location.search)
        window.location.assign(`/session-expired?redirect=${redirect}`)
      }
    }
    return Promise.reject(error)
  },
)

export default apiClient
