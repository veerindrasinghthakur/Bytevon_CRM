import { useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { candidateMembers, departments } from '../data/mock'
import type { DepartmentRole } from '../types'
import { cn } from '@/shared/lib/cn'

function Icon({ name, className }: { name: string; className?: string }) {
  return <span className={cn('material-symbols-outlined', className)} aria-hidden>{name}</span>
}

export function AddMemberPage() {
  const { departmentId } = useParams({ strict: false }) as { departmentId?: string }
  const navigate = useNavigate()
  const dept = departments.find((d) => d.id === departmentId) ?? departments[0]
  const [roles, setRoles] = useState<Record<string, DepartmentRole | null>>({})
  const [toast, setToast] = useState(false)

  const setRole = (id: string, role: DepartmentRole) => {
    setRoles((prev) => ({ ...prev, [id]: role }))
  }

  const addMember = () => {
    setToast(true)
    setTimeout(() => setToast(false), 3000)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Team Member"
        description={`Expand the ${dept.name} department by onboarding verified company employees. Ensure team balance across seniority levels.`}
        showBack
      />

      <div className="flex flex-wrap items-center gap-4 bg-surface-container rounded-xl p-4 border border-outline-variant/20">
        <div className="text-center px-4 border-r border-outline-variant/30">
          <p className="text-label-sm text-on-surface-variant uppercase">Total Headcount</p>
          <p className="text-headline-md font-bold">{dept.staffCount}</p>
        </div>
        <div className="flex gap-6 px-2">
          <div><p className="text-label-sm text-on-surface-variant">Leads</p><p className="text-title-lg font-semibold text-secondary">6</p></div>
          <div><p className="text-label-sm text-on-surface-variant">Senior</p><p className="text-title-lg font-semibold text-secondary">18</p></div>
          <div><p className="text-label-sm text-on-surface-variant">Junior</p><p className="text-title-lg font-semibold text-secondary">18</p></div>
        </div>
      </div>

      <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Icon name="filter_list" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input className="w-full pl-10 pr-4 py-2 border border-outline rounded-lg text-body-sm" placeholder="Filter by name..." />
        </div>
        <select className="border border-outline rounded-lg px-3 py-2 text-label-md"><option>All Departments</option></select>
        <select className="border border-outline rounded-lg px-3 py-2 text-label-md"><option>Any Experience</option></select>
        <select className="border border-outline rounded-lg px-3 py-2 text-label-md"><option>Available Status</option></select>
        <Button variant="primary">Apply Filters</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {candidateMembers.map((m) => (
          <div key={m.id} className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-secondary/10 text-secondary flex items-center justify-center font-bold">
                  {m.name.split(' ').map((p) => p[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <h3 className="text-title-lg font-semibold">{m.name}</h3>
                  <p className="text-label-sm text-on-surface-variant uppercase tracking-wide">{m.department}</p>
                </div>
              </div>
              <span className={cn(
                'px-2 py-1 rounded text-[10px] font-bold uppercase',
                m.availability === 'Available' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              )}>
                {m.availability}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 py-4 border-y border-outline-variant/20 mb-4">
              <div>
                <p className="text-label-sm text-on-surface-variant">Experience</p>
                <p className="font-semibold">{m.experienceYears} Years</p>
              </div>
              <div>
                <p className="text-label-sm text-on-surface-variant">Joined</p>
                <p className="font-semibold">{m.joinedLabel}</p>
              </div>
            </div>
            <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-2">Assign Role in {dept.name}</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {(['Lead', 'Senior', 'Junior'] as DepartmentRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(m.id, r)}
                  className={cn(
                    'flex-1 py-2 px-3 border rounded-lg text-label-md transition-all',
                    roles[m.id] === r
                      ? 'bg-secondary-container text-on-secondary-container border-secondary'
                      : 'border-outline-variant text-on-surface-variant hover:border-secondary'
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
            <Button variant="primary" className="w-full" leftIcon={<Icon name="add_circle" />} onClick={addMember}>
              Add to Department
            </Button>
          </div>
        ))}
        <div className="border-2 border-dashed border-outline-variant/40 rounded-xl flex flex-col items-center justify-center p-6 text-center min-h-[320px]">
          <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mb-3">
            <Icon name="person_search" className="text-3xl text-outline" />
          </div>
          <h3 className="text-title-lg font-semibold">External Recruitment</h3>
          <p className="text-body-sm text-on-surface-variant mt-2 mb-4">Can&apos;t find the right internal candidate? Create a job request.</p>
          <Button variant="outline">Create Job Req</Button>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-8 right-8 bg-inverse-surface text-inverse-on-surface px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-50">
          <Icon name="check_circle" className="text-emerald-400" />
          <div>
            <p className="font-bold text-sm">Member Added Successfully</p>
            <p className="text-xs opacity-80">Employee has been assigned to {dept.name}.</p>
          </div>
        </div>
      )}
    </div>
  )
}
