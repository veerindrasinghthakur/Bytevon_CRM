import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { adminUsers } from '../data/mock'
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Provision accounts, assign roles, and manage access status."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" leftIcon={<span className="material-symbols-outlined text-[18px]">download</span>}>
              Export
            </Button>
            <Button variant="primary" size="sm" leftIcon={<span className="material-symbols-outlined text-[18px]">person_add</span>}>
              Invite User
            </Button>
          </div>
        }
      />

      <section className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-outline-variant flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
              search
            </span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search users…"
              className="w-full pl-10 pr-3 py-2 border border-outline-variant rounded-lg text-body-sm bg-transparent outline-none focus:ring-2 focus:ring-secondary/30"
            />
          </div>
          <Button variant="outline" size="sm">
            Role
          </Button>
          <Button variant="outline" size="sm">
            Status
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[880px]">
            <thead>
              <tr className="bg-surface-container-low">
                <th className="px-6 py-3 text-label-md text-on-surface-variant uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-label-md text-on-surface-variant uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-label-md text-on-surface-variant uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-label-md text-on-surface-variant uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-label-md text-on-surface-variant uppercase tracking-wider">Last Login</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {visible.map((u) => (
                <tr
                  key={u.id}
                  className="hover:bg-surface-container-low cursor-pointer"
                  onClick={() => navigate({ to: '/admin/users/$userId', params: { userId: u.id } })}
                >
                  <td className="px-6 py-4">
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
                    <span className={cn('px-3 py-1 rounded-full text-label-sm font-medium border', statusStyles[u.status])}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-body-sm text-on-surface-variant">{u.lastLogin}</td>
                  <td className="px-6 py-4 text-right text-label-md text-secondary font-medium">View</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
