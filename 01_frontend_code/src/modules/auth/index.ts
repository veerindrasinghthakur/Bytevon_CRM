export { AuthProvider, useAuth } from './context/AuthContext'
export { LoginPage } from './pages/LoginPage'
export { ForgotPasswordPage } from './pages/ForgotPasswordPage'
export { ResetPasswordPage } from './pages/ResetPasswordPage'
export { SessionExpiredPage } from './pages/SessionExpiredPage'
export { AccessDeniedPage } from './pages/AccessDeniedPage'
export { NotFoundPage } from './pages/NotFoundPage'

export { createAuthRoutes, authRoutes } from './routes'

export {
  loginApi,
  logoutApi,
  refreshApi,
  forgotPasswordApi,
  resetPasswordApi,
  changePasswordApi,
  loadStoredSession,
  persistSession,
} from './api/auth'

export type {
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput,
  AuthUser,
  AuthSession,
} from './types'
