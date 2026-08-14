import { useNavigate, useParams } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { departments, departmentLeads, departmentHighlights } from '../data/mock'
import { cn } from '@/shared/lib/cn'

function Icon({ name, className }: { name: string; className?: string }) {
  return <span className={cn('material-symbols-outlined', className)} aria-hidden>{name}</span>
}

export function DepartmentDetailPage() {
  const { departmentId } = useParams({ strict: false }) as { departmentId: string }
  const navigate = useNavigate()
  const d = departments.find((x) => x.id === departmentId) ?? departments[0]

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-label-sm text-on-surface-variant mb-1">Employees · Departments · {d.name}</p>
          <div className="flex items-center gap-3">
            <h1 className="text-headline-lg text-on-background">{d.name}</h1>
            <span className="px-3 py-1 bg-surface-container-highest text-secondary text-label-sm rounded-full">{d.code}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" leftIcon={<Icon name="edit" />}>Edit Department</Button>
          <Button variant="primary" leftIcon={<Icon name="person_add" />} onClick={() => navigate({ to: '/workforce/departments/$departmentId/members', params: { departmentId: d.id } })}>
            Add Member
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm">
          <p className="text-on-surface-variant text-label-md mb-2">Total Staff</p>
          <p className="text-display-lg font-bold">{d.staffCount}</p>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm">
          <p className="text-on-surface-variant text-label-md mb-2">Open Positions</p>
          <p className="text-display-lg font-bold">{String(d.openPositions ?? 0).padStart(2, '0')}</p>
          <p className="text-label-sm text-on-surface-variant">Active hiring</p>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm">
          <p className="text-on-surface-variant text-label-md mb-2">Health Score</p>
          <p className="text-display-lg font-bold">{d.healthScore ?? 90}%</p>
          <div className="h-2 bg-surface-container rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: `${d.healthScore ?? 90}%` }} />
          </div>
        </div>
        <div className="bg-primary text-white p-6 rounded-xl shadow-xl relative overflow-hidden">
          <p className="text-white/70 text-label-md mb-2">Budget Utilization</p>
          <p className="text-display-lg font-bold">{d.budgetLabel ?? '—'}</p>
          <p className="text-white/60 text-body-sm mt-1">Remaining: {d.budgetRemaining ?? '—'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
            <div className="h-20 bg-gradient-to-r from-primary to-secondary" />
            <div className="px-6 pb-6 -mt-10 relative">
              <div className="w-20 h-20 rounded-2xl border-4 border-surface-container-lowest bg-secondary/10 text-secondary flex items-center justify-center text-xl font-bold shadow-md mb-3">
                {d.headName.split(' ').map((p) => p[0]).join('').slice(0, 2)}
              </div>
              <h3 className="text-headline-md font-semibold">{d.headName}</h3>
              <p className="text-secondary font-medium mb-4">{d.headTitle ?? 'Department Head'}</p>
              <div className="space-y-2 text-on-surface-variant text-body-sm">
                <p className="flex items-center gap-2"><Icon name="mail" className="text-lg" /> head@{d.name.toLowerCase()}.bytevon.io</p>
                <p className="flex items-center gap-2"><Icon name="call" className="text-lg" /> +1 (555) 098-4432</p>
                <p className="flex items-center gap-2"><Icon name="location_on" className="text-lg" /> HQ — Floor 4</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm">
            <div className="flex justify-between mb-4">
              <div>
                <h4 className="text-title-lg font-semibold">Employee Heads</h4>
                <p className="text-body-sm text-on-surface-variant">Core leadership within {d.name}</p>
              </div>
              <button type="button" className="text-secondary text-label-md hover:underline">View All Leads</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {departmentLeads.map((l) => (
                <div key={l.id} className="p-4 rounded-xl border border-outline-variant/20 hover:border-secondary/30 flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-sm font-bold">
                      {l.name.split(' ').map((p) => p[0]).join('').slice(0, 2)}
                    </div>
                    <span className={cn('absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white', l.online ? 'bg-green-500' : 'bg-amber-500')} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm">{l.name}</p>
                    <p className="text-xs text-on-surface-variant">{l.title}</p>
                  </div>
                  <Icon name="arrow_forward_ios" className="text-sm text-outline" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm">
            <h4 className="text-title-lg font-semibold mb-4">Department Highlights</h4>
            <div className="space-y-4">
              {departmentHighlights.map((h) => (
                <div key={h.id} className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                    <Icon name={h.icon} className="text-lg" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{h.title}</p>
                    <p className="text-body-sm text-on-surface-variant">{h.body}</p>
                    <p className="text-[11px] text-outline uppercase font-bold mt-1">{h.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
