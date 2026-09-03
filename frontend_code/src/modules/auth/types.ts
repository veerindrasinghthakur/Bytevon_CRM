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
  MOCK_LOGIN_USERNAME,
  MOCK_LOGIN_PASSWORD,
  AUTH_COPYRIGHT_YEAR,
  AUTH_DEMO_RESET_TOKEN,
} from './schemas/auth'

export interface AxiosErrorResponse {
  response?: {
    status?: number
  }
}

