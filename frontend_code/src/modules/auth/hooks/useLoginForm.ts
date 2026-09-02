import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useSearch } from '@tanstack/react-router'
import {
  loginSchema,
  type LoginInput,
  MOCK_LOGIN_PASSWORD,
  MOCK_LOGIN_USERNAME,
} from '../schemas/auth'
import { authRoutes } from '../routes'
import { useAuth } from '../context/AuthContext'
import { safeNavigate } from '@/shared/lib/safeNavigate'

export interface UseLoginFormReturn {
  register: ReturnType<typeof useForm<LoginInput>>['register']
  handleSubmit: ReturnType<typeof useForm<LoginInput>>['handleSubmit']
  formState: {
    errors: ReturnType<typeof useForm<LoginInput>>['formState']['errors']
    isSubmitting: boolean
  }
  serverError: string | null
  showPassword: boolean
  toggleShowPassword: () => void
  onSubmit: (data: LoginInput) => Promise<void>
  mockCredentials: { username: string; password: string }
}

function resolvePostLoginPath(redirect: string | undefined): string {
  if (
    redirect &&
    redirect.startsWith('/') &&
    !redirect.startsWith(authRoutes.login) &&
    !redirect.startsWith('/profile')
  ) {
    return redirect
  }
  return authRoutes.dashboard
}

export function useLoginForm(): UseLoginFormReturn {
  const { login } = useAuth()
  const navigate = useNavigate()
  const search = useSearch({ strict: false }) as { redirect?: string }
  const [serverError, setServerError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '', rememberMe: false },
  })

  const toggleShowPassword = useCallback(() => {
    setShowPassword((v) => !v)
  }, [])

  const onSubmit = useCallback(
    async (data: LoginInput) => {
      setServerError(null)
      try {
        await login(data)
        safeNavigate(navigate, { to: resolvePostLoginPath(search.redirect) })
      } catch (e) {
        setServerError(e instanceof Error ? e.message : 'Login failed. Please try again.')
      }
    },
    [login, navigate, search.redirect],
  )

  return {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    serverError,
    showPassword,
    toggleShowPassword,
    onSubmit,
    mockCredentials: { username: MOCK_LOGIN_USERNAME, password: MOCK_LOGIN_PASSWORD },
  }
}
