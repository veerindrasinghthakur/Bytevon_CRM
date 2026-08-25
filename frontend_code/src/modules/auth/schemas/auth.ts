/** Auth entity types + mock credentials. Form schemas live in auth-form.ts. */

export { MOCK_LOGIN_USERNAME, MOCK_LOGIN_PASSWORD } from './auth-form'

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
}
