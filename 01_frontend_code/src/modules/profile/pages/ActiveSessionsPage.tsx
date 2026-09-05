import { BackButton } from '@/shared/components/layout/BackButton'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { SessionStatus } from '@/shared/schema'
import { cn } from '@/shared/lib/cn'
import {
  useMySessions,
  useRevokeAllOtherSessions,
  useRevokeSession,
} from '../hooks/use-profile'
import { sessionStatusClass } from '../schemas/enums'
import { profileRoutes } from '../routes'

export function ActiveSessionsPage() {
  const { data: sessions = [], isLoading, isError, refetch } = useMySessions()
  const revokeMut = useRevokeSession()
  const revokeAllMut = useRevokeAllOtherSessions()

  if (isLoading) return <PageLoadingSkeleton />
  if (isError) {
    return (
      <div className="space-y-4">
        <BackButton to={profileRoutes.root} label="Back to profile" />
        <div className="rounded-lg border border-error/30 bg-error/5 p-6 text-center">
          <p className="text-body-md text-error mb-3">Failed to load sessions.</p>
          <Button variant="outline" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <BackButton to={profileRoutes.root} label="Back to profile" />
      <PageHeader
        title="Active sessions"
        description="Manage signed-in devices. Revoking ends refresh tokens for that session. Sessions are stored server-side."
        actions={
          <Button
            variant="outline"
            isLoading={revokeAllMut.isPending}
            onClick={() => revokeAllMut.mutate()}
          >
            Revoke all others
          </Button>
        }
      />
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-container-low border-b border-outline-variant">
              {['Device', 'IP', 'Last used', 'Status', ''].map((h) => (
                <th key={h || 'a'} className="px-5 py-3 text-label-sm uppercase text-on-surface-variant">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id} className="border-b border-outline-variant last:border-0 bv-row-hover">
                <td className="px-5 py-3">
                  <p className="font-medium">{s.device_name}</p>
                  <p className="text-label-sm text-on-surface-variant">{s.device_type}</p>
                </td>
                <td className="px-5 py-3 text-body-sm font-mono">{s.ip_address}</td>
                <td className="px-5 py-3 text-body-sm">{s.last_used_at}</td>
                <td className="px-5 py-3">
                  <span
                    className={cn(
                      'px-2.5 py-0.5 rounded-full text-[10px] font-bold',
                      sessionStatusClass(s.status, s.status === SessionStatus.ACTIVE),
                    )}
                  >
                    {s.status}
                    {s.current ? ' · THIS DEVICE' : ''}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  {s.status === SessionStatus.ACTIVE && !s.current && (
                    <button
                      type="button"
                      className="text-sm font-medium text-error hover:underline cursor-pointer disabled:opacity-50"
                      disabled={revokeMut.isPending}
                      onClick={() => revokeMut.mutate(s.id)}
                    >
                      Revoke
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
