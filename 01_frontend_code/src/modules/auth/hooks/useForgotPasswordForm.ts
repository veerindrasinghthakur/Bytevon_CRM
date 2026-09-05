import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { forgotPasswordSchema, type ForgotPasswordInput } from '../schemas/auth'
import { forgotPasswordApi } from '../api/auth'
import {UseForgotPasswordFormReturn} from '../types'

export function useForgotPasswordForm(): UseForgotPasswordFormReturn {
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const mutation = useMutation({
    mutationFn: forgotPasswordApi,
    onSuccess: (_data, variables) => {
      setServerError(null)
      setSentTo(variables.email)
    },
    onError: (e) => {
      setServerError(e instanceof Error ? e.message : 'Request failed.')
    },
  })

  const onSubmit = useCallback(
    async (data: ForgotPasswordInput) => {
      setServerError(null)
      await mutation.mutateAsync(data)
    },
    [mutation],
  )

  const resetForm = useCallback(() => {
    setSentTo(null)
    setServerError(null)
    reset()
  }, [reset])

  return {
    register,
    handleSubmit,
    formState: { errors, isSubmitting: mutation.isPending },
    reset,
    sentTo,
    serverError,
    onSubmit,
    resetForm,
  }
}
