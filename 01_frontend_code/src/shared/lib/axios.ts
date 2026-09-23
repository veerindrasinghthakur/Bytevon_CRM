/**
 * Shared Axios client — used by module API files in real-API mode.
 * Auth token is attached via request interceptor from the stored session.
 *
 * 401 handling is loop-safe:
 * - Auth endpoints (/auth/login, /auth/refresh) never trigger a refresh —
 *   retrying the refresh call itself recursed without bound and crashed tabs.
 * - Refresh is single-flight (one shared promise for concurrent 401s).
 * - At most MAX_REFRESH_ATTEMPTS failed attempts, then the session is
 *   cleared and the SessionExpired page shows. Network/5xx never log out.
 */

import axios, {
  type AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { env } from '@/config/env'
import { loadStoredSession, persistSession, refreshApi } from '@/modules/auth/api/auth'
import type { AuthSession } from '@/modules/auth/schemas/auth'
import { notifySessionExpired } from '@/shared/lib/session-expiry'

const MAX_REFRESH_ATTEMPTS = 3

let refreshPromise: Promise<AuthSession> | null = null
let refreshAttempts = 0

function isAuthEndpoint(url: string | undefined): boolean {
  return !!url && /\/auth\/(refresh|login)/.test(url)
}

/** One failed auth cycle consumed. Clears the session at the cap. */
function consumeFailedAttempt(err: unknown): void {
  refreshAttempts += 1
  // Definitive 401 / SESSION_EXPIRED, or the attempt cap hit: expire the
  // session in-app so the user must log in again. Anything earlier keeps
  // the user logged in (network errors / backend-down must not log out).
  const status =
    typeof err === 'object' && err !== null && 'response' in err
      ? (err as { response?: { status?: number } }).response?.status
      : undefined
  const expiredSignal = err instanceof Error && err.message === 'SESSION_EXPIRED'
  if (status === 401 || expiredSignal || refreshAttempts >= MAX_REFRESH_ATTEMPTS) {
    refreshAttempts = 0
    persistSession(null)
    notifySessionExpired()
  } else {
    console.warn('Token refresh skipped/failed without expiry', err)
  }
}

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
  // X-Login-Id must be the backend login PK (NOT person id) — account
  // endpoints 403 when it doesn't match the token's login.
  const loginId = session?.user?.loginId ?? session?.user?.id
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
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined
    if (!original) return Promise.reject(error)
    // If we get a 401 and haven't retried yet, attempt token refresh.
    if (error.response?.status === 401 && !original._retry && !isAuthEndpoint(original.url)) {
      original._retry = true
      const session = loadStoredSession()
      const refreshToken = session?.tokens?.refreshToken
      if (!refreshToken) {
        refreshAttempts = 0
        persistSession(null)
        notifySessionExpired()
        return Promise.reject(error)
      }
      refreshPromise ??= refreshApi(refreshToken).finally(() => {
        refreshPromise = null
      })
      let newSession: AuthSession
      try {
        newSession = await refreshPromise
      } catch (refreshErr) {
        consumeFailedAttempt(refreshErr)
        throw refreshErr
      }
      if (original.headers) {
        ;(original.headers as Record<string, unknown>).Authorization =
          `Bearer ${newSession.tokens.accessToken}`
      }
      // Retry the original request. A second 401 means the cycle failed.
      try {
        const retried = await apiClient(original)
        refreshAttempts = 0
        return retried
      } catch (retryErr) {
        if (axios.isAxiosError(retryErr) && retryErr.response?.status === 401) {
          consumeFailedAttempt(retryErr)
        }
        throw retryErr
      }
    }
    return Promise.reject(error)
  },
)

export default apiClient
