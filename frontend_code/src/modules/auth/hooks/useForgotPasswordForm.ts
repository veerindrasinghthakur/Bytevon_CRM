import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from '@tanstack/react-router'
import { forgotPasswordSchema, type ForgotPasswordInput } from '../schemas/auth'
import { forgotPasswordApi } from '../api/auth'
import { authRoutes } from '../routes'
import { handleEnterAdvance } from '@/shared/lib/enter-advance'

export interface UseForgotPasswordFormReturn {
  register: ReturnType<typeof useForm<ForgotPasswordInput>>['register']
  handleSubmit: ReturnType<typeof useForm<ForgotPasswordInput>>['handleSubmit']
  formState: {
    errors: ReturnType<typeof useForm<ForgotPasswordInput>>['formState']['errors']
    isSubmitting: boolean
  }
  reset: ReturnType<typeof useForm<ForgotPasswordInput>>['reset']
  sentTo: string | null
  serverError: string | null
  onSubmit: (data: ForgotPasswordInput) => Promise<void>
  resetForm: () => void
}

export function useForgotPasswordForm(): UseForgotPasswordFormReturn {
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = useCallback(
    async (data: ForgotPasswordInput) => {
      setServerError(null)
      try {
        await forgotPasswordApi(data)
        setSentTo(data.email)
      } catch (e) {
        setServerError(e instanceof Error ? e.message : 'Request failed.')
      }
    },
    []
  )

  const resetForm = useCallback(() => {
    setSentTo(null)
    setServerError(null)
    reset()
  }, [reset])

  return {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    sentTo,
    serverError,
    onSubmit,
    resetForm,
  }
}