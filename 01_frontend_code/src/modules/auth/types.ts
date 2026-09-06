/**
 * Auth domain types — aligned with schemas.
 * Form inputs from auth-form; entities from auth; constants from enums.
 */

export type {
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput,
  AuthUser,
  AuthSession,
} from './schemas/auth'

export {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  MOCK_LOGIN_EMAIL,
  MOCK_LOGIN_PASSWORD,
  AUTH_COPYRIGHT_YEAR,
  AUTH_DEMO_RESET_TOKEN,
} from './schemas/auth'

export interface AxiosErrorResponse {
  response?: {
    status?: number
  }
}

import type { AuthSession } from './schemas/auth'

export interface UseAuthBootstrapResult {
  session: AuthSession | null
  isBootstrapping: boolean
  setSession: (session: AuthSession | null) => void
}

import {type ForgotPasswordInput , type LoginInput,
  type ResetPasswordInput} from './schemas/auth'
import { useForm } from 'react-hook-form'

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
  mockCredentials: { email: string; password: string }
}

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
