import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { adminUsers, adminKpis } from '../data/mock'
import { cn } from '@/shared/lib/cn'

const statusStyles: Record<string, string> = {
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Inactive: 'bg-surface-container text-on-surface-variant border-outline-variant',
  Locked: 'bg-red-50 text-red-700 border-red-200',
}

export function UsersListPage() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return adminUsers
    return adminUsers.filter(
      (u) =>
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.role.toLowerCase().includes(term)
    )
  }, [q])

  const locked = adminUsers.filter((u) => u.status === 'Locked').length

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Control access, roles, and security protocols for the enterprise directory."
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<span className="material-symbols-outlined text-[18px]">download</span>}
            >
              Export User List
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<span className="material-symbols-outlined text-[18px]">person_add</span>}
              onClick={() => navigate({ to: '/admin/users/new' })}
            >
              Add New User
            </Button>
          </div>
        }
      />

      {/* Hub KPIs moved here + user metrics */}
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

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Metric
          icon="group"
          iconClass="bg-secondary text-on-secondary"
          label="Total Users"
          value={adminKpis.users.toLocaleString()}
          hint="+12%"
        />
        <Metric
          icon="bolt"
          iconClass="bg-secondary/15 text-secondary"
          label="Active Now"
          value="156"
          hint="Live sessions"
        />
        <Metric
          icon="mail"
          iconClass="bg-surface-container text-on-surface-variant"
          label="Pending Invites"
          value="12"
          hint="Avg. wait 4.2h"
        />
        <Metric
          icon="lock_person"
          iconClass="bg-red-50 text-red-600"
          label="Locked Accounts"
          value={String(locked)}
          hint="Action required"
          valueClass="text-error"
        />
      </section>

      <section className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-outline-variant flex flex-wrap gap-3 items-center bg-surface-container-low/40">
          <div className="relative flex-1 min-w-[200px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
              search
            </span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter by name, email, or role..."
              className="w-full pl-10 pr-3 py-2 border border-outline-variant rounded-lg text-body-sm bg-transparent outline-none focus:ring-2 focus:ring-secondary/30"
            />
          </div>
          <Button variant="outline" size="sm" leftIcon={<span className="material-symbols-outlined text-[18px]">tune</span>}>
            Filters
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[880px]">
            <thead>
              <tr className="bg-surface-container-low">
                <th className="px-6 py-3 text-label-md text-on-surface-variant uppercase tracking-wider">
                  User Identity
                </th>
                <th className="px-6 py-3 text-label-md text-on-surface-variant uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-label-md text-on-surface-variant uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-label-md text-on-surface-variant uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-label-md text-on-surface-variant uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-label-md text-on-surface-variant uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {visible.map((u) => (
                <tr key={u.id} className="hover:bg-surface-container-low/50 transition-colors">
                  <td
                    className="px-6 py-4 cursor-pointer"
                    onClick={() => navigate({ to: '/admin/users/$userId', params: { userId: u.id } })}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-secondary/15 text-secondary flex items-center justify-center text-label-sm font-bold">
                        {u.initials}
                      </div>
                      <div>
                        <p className="text-label-md font-semibold text-on-background">{u.name}</p>
                        <p className="text-body-sm text-on-surface-variant">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-body-sm">{u.role}</td>
                  <td className="px-6 py-4 text-body-sm text-on-surface-variant">{u.department}</td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        'px-3 py-1 rounded-full text-label-sm font-medium border',
                        statusStyles[u.status]
                      )}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-body-sm text-on-surface-variant">{u.lastLogin}</td>
                  <td className="px-6 py-4 text-right space-x-1">
                    <button
                      type="button"
                      className="p-2 hover:bg-surface-container rounded-lg text-on-surface-variant hover:text-secondary"
                      title="View"
                      onClick={() => navigate({ to: '/admin/users/$userId', params: { userId: u.id } })}
                    >
                      <span className="material-symbols-outlined text-xl">visibility</span>
                    </button>
                    <button
                      type="button"
                      className="p-2 hover:bg-surface-container rounded-lg text-on-surface-variant hover:text-secondary"
                      title="Edit"
                      onClick={() => navigate({ to: '/admin/users/$userId', params: { userId: u.id } })}
                    >
                      <span className="material-symbols-outlined text-xl">edit</span>
                    </button>
                    <button
                      type="button"
                      className="p-2 hover:bg-error/10 rounded-lg text-error"
                      title="Deactivate"
                    >
                      <span className="material-symbols-outlined text-xl">person_off</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

function Metric({
  icon,
  iconClass,
  label,
  value,
  hint,
  valueClass,
}: {
  icon: string
  iconClass: string
  label: string
  value: string
  hint: string
  valueClass?: string
}) {
  return (
    <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className={cn('p-2 rounded-lg', iconClass)}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <span className="text-xs font-bold text-on-surface-variant">{hint}</span>
      </div>
      <p className="text-label-md text-on-surface-variant uppercase tracking-widest">{label}</p>
      <h3 className={cn('text-3xl font-black text-on-surface mt-1', valueClass)}>{value}</h3>
    </div>
  )
}
