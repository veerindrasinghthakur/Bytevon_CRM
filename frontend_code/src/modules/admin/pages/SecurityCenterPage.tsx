import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { adminKpis } from '../data/mock'

export function SecurityCenterPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Security Center"
        description="Sessions, lockouts, and authentication policy overview (V1)."
        actions={
          <Button variant="outline" size="sm">
            Refresh
          </Button>
        }
      />

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm">
          <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Active Sessions</p>
          <p className="text-3xl font-bold text-on-background">{adminKpis.activeSessions}</p>
        </div>
        <div className="p-6 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm">
          <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Locked Accounts</p>
          <p className="text-3xl font-bold text-on-background">1</p>
        </div>
        <div className="p-6 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm">
          <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">MFA</p>
          <p className="text-title-lg font-semibold text-on-background">Not in V1</p>
        </div>
      </section>

      <section className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-6 space-y-4">
        <h3 className="text-title-lg font-semibold text-on-background">Password &amp; Session Policy</h3>
        <ul className="space-y-2 text-body-md text-on-surface-variant">
          <li className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[18px]">check</span>
            Access JWT lifetime: 5–10 minutes (not stored)
          </li>
          <li className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[18px]">check</span>
            Refresh tokens hashed on sessions; revoke-all supported
          </li>
          <li className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[18px]">check</span>
            Account lockout via failed_attempt_count + locked_until
          </li>
          <li className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[18px]">check</span>
            Always ≥1 super-admin; last super-admin cannot be removed
          </li>
          <li className="flex items-center gap-2">
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">remove</span>
            Password history and MFA not in V1
          </li>
        </ul>
      </section>
    </div>
  )
}
