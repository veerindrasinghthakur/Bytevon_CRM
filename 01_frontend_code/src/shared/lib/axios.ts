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
import { loadStoredSession, refreshApi } from '@/modules/auth/api/auth'
import { notifySessionExpired } from '@/shared/lib/session-expiry'

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
        // Refresh definitively failed (401) or signalled SESSION_EXPIRED:
        // expire the session in-app so the user must log in again.
        // Network errors / backend-down must keep the user logged in.
        const status =
          typeof refreshErr === 'object' && refreshErr !== null && 'response' in refreshErr
            ? (refreshErr as { response?: { status?: number } }).response?.status
            : undefined
        const expiredSignal =
          refreshErr instanceof Error && refreshErr.message === 'SESSION_EXPIRED'
        if (status === 401 || expiredSignal) {
          notifySessionExpired()
        } else {
          console.warn('Token refresh skipped/failed without expiry', refreshErr)
        }
      }
    }
    return Promise.reject(error)
  },
)

export default apiClient
