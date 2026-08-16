import { useMemo, useState } from 'react'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { auditLogs } from '../data/mock'
import { cn } from '@/shared/lib/cn'

const actionStyles: Record<string, string> = {
  Create: 'bg-green-100 text-green-800',
  Update: 'bg-blue-100 text-blue-800',
  Delete: 'bg-red-100 text-red-800',
  Login: 'bg-purple-100 text-purple-800',
  Lock: 'bg-amber-100 text-amber-800',
}

export function AuditLogsPage() {
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('All Actions')
  const [moduleFilter, setModuleFilter] = useState('All Modules')
  const [drawerLog, setDrawerLog] = useState<(typeof auditLogs)[0] | null>(null)

  const filtered = useMemo(() => {
    return auditLogs.filter((log) => {
      if (search) {
        const q = search.toLowerCase()
        if (
          !log.action.toLowerCase().includes(q) &&
          !log.actor.toLowerCase().includes(q) &&
          !log.target.toLowerCase().includes(q) &&
          !log.module.toLowerCase().includes(q)
        )
          return false
      }
      if (actionFilter !== 'All Actions' && !log.action.toLowerCase().includes(actionFilter.toLowerCase()))
        return false
      if (moduleFilter !== 'All Modules' && log.module !== moduleFilter) return false
      return true
    })
  }, [search, actionFilter, moduleFilter])

  return (
    <div className="space-y-6 relative">
      <PageHeader
        title="Audit Logs"
        description="Immutable record of significant administrative and security actions."
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<span className="material-symbols-outlined text-[18px]">download</span>}
            >
              Export
            </Button>
          </div>
        }
      />

      {/* KPI strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon="event_note" value="1,284" title="Today's Activities" subtitle="Total audit events generated today." />
        <KpiCard icon="shield_person" value="342" title="Login Events" subtitle="Successful login and logout events." />
        <KpiCard icon="business_center" value="891" title="Business Events" subtitle="Projects, Leaves, and Approvals." />
        <KpiCard icon="terminal" value="51" title="System Events" subtitle="Background jobs and automation." />
      </section>

      {/* Filters */}
      <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-label-md text-on-surface">Global Search</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                search
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-lg focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none text-body-sm bg-transparent"
                placeholder="Search description, employee, ID..."
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-label-md text-on-surface">Action</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-4 py-2 border border-outline-variant rounded-lg text-body-sm outline-none focus:ring-2 focus:ring-secondary/30 bg-transparent"
            >
              {['All Actions', 'Create', 'Update', 'Delete', 'Login', 'Lock'].map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-label-md text-on-surface">Module</label>
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="w-full px-4 py-2 border border-outline-variant rounded-lg text-body-sm outline-none focus:ring-2 focus:ring-secondary/30 bg-transparent"
            >
              {['All Modules', 'Roles', 'Auth', 'Settings', 'Users'].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('')
                setActionFilter('All Actions')
                setModuleFilter('All Modules')
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </section>

      {/* Table */}
      <section className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[960px]">
            <thead>
              <tr className="bg-surface-container-low">
                <th className="px-6 py-3 text-label-sm text-on-surface-variant uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-label-sm text-on-surface-variant uppercase tracking-wider">Actor</th>
                <th className="px-6 py-3 text-label-sm text-on-surface-variant uppercase tracking-wider">Action</th>
                <th className="px-6 py-3 text-label-sm text-on-surface-variant uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-label-sm text-on-surface-variant uppercase tracking-wider">Module</th>
                <th className="px-6 py-3 text-label-sm text-on-surface-variant uppercase tracking-wider">IP</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {filtered.map((log) => {
                const actionKey =
                  Object.keys(actionStyles).find((k) => log.action.toLowerCase().includes(k.toLowerCase())) ??
                  'Update'
                return (
                  <tr
                    key={log.id}
                    className="hover:bg-surface-container-low/50 cursor-pointer transition-colors"
                    onClick={() => setDrawerLog(log)}
                  >
                    <td className="px-6 py-4 text-body-sm text-on-surface-variant whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-secondary/15 text-secondary flex items-center justify-center text-label-sm font-bold">
                          {log.actorInitials}
                        </div>
                        <span className="text-label-md text-on-background">{log.actor}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          'px-2 py-1 rounded-full text-xs font-semibold',
                          actionStyles[actionKey] ?? 'bg-surface-container text-on-surface-variant'
                        )}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-body-sm text-on-surface max-w-[280px] truncate">
                      {log.target}
                    </td>
                    <td className="px-6 py-4 text-body-sm text-on-surface-variant">{log.module}</td>
                    <td className="px-6 py-4 text-body-sm font-mono text-on-surface-variant">{log.ip}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        className="material-symbols-outlined text-on-surface-variant hover:text-secondary text-[20px]"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDrawerLog(log)
                        }}
                      >
                        visibility
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-12 text-center text-on-surface-variant text-body-md">No audit events match your filters.</div>
        )}
      </section>

      {/* Detail drawer */}
      {drawerLog && (
        <>
          <div
            className="fixed inset-0 bg-primary/20 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setDrawerLog(null)}
          />
          <aside className="fixed top-0 right-0 h-full w-full max-w-md bg-surface-container-lowest border-l border-outline-variant shadow-2xl z-50 flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-outline-variant">
              <h3 className="text-title-lg font-semibold text-on-background">Event Details</h3>
              <button
                type="button"
                className="p-2 rounded-lg hover:bg-surface-container"
                onClick={() => setDrawerLog(null)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <DetailRow label="Event ID" value={drawerLog.id} />
              <DetailRow label="Timestamp" value={drawerLog.timestamp} />
              <DetailRow label="Actor" value={drawerLog.actor} />
              <DetailRow label="Action" value={drawerLog.action} />
              <DetailRow label="Target" value={drawerLog.target} />
              <DetailRow label="Module" value={drawerLog.module} />
              <DetailRow label="IP Address" value={drawerLog.ip} />
            </div>
          </aside>
        </>
      )}
    </div>
  )
}

function KpiCard({
  icon,
  value,
  title,
  subtitle,
}: {
  icon: string
  value: string
  title: string
  subtitle: string
}) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <div className="w-10 h-10 rounded-lg bg-surface-container text-secondary flex items-center justify-center">
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <span className="text-2xl font-bold text-primary">{value}</span>
      </div>
      <p className="text-title-lg font-semibold text-on-surface mb-1">{title}</p>
      <p className="text-label-sm text-on-surface-variant">{subtitle}</p>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-body-md text-on-background">{value}</p>
    </div>
  )
}
