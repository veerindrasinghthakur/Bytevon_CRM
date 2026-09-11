/**
 * Shared mutation helper for admin — always surfaces API errors via getApiErrorMessage.
 */
import {
  useMutation,
  type UseMutationOptions,
  type UseMutationResult,
} from '@tanstack/react-query'
import { getApiErrorMessage } from '@/shared/lib/api-error'

export type AdminMutationOptions<TData, TVariables, TContext = unknown> = Omit<
  UseMutationOptions<TData, unknown, TVariables, TContext>,
  'onError'
> & {
  /** Fallback when API body has no message */
  errorFallback?: string
  /** Receives the parsed user-facing message */
  onErrorMessage?: (message: string, err: unknown) => void
  onError?: (err: unknown) => void
}

export function useAdminMutation<
  TData = unknown,
  TVariables = void,
  TContext = unknown,
>(
  options: AdminMutationOptions<TData, TVariables, TContext>,
): UseMutationResult<TData, unknown, TVariables, TContext> {
  const { errorFallback, onErrorMessage, onError, ...rest } = options

  return useMutation({
    ...rest,
    onError: (err, variables, context) => {
      const msg = getApiErrorMessage(err, errorFallback ?? 'Action failed')
      onErrorMessage?.(msg, err)
      onError?.(err)
      // preserve any user-supplied onError from rest if they passed via mutationFn-only pattern
      void variables
      void context
    },
  })
}
