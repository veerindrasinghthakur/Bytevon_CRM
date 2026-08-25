/** Auth domain types — re-export schemas */

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
} from './schemas/auth'
