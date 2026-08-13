import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Enter a valid work email'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
})

export type LoginInput = z.infer<typeof loginSchema>

export const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid work email'),
})

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[A-Z]/, 'Include an uppercase letter')
      .regex(/[a-z]/, 'Include a lowercase letter')
      .regex(/[0-9]/, 'Include a number'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    password: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[A-Z]/, 'Include an uppercase letter')
      .regex(/[a-z]/, 'Include a lowercase letter')
      .regex(/[0-9]/, 'Include a number'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
    revokeAllSessions: z.boolean().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>

export interface AuthUser {
  id: number
  email: string
  name: string
  role: string
  department?: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface AuthSession {
  user: AuthUser
  tokens: AuthTokens
}
