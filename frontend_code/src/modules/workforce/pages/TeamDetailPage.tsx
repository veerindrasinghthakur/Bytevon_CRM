import { useParams } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { teams } from '../data/mock'
import { cn } from '@/shared/lib/cn'

function Icon({ name, className }: { name: string; className?: string }) {
  return <span className={cn('material-symbols-outlined', className)} aria-hidden>{name}</span>
}

export function TeamDetailPage() {
  const { teamId } = useParams({ strict: false }) as { teamId: string }
  const t = teams.find((x) => x.id === teamId) ?? teams[0]

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div>
          <p className="text-label-sm text-on-surface-variant mb-1">Organization · Teams · {t.name}</p>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-headline-xl font-bold">{t.name}</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-variant text-secondary text-label-sm font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Active
            </span>
          </div>
          <div className="flex flex-wrap gap-4 text-body-md text-on-surface-variant">
            {t.createdOn && <span className="flex items-center gap-1"><Icon name="calendar_today" className="text-lg" /> Created on {t.createdOn}</span>}
            <span className="flex items-center gap-1"><Icon name="domain" className="text-lg" /> Department: {t.department}</span>
            <span className="flex items-center gap-1"><Icon name="person" className="text-lg" /> Lead: {t.headName}</span>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" leftIcon={<Icon name="edit" />}>Edit Team</Button>
          <Button variant="outline" leftIcon={<Icon name="assignment_add" />}>Assign to Project</Button>
          <Button variant="primary" leftIcon={<Icon name="download" />}>Export Data</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Members', value: `${t.memberCount} Members`, icon: 'group', change: '12%' },
          { label: 'Projects Delivered', value: `${t.projectCount * 6} Projects`, icon: 'check_circle', change: '4%' },
          { label: 'Current Velocity', value: `${t.velocity ?? 94}%`, icon: 'speed', change: '2%' },
          { label: 'Avg. Task Completion', value: '4.2 Days', icon: 'timer', down: true },
        ].map((s) => (
          <div key={s.label} className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant shadow-sm">
            <div className="flex justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-surface-container-low text-secondary flex items-center justify-center"><Icon name={s.icon} /></div>
              {s.change && <span className="text-emerald-600 text-label-sm bg-emerald-50 px-2 py-0.5 rounded">↑ {s.change}</span>}
            </div>
            <p className="text-body-md text-on-surface-variant">{s.label}</p>
            <p className="text-headline-xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="border-b border-outline-variant flex gap-6">
        {['Overview', 'Members', 'Project History', 'Performance'].map((tab, i) => (
          <button key={tab} type="button" className={cn('pb-3 text-label-md font-bold border-b-2', i === 0 ? 'border-secondary text-secondary' : 'border-transparent text-on-surface-variant')}>
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          {t.mission && (
            <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant shadow-sm">
              <h2 className="text-headline-md font-semibold mb-3 flex items-center gap-2"><Icon name="flag" className="text-secondary" /> Team Mission</h2>
              <p className="text-body-lg text-on-surface-variant leading-relaxed">{t.mission}</p>
            </div>
          )}
          <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant shadow-sm">
            <div className="flex justify-between mb-4">
              <h2 className="text-headline-md font-semibold flex items-center gap-2"><Icon name="account_tree" className="text-secondary" /> Active Projects</h2>
              <button type="button" className="text-secondary text-label-md font-bold">View All</button>
            </div>
            <div className="space-y-3">
              {[
                { name: 'Nexus Data Migration', client: 'Nexus Corp', due: 'Nov 15', pct: 75 },
                { name: 'Project Horizon API', client: 'Internal Initiative', due: 'Dec 01', pct: 40 },
              ].map((p) => (
                <div key={p.name} className="border border-outline-variant rounded-lg p-4">
                  <div className="flex justify-between mb-2">
                    <div>
                      <p className="font-semibold">{p.name}</p>
                      <p className="text-body-sm text-on-surface-variant">Client: {p.client}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-surface-variant text-secondary text-label-sm">Due: {p.due}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-surface-container-low rounded-full overflow-hidden">
                      <div className="bg-secondary h-full rounded-full" style={{ width: `${p.pct}%` }} />
                    </div>
                    <span className="text-label-md font-bold">{p.pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant shadow-sm">
            <h2 className="text-headline-md font-semibold mb-4 flex items-center gap-2"><Icon name="groups" className="text-secondary" /> Key Members</h2>
            <div className="space-y-3">
              {[
                { name: 'David Chen', title: 'Senior Backend Engineer' },
                { name: 'Maria Rodriguez', title: 'Database Architect' },
                { name: 'James Wilson', title: 'DevOps Lead' },
              ].map((m) => (
                <div key={m.name} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-xs font-bold">
                    {m.name.split(' ').map((p) => p[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{m.name}</p>
                    <p className="text-caption text-on-surface-variant">{m.title}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">View All {t.memberCount} Members</Button>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant shadow-sm">
            <h2 className="text-headline-md font-semibold mb-4 flex items-center gap-2"><Icon name="history" className="text-secondary" /> Recent Activity</h2>
            <div className="space-y-4 border-l-2 border-surface-variant ml-2 pl-4">
              <div>
                <p className="text-body-sm font-medium">Code merge to main for Nexus Data Migration.</p>
                <p className="text-caption text-on-surface-variant">Today, 10:30 AM</p>
              </div>
              <div>
                <p className="text-body-sm font-medium">Team sync: Q4 Planning finalized.</p>
                <p className="text-caption text-on-surface-variant">Yesterday, 2:00 PM</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
