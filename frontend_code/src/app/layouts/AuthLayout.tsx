import { Outlet } from '@tanstack/react-router'

/** Shell for unauthenticated pages (login, forgot/reset, session expired, 403/404). */
export function AuthLayout() {
  return (
    <div className="min-h-screen bg-background text-on-background">
      <Outlet />
    </div>
  )
}
