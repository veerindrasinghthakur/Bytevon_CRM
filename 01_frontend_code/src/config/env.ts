/**
 * Centralized frontend environment configuration.
 * Mock vs real API is controlled by VITE_USE_MOCK_API (default true).
 */

function readBool(value: string | undefined, defaultValue: boolean): boolean {
  if (value == null || value === '') return defaultValue
  return value === 'true' || value === '1'
}

export const env = {
  useMockApi: readBool(import.meta.env.VITE_USE_MOCK_API, true),
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
} as const
