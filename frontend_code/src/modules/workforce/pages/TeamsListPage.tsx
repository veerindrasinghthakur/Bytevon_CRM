import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { HEADER_HEIGHT_PX } from '@/shared/components/layout/Header'
import { Button } from '@/shared/components/ui/Button'
import { Select } from '@/shared/components/ui/Select'
import { MetricCard } from '@/shared/components/ui/MetricCard'
import { ExportButton } from '@/shared/components/export/ExportButton'
import { useTeamsList } from '../hooks/use-teams-list'
import { cn } from '@/shared/lib/cn'

function Icon({ name, className }: { name: string; className?: string }) {
  return <span className={cn('material-symbols-outlined', className)} aria-hidden>{name}</span>
}

export function TeamsListPage() {
  const navigate = useNavigate()
  const {
    metrics,
    filtered,
    search,
    setSearch,
    drawer,
    setDrawer,
    createOpen,
    setCreateOpen,
  } = useTeamsList()

  return (
    <div className="space-y-6 relative animate-fade-in">
      <PageHeader
        title="Teams"
        description="Manage and organize your cross-functional teams."
        actions={
          <div className="flex gap-2 flex-wrap">
            <ExportButton
              resource="team"
              query={search}
              filenameStem="teams"
            />
            <Button variant="primary" leftIcon={<Icon name="add" />} onClick={() => setCreateOpen(true)}>New Team</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <MetricCard
            key={m.id}
            label={m.label}
            value={m.value}
            icon={m.icon}
            valueClassName={m.change ? 'text-secondary' : undefined}
          />
        ))}
      </div>

      <div className="bv-surface overflow-hidden">
        <div className="p-4 border-b border-outline-variant/30 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-lg text-body-sm focus:ring-2 focus:ring-secondary/30 outline-none transition-colors" placeholder="Search teams..." />
          </div>
          <Select
            value="All"
            onChange={() => {}}
            placeholder="All Statuses"
            options={[
              { value: 'All', label: 'All Statuses' },
              { value: 'Active', label: 'Active' },
              { value: 'Inactive', label: 'Inactive' },
            ]}
            minWidthClass="min-w-[140px]"
          />
          <Select
            value="All"
            onChange={() => {}}
            placeholder="All Departments"
            options={[
              { value: 'All', label: 'All Departments' },
              { value: 'Engineering', label: 'Engineering' },
              { value: 'Design', label: 'Design' },
              { value: 'Sales', label: 'Sales' },
            ]}
            minWidthClass="min-w-[160px]"
          />
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-container-low/50 border-b border-outline-variant/30">
              <th className="px-6 py-4 text-label-sm font-medium text-on-surface-variant uppercase">Team Name</th>
              <th className="px-6 py-4 text-label-sm font-medium text-on-surface-variant uppercase">Head</th>
              <th className="px-6 py-4 text-label-sm font-medium text-on-surface-variant uppercase">Members</th>
              <th className="px-6 py-4 text-label-sm font-medium text-on-surface-variant uppercase">Projects</th>
              <th className="px-6 py-4 text-label-sm font-medium text-on-surface-variant uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {filtered.map((t) => (
              <tr key={t.id} className="zebra-row cursor-pointer group" onClick={() => setDrawer(t)}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
                      <Icon name={t.icon ?? 'groups'} />
                    </div>
                    <div>
                      <p className="font-semibold group-hover:text-secondary">{t.name}</p>
                      <p className="text-caption text-on-surface-variant">{t.department}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-xs font-bold">
                      {t.headName.split(' ').map((p) => p[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{t.headName}</p>
                      <p className="text-caption text-on-surface-variant">{t.headTitle}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-xs font-medium inline-flex">{t.memberCount}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="font-medium">{t.projectCount}</span>
                  {t.status === 'Active' && <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase">Active</span>}
                </td>
                <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <button type="button" className="p-2 hover:bg-secondary/10 rounded-full transition-colors" onClick={() => navigate({ to: '/workforce/teams/$teamId', params: { teamId: t.id } })}>
                    <Icon name="more_vert" className="text-lg" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {drawer && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setDrawer(null)} aria-hidden />
          <div className="fixed right-0 z-50 w-full max-w-md bv-surface executive-shadow border-l border-outline-variant flex flex-col" style={{ top: HEADER_HEIGHT_PX, height: `calc(100vh - ${HEADER_HEIGHT_PX}px)` }}>
            <div className="p-6 border-b flex justify-between items-start">
              <div className="flex gap-3">
                <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center"><Icon name={drawer.icon ?? 'groups'} /></div>
                <div>
                  <h3 className="text-title-lg font-bold">{drawer.name}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold uppercase">{drawer.status}</span>
                </div>
              </div>
              <button type="button" className="p-2 hover:bg-surface-container rounded-full transition-colors" onClick={() => setDrawer(null)}><Icon name="close" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <p className="text-body-md text-on-surface-variant">{drawer.description}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-surface-container-low rounded-xl text-center">
                  <p className="text-headline-lg font-bold text-secondary">{drawer.velocity ?? 90}%</p>
                  <p className="text-caption text-on-surface-variant">Sprint Velocity</p>
                </div>
                <div className="p-4 bg-surface-container-low rounded-xl text-center">
                  <p className="text-headline-lg font-bold text-secondary">{drawer.memberCount}</p>
                  <p className="text-caption text-on-surface-variant">Active Members</p>
                </div>
              </div>
              <div>
                <p className="text-label-sm font-bold text-on-surface-variant uppercase mb-2">Team Head</p>
                <p className="font-semibold">{drawer.headName}</p>
                <p className="text-caption text-on-surface-variant">{drawer.headTitle}</p>
              </div>
            </div>
            <div className="p-6 border-t flex gap-3">
              <Button variant="primary" className="flex-1" onClick={() => { setDrawer(null); navigate({ to: '/workforce/teams/$teamId', params: { teamId: drawer.id } }) }}>View Full Team</Button>
              <Button variant="outline">Edit Team</Button>
            </div>
          </div>
        </>
      )}

      {createOpen && (
        <>
          <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-50" onClick={() => setCreateOpen(false)} aria-hidden />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="bv-surface executive-shadow w-full max-w-2xl border border-outline-variant pointer-events-auto max-h-[90vh] flex flex-col" role="dialog">
              <div className="px-6 py-5 border-b flex justify-between items-center">
                <div>
                  <h2 className="text-headline-lg font-semibold">Create New Team</h2>
                  <p className="text-body-md text-on-surface-variant">Define team identity and assign members.</p>
                </div>
                <button type="button" className="p-2 hover:bg-surface-container rounded-full transition-colors" onClick={() => setCreateOpen(false)}><Icon name="close" /></button>
              </div>
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                <section>
                  <h3 className="text-headline-md font-semibold mb-3 flex items-center gap-2"><Icon name="badge" className="text-secondary" /> Team Identity</h3>
                  <div className="space-y-3 bg-surface p-4 rounded-lg border border-outline-variant">
                    <div>
                      <label className="text-label-sm block mb-1">Team Name <span className="text-error">*</span></label>
                      <input className="w-full border border-outline-variant rounded-md px-3 py-2 text-body-md focus:ring-2 focus:ring-secondary/30 outline-none transition-colors" placeholder="e.g., DevOps Team" />
                    </div>
                    <div>
                      <label className="text-label-sm block mb-1">Description</label>
                      <textarea className="w-full border border-outline-variant rounded-md px-3 py-2 text-body-md resize-none focus:ring-2 focus:ring-secondary/30 outline-none transition-colors" rows={3} placeholder="e.g., Responsible for infrastructure and CI/CD pipelines" />
                    </div>
                  </div>
                </section>
                <section>
                  <h3 className="text-headline-md font-semibold mb-3 flex items-center gap-2"><Icon name="star" className="text-secondary" /> Leadership</h3>
                  <div className="bg-surface p-4 rounded-lg border border-outline-variant">
                    <label className="text-label-sm block mb-1">Assign Team Head <span className="text-error">*</span></label>
                    <input className="w-full border border-outline-variant rounded-md px-3 py-2 text-body-md focus:ring-2 focus:ring-secondary/30 outline-none transition-colors" placeholder="Search employees by name..." />
                  </div>
                </section>
                <section>
                  <h3 className="text-headline-md font-semibold mb-3 flex items-center gap-2"><Icon name="group_add" className="text-secondary" /> Team Composition</h3>
                  <div className="bg-surface p-4 rounded-lg border border-outline-variant">
                    <label className="text-label-sm block mb-1">Add Members</label>
                    <input className="w-full border border-outline-variant rounded-md px-3 py-2 text-body-md focus:ring-2 focus:ring-secondary/30 outline-none transition-colors" placeholder="Search employees by name, role, or department..." />
                  </div>
                </section>
              </div>
              <div className="px-6 py-4 border-t flex justify-end gap-3">
                <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button variant="primary" onClick={() => setCreateOpen(false)}>Create Team</Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
