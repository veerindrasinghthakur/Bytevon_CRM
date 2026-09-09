/** Auth entity types + form schema re-exports. Constants live in enums.ts. */

export {
  MOCK_LOGIN_EMAIL,
  MOCK_LOGIN_PASSWORD,
  AUTH_COPYRIGHT_YEAR,
  AUTH_DEMO_RESET_TOKEN,
} from './enums'

export {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  type LoginInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
  type ChangePasswordInput,
} from './auth-form'

export interface AuthUser {
  id: number
  username: string
  email: string
  name: string
  role: string
  department: string
  /** Schema employment PK for RBAC + My Work */
  employmentId: number
  personId: number
}

export interface AuthSession {
  user: AuthUser
  tokens: {
    accessToken: string
    refreshToken: string
    expiresIn: number
  }
  rememberMe?: boolean
}
