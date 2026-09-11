/**
 * Shared mutation helper for admin — always surfaces API errors via getApiErrorMessage.
 */
import {
  useMutation,
  type UseMutationOptions,
  type UseMutationResult,
} from '@tanstack/react-query'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { toast } from '@/shared/hooks/use-toast'

export type AdminMutationOptions<TData, TVariables, TContext = unknown> = Omit<
  UseMutationOptions<TData, unknown, TVariables, TContext>,
  'onError'
> & {
  /** Fallback when API body has no message */
  errorFallback?: string
  /** Receives the parsed user-facing message */
  onErrorMessage?: (message: string, err: unknown) => void
  onError?: (err: unknown) => void
  /** Show global toast on error (default true) */
  toastOnError?: boolean
}

export function useAdminMutation<
  TData = unknown,
  TVariables = void,
  TContext = unknown,
>(
  options: AdminMutationOptions<TData, TVariables, TContext>,
): UseMutationResult<TData, unknown, TVariables, TContext> {
  const {
    errorFallback,
    onErrorMessage,
    onError,
    toastOnError = true,
    ...rest
  } = options

  return useMutation({
    ...rest,
    onError: (err, _variables, _context) => {
      const msg = getApiErrorMessage(err, errorFallback ?? 'Action failed')
      onErrorMessage?.(msg, err)
      if (toastOnError) toast.error(msg)
      onError?.(err)
    },
  })
}
