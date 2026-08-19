import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { listAdminUsers, type AdminUserListItem } from '../api/users'
import { cn } from '@/shared/lib/cn'

const statusStyles: Record<string, string> = {
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Inactive: 'bg-surface-container text-on-surface-variant border-outline-variant',
  Locked: 'bg-red-50 text-red-700 border-red-200',
}

export function UsersListPage() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [items, setItems] = useState<AdminUserListItem[]>([])
  const [locked, setLocked] = useState(0)
  const [active, setActive] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const res = await listAdminUsers()
      if (cancelled) return
      setItems(res.items)
      setLocked(res.locked)
      setActive(res.active)
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return items
    return items.filter(
      (u) =>
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.role.toLowerCase().includes(term) ||
        u.employeeCode.toLowerCase().includes(term),
    )
  }, [q, items])

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="User Management"
        description="Login accounts linked to employments. Add user only for employees without credentials."
        actions={
          <div className="flex gap-2">
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

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Metric icon="group" label="Total Users" value={String(items.length)} hint="From mock DB" />
        <Metric icon="bolt" label="Active" value={String(active)} hint="ACTIVE status" />
        <Metric icon="lock_person" label="Locked" value={String(locked)} hint="Action required" valueClass="text-error" />
        <Metric icon="person_off" label="Shown" value={String(visible.length)} hint="After filter" />
      </section>

      <section className="bv-surface overflow-hidden">
        <div className="p-4 border-b border-outline-variant flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
              search
            </span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter by name, email, role, or code..."
              className="w-full pl-10 pr-3 py-2 border border-outline-variant rounded-lg text-body-sm bg-transparent outline-none focus:ring-2 focus:ring-secondary/30 transition-colors"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-on-surface-variant">Loading users…</div>
        ) : (
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
                  <tr key={u.id} className="zebra-row">
                    <td
                      className="px-6 py-4 cursor-pointer"
                      onClick={() =>
                        navigate({ to: '/admin/users/$userId', params: { userId: String(u.id) } })
                      }
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-secondary/15 text-secondary flex items-center justify-center text-label-sm font-bold">
                          {u.initials}
                        </div>
                        <div>
                          <p className="text-label-md font-semibold text-on-background">{u.name}</p>
                          <p className="text-body-sm text-on-surface-variant">
                            {u.email} · {u.employeeCode}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-body-sm">{u.role}</td>
                    <td className="px-6 py-4 text-body-sm text-on-surface-variant">{u.department}</td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          'px-3 py-1 rounded-full text-label-sm font-medium border',
                          statusStyles[u.status],
                        )}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-body-sm text-on-surface-variant">{u.lastLogin}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        className="p-2 hover:bg-surface-container rounded-lg text-on-surface-variant hover:text-secondary transition-colors"
                        onClick={() =>
                          navigate({ to: '/admin/users/$userId', params: { userId: String(u.id) } })
                        }
                      >
                        <span className="material-symbols-outlined text-xl">visibility</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function Metric({
  icon,
  label,
  value,
  hint,
  valueClass,
}: {
  icon: string
  label: string
  value: string
  hint: string
  valueClass?: string
}) {
  return (
    <div className="bv-surface card-hover p-5">
      <div className="flex justify-between items-start mb-3">
        <div className="p-2 rounded-lg bg-secondary/15 text-secondary">
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <span className="text-xs font-bold text-on-surface-variant">{hint}</span>
      </div>
      <p className="text-label-md text-on-surface-variant uppercase tracking-widest">{label}</p>
      <h3 className={cn('text-2xl font-black text-on-surface mt-1', valueClass)}>{value}</h3>
    </div>
  )
}
