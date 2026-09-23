import { describe, expect, it } from 'vitest'
import axios from 'axios'
import { getApiErrorMessage, parseApiError } from '@/shared/lib/api-error'

function axErr(status: number | undefined, data: unknown, message = 'Request failed with status code 401') {
  return new axios.AxiosError(message, String(status), undefined, undefined, {
    status: status as number,
    statusText: '',
    headers: {},
    config: {} as never,
    data,
  } as never)
}

describe('parseApiError', () => {
  it('parses the backend {error:{code,message,details}} envelope', () => {
    const p = parseApiError(
      axErr(400, { error: { code: 'domain_error', message: 'No working days', details: { x: 1 } } }),
    )
    expect(p).toMatchObject({ message: 'No working days', code: 'domain_error', status: 400, details: { x: 1 } })
  })

  it('parses legacy {detail:string} and tags 422 validation', () => {
    expect(parseApiError(axErr(422, { detail: 'Field required' })).code).toBe('validation_error')
    expect(parseApiError(axErr(404, { detail: 'Legacy gone' })).message).toBe('Legacy gone')
  })

  it('parses legacy {detail:[{msg}]} validation arrays', () => {
    const p = parseApiError(axErr(422, { detail: [{ msg: 'Name too short', loc: ['body'], type: 'x' }] }))
    expect(p).toMatchObject({ message: 'Name too short', code: 'validation_error', status: 422 })
  })

  it('parses {message} shape and plain-string bodies', () => {
    expect(parseApiError(axErr(500, { message: 'Boom' })).message).toBe('Boom')
    expect(parseApiError(axErr(500, '  raw  ')).message).toBe('raw')
  })

  it('falls back by status when the body is empty', () => {
    expect(parseApiError(axErr(401, {})).code).toBe('unauthorized')
    expect(parseApiError(axErr(403, null)).code).toBe('forbidden')
    expect(parseApiError(axErr(404, undefined)).code).toBe('not_found')
    expect(parseApiError(axErr(409, {})).code).toBe('conflict')
    expect(parseApiError(axErr(422, {})).code).toBe('validation_error')
    expect(parseApiError(axErr(503, {})).code).toBe('internal_error')
  })

  it('handles plain Errors and unknown values with fallback', () => {
    expect(parseApiError(new Error('kaput')).message).toBe('kaput')
    expect(parseApiError(null, 'FB').message).toBe('FB')
    expect(getApiErrorMessage(axErr(409, { error: { code: 'conflict', message: 'Dup' } }))).toBe('Dup')
  })
})
