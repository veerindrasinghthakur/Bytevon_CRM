import { Link } from '@tanstack/react-router'
import { Button } from '@/shared/components/ui/Button'
import { authRoutes } from '../routes'

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-md text-center space-y-6 bg-surface-container-lowest border border-outline-variant rounded-xl p-10 shadow-sm">
        <p className="text-[48px] font-bold text-primary leading-none">404</p>
        <h1 className="text-headline-md text-on-background">Page not found</h1>
        <p className="text-body-md text-on-surface-variant">
          The page you requested does not exist or may have been moved.
        </p>
        <Link to={authRoutes.dashboard as never} params={{} as never} search={{} as never}>
          <Button variant="primary">Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  )
}
