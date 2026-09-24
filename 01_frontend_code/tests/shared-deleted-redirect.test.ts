import { describe, expect, it } from 'vitest'
import axios from 'axios'
import { isNotFoundError } from '@/shared/hooks/useDeletedRedirect'

function axErr(status: number) {
  return new axios.AxiosError('x', String(status), undefined, undefined, {
    status,
    statusText: '',
    headers: {},
    config: {} as never,
    data: {},
  } as never)
}

describe('isNotFoundError', () => {
  it('matches only HTTP 404 responses', () => {
    expect(isNotFoundError(axErr(404))).toBe(true)
    expect(isNotFoundError(axErr(403))).toBe(false)
    expect(isNotFoundError(axErr(500))).toBe(false)
    expect(isNotFoundError(new Error('boom'))).toBe(false)
    expect(isNotFoundError(null)).toBe(false)
    expect(isNotFoundError({})).toBe(false)
  })
})
