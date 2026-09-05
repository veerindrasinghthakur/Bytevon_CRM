import { Link } from '@tanstack/react-router'
import { Button } from '@/shared/components/ui/Button'
import { looseLinkProps } from '@/shared/lib/safeNavigate'
import { authRoutes } from '../routes'

export function AccessDeniedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-md text-center space-y-6 bg-surface-container-lowest border border-outline-variant rounded-xl p-10 shadow-sm">
        <div className="mx-auto w-14 h-14 rounded-full bg-error/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-error text-3xl">block</span>
        </div>
        <h1 className="text-headline-md text-on-background">Access denied</h1>
        <p className="text-body-md text-on-surface-variant">
          You do not have permission to view this page. Contact an administrator if you believe this is
          an error.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link {...looseLinkProps({ to: authRoutes.dashboard })}>
            <Button variant="primary">Go to Dashboard</Button>
          </Link>
          <Link {...looseLinkProps({ to: authRoutes.login })}>
            <Button variant="outline">Sign in as another user</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
