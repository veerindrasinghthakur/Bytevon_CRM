/**
 * Parse backend error bodies into a user-facing message.
 *
 * Backend handlers (app/core/exceptions/handlers.py) return:
 *   { error: { code, message, details? } }
 *
 * Also supports legacy FastAPI shapes:
 *   { detail: string | ValidationError[] }
 *   { message: string }
 */

import axios from 'axios'

export type ApiErrorBody = {
  error?: {
    code?: string
    message?: string
    details?: unknown
  }
  detail?: string | Array<{ msg?: string; loc?: unknown; type?: string }>
  message?: string
}

export type ParsedApiError = {
  message: string
  code: string | null
  status: number | null
  details: unknown
}

function firstValidationMsg(
  detail: Array<{ msg?: string }>,
): string | null {
  const msg = detail[0]?.msg
  return msg && String(msg).trim() ? String(msg) : null
}

/**
 * Extract a human-readable message from any thrown API/network error.
 * Prefer this in mutation onError, form setError, and banners.
 */
export function getApiErrorMessage(
  err: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  return parseApiError(err, fallback).message
}

/** Full parse: message + machine code + HTTP status. */
export function parseApiError(
  err: unknown,
  fallback = 'Something went wrong. Please try again.',
): ParsedApiError {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status ?? null
    const data = err.response?.data as ApiErrorBody | string | undefined

    if (typeof data === 'string' && data.trim()) {
      return { message: data.trim(), code: null, status, details: null }
    }

    if (data && typeof data === 'object') {
      // Primary: AppException / SecurityException / validation handler envelope
      const nested = data.error
      if (nested && typeof nested === 'object') {
        const msg =
          typeof nested.message === 'string' && nested.message.trim()
            ? nested.message.trim()
            : null
        if (msg) {
          return {
            message: msg,
            code: typeof nested.code === 'string' ? nested.code : null,
            status,
            details: nested.details ?? null,
          }
        }
      }

      // FastAPI default / older shapes
      if (typeof data.detail === 'string' && data.detail.trim()) {
        return {
          message: data.detail.trim(),
          code: status === 422 ? 'validation_error' : null,
          status,
          details: null,
        }
      }
      if (Array.isArray(data.detail)) {
        const msg = firstValidationMsg(data.detail)
        if (msg) {
          return {
            message: msg,
            code: 'validation_error',
            status,
            details: data.detail,
          }
        }
      }
      if (typeof data.message === 'string' && data.message.trim()) {
        return {
          message: data.message.trim(),
          code: null,
          status,
          details: null,
        }
      }
    }

    // Sensible status fallbacks when body is empty
    if (status === 401) {
      return {
        message: 'Session expired or invalid credentials',
        code: 'unauthorized',
        status,
        details: null,
      }
    }
    if (status === 403) {
      return {
        message: 'You do not have permission for this action',
        code: 'forbidden',
        status,
        details: null,
      }
    }
    if (status === 404) {
      return {
        message: 'Resource not found',
        code: 'not_found',
        status,
        details: null,
      }
    }
    if (status === 409) {
      return {
        message: 'Conflict — this record already exists or cannot be changed',
        code: 'conflict',
        status,
        details: null,
      }
    }
    if (status === 422) {
      return {
        message: 'Please check the form and try again',
        code: 'validation_error',
        status,
        details: null,
      }
    }
    if (status && status >= 500) {
      return {
        message: 'Server error. Please try again later.',
        code: 'internal_error',
        status,
        details: null,
      }
    }

    if (err.message && !err.message.startsWith('Request failed')) {
      return { message: err.message, code: null, status, details: null }
    }
  }

  if (err instanceof Error && err.message) {
    return { message: err.message, code: null, status: null, details: null }
  }

  return { message: fallback, code: null, status: null, details: null }
}

/** @deprecated Use getApiErrorMessage from @/shared/lib/api-error */
export function extractApiErrorMessage(
  err: unknown,
  fallback = 'Request failed',
): string {
  return getApiErrorMessage(err, fallback)
}
