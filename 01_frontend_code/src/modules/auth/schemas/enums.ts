/** Auth module constants / enum-like values (no domain status enums in V1). */

/** Temporary mock credentials (UI + API). */
export const MOCK_LOGIN_USERNAME = 'admin' as const
export const MOCK_LOGIN_PASSWORD = '123' as const

/** Footer copyright year — evaluated once at module load. */
export const AUTH_COPYRIGHT_YEAR = new Date().getFullYear()

/** Dev-only reset token accepted by reset flow without stored map entry. */
export const AUTH_DEMO_RESET_TOKEN = 'demo' as const
