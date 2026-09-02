import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import {
  resetPasswordSchema,
  type ResetPasswordInput,
  AUTH_DEMO_RESET_TOKEN,
} from '../schemas/auth'
import { resetPasswordApi } from '../api/auth'
import { authRoutes } from '../routes'
import { safeNavigate } from '@/shared/lib/safeNavigate'

export interface UseResetPasswordFormReturn {
  register: ReturnType<typeof useForm<ResetPasswordInput>>['register']
  handleSubmit: ReturnType<typeof useForm<ResetPasswordInput>>['handleSubmit']
  formState: {
    errors: ReturnType<typeof useForm<ResetPasswordInput>>['formState']['errors']
    isSubmitting: boolean
  }
  serverError: string | null
  done: boolean
  showPassword: boolean
  toggleShowPassword: () => void
  onSubmit: (data: ResetPasswordInput) => Promise<void>
  goToLogin: () => void
}

export function useResetPasswordForm(): UseResetPasswordFormReturn {
  const navigate = useNavigate()
  const search = useSearch({ strict: false }) as { token?: string }
  const token = search.token ?? ''
  const [serverError, setServerError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  const mutation = useMutation({
    mutationFn: (data: ResetPasswordInput) => resetPasswordApi(token, data),
    onSuccess: () => {
      setServerError(null)
      setDone(true)
    },
    onError: (e) => {
      setServerError(e instanceof Error ? e.message : 'Reset failed.')
    },
  })

  const toggleShowPassword = useCallback(() => {
    setShowPassword((v) => !v)
  }, [])

  const onSubmit = useCallback(
    async (data: ResetPasswordInput) => {
      setServerError(null)
      if (!token) {
        setServerError('Missing reset token. Open the link from your email.')
        return
      }
      // Dev shortcut: demo token skips stored map
      if (token === AUTH_DEMO_RESET_TOKEN) {
        await new Promise((r) => setTimeout(r, 500))
        setDone(true)
        return
      }
      await mutation.mutateAsync(data)
    },
    [token, mutation],
  )

  const goToLogin = useCallback(() => {
    safeNavigate(navigate, { to: authRoutes.login })
  }, [navigate])

  return {
    register,
    handleSubmit,
    formState: { errors, isSubmitting: mutation.isPending },
    serverError,
    done,
    showPassword,
    toggleShowPassword,
    onSubmit,
    goToLogin,
  }
}
