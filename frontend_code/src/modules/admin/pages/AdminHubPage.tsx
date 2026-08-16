import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { adminKpis } from '../data/mock'
import { cn } from '@/shared/lib/cn'

const tiles = [
  {
    id: 'users',
    title: 'User Management',
    description: 'Provision accounts, lock sessions, and assign roles.',
    icon: 'manage_accounts',
    to: '/admin/users',
    stat: `${adminKpis.users} users`,
  },
  {
    id: 'roles',
    title: 'Roles & Permissions',
    description: 'Define RBAC roles and permission scopes.',
    icon: 'qr_code_2',
    to: '/admin/roles',
    stat: `${adminKpis.roles} roles`,
  },
  {
    id: 'settings',
    title: 'Organization Settings',
    description: 'Profile, offices, branding, attendance & leave policies.',
    icon: 'settings',
    to: '/admin/settings',
    stat: 'Config hub',
  },
  {
    id: 'audit',
    title: 'Audit Logs',
    description: 'Immutable trail of significant administrative actions.',
    icon: 'receipt_long',
    to: '/admin/audit',
    stat: `${adminKpis.auditEventsToday} today`,
  },
  {
    id: 'security',
    title: 'Security Center',
    description: 'Sessions, lockouts, and password policy overview.',
    icon: 'security',
    to: '/admin/security',
    stat: `${adminKpis.activeSessions} sessions`,
  },
]

export function AdminHubPage() {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administration Hub"
        description="Unified configuration for identity, workforce policy, and system governance."
        actions={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<span className="material-symbols-outlined text-[18px]">save</span>}
          >
            Save Changes
          </Button>
        }
      />

      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Kpi label="Users" value={adminKpis.users.toLocaleString()} />
        <Kpi label="Roles" value={String(adminKpis.roles)} />
        <Kpi label="Active Sessions" value={String(adminKpis.activeSessions)} />
        <Kpi label="Audit Today" value={String(adminKpis.auditEventsToday)} />
        <Kpi
          label="Health"
          value={
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {adminKpis.configHealth}
            </span>
          }
        />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {tiles.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => navigate({ to: t.to })}
            className={cn(
              'text-left p-6 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm',
              'hover:border-secondary/40 hover:bg-surface-container-low'
            )}
          >
            <div className="flex items-start justify-between mb-4">
              <span className="material-symbols-outlined p-2 rounded-lg bg-secondary/10 text-secondary text-2xl">
                {t.icon}
              </span>
              <span className="text-label-sm text-on-surface-variant">{t.stat}</span>
            </div>
            <h3 className="text-title-lg font-semibold text-on-background mb-1">{t.title}</h3>
            <p className="text-body-sm text-on-surface-variant">{t.description}</p>
          </button>
        ))}
      </section>
    </div>
  )
}

function Kpi({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="p-4 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm">
      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">{label}</p>
      <div className="text-xl font-bold text-on-background">{value}</div>
    </div>
  )
}
