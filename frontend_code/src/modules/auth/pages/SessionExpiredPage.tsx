import { Link } from '@tanstack/react-router'
import { Button } from '@/shared/components/ui/Button'
import { authRoutes } from '../routes'

export function SessionExpiredPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-md text-center space-y-6 bg-surface-container-lowest border border-outline-variant rounded-xl p-10 shadow-sm">
        <div className="mx-auto w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center">
          <span className="material-symbols-outlined text-amber-700 text-3xl">schedule</span>
        </div>
        <h1 className="text-headline-md text-on-background">Session expired</h1>
        <p className="text-body-md text-on-surface-variant">
          For your security, you were signed out after a period of inactivity. Please sign in again to
          continue.
        </p>
        <Link to={authRoutes.login}>
          <Button variant="primary" className="w-full">
            Back to Login
          </Button>
        </Link>
      </div>
    </div>
  )
}
