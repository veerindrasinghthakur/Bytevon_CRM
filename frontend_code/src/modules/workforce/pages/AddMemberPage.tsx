import { useMemo, useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { BackButton } from '@/shared/components/layout/BackButton'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { candidateMembers, departments, employees, teams } from '../data/mock'
import type { DepartmentRole } from '../types'
import { RouteCrumbs } from '../components/RouteCrumbs'
import { cn } from '@/shared/lib/cn'

function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn('material-symbols-outlined', className)} aria-hidden>
      {name}
    </span>
  )
}

type Mode = 'choose' | 'existing' | 'new'

/**
 * Shared Add Member page for department and team contexts.
 * Modes: create new employee → /workforce/employees/new
 *         or pick existing employee via searchable list.
 */
export function AddMemberPage() {
  const params = useParams({ strict: false }) as { departmentId?: string; teamId?: string }
  const navigate = useNavigate()
  const dept = departments.find((d) => d.id === params.departmentId) ?? departments[0]
  const team = teams.find((t) => t.id === params.teamId)
  const contextLabel = team ? team.name : dept.name
  const backTo = params.teamId
    ? `/workforce/teams/${params.teamId}`
    : `/workforce/departments/${dept.id}`

  const [mode, setMode] = useState<Mode>('choose')
  const [search, setSearch] = useState('')
  const [roles, setRoles] = useState<Record<string, DepartmentRole | null>>({})
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [toast, setToast] = useState(false)

  const pool = useMemo(() => {
    const fromCandidates = candidateMembers.map((m) => ({
      id: m.employeeId || m.id,
      name: m.name,
      title: m.title,
      department: m.department,
      experienceYears: m.experienceYears,
      joinedLabel: m.joinedLabel,
      availability: m.availability ?? 'Available',
    }))
    const fromEmployees = employees.map((e) => ({
      id: e.id,
      name: e.name,
      title: e.title,
      department: e.department,
      experienceYears: undefined as number | undefined,
      joinedLabel: e.joiningDate,
      availability: 'Available' as const,
    }))
    const seen = new Set<string>()
    const merged = [...fromCandidates, ...fromEmployees].filter((m) => {
      if (seen.has(m.id)) return false
      seen.add(m.id)
      return true
    })
    const q = search.toLowerCase()
    return merged.filter(
      (m) =>
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.title.toLowerCase().includes(q) ||
        m.department.toLowerCase().includes(q),
    )
  }, [search])

  const setRole = (id: string, role: DepartmentRole) => {
    setRoles((prev) => ({ ...prev, [id]: role }))
  }

  const addMember = () => {
    setToast(true)
    setTimeout(() => {
      setToast(false)
      navigate({ to: backTo as never })
    }, 1200)
  }

  const goCreateNew = () => {
    navigate({
      to: '/workforce/employees/new',
      search: {
        departmentId: params.departmentId ?? dept.id,
        teamId: params.teamId,
      } as never,
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <BackButton to={backTo} label="Back" />
        <RouteCrumbs
          className="mt-2 mb-2"
          items={[
            { label: 'Workforce', to: '/workforce/employees' },
            team
              ? { label: 'Teams', to: '/workforce/teams' }
              : { label: 'Departments', to: '/workforce/departments' },
            team
              ? { label: team.name, to: `/workforce/teams/${team.id}` }
              : { label: dept.name, to: `/workforce/departments/${dept.id}` },
            { label: 'Add Member' },
          ]}
        />
      </div>

      <PageHeader
        title="Add Member"
        description={`Add someone to ${contextLabel}. Create a new employee record or assign an existing one.`}
      />

      {mode === 'choose' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
          <button
            type="button"
            onClick={() => setMode('existing')}
            className="text-left rounded-xl border-2 border-outline-variant bg-surface-container-lowest p-6 hover:border-secondary transition-colors shadow-sm"
          >
            <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center mb-4">
              <Icon name="person_search" className="text-2xl" />
            </div>
            <h3 className="text-title-lg font-semibold text-on-background">Add existing employee</h3>
            <p className="text-body-sm text-on-surface-variant mt-2">
              Search and pick someone already in the organization, then assign a role.
            </p>
          </button>
          <button
            type="button"
            onClick={goCreateNew}
            className="text-left rounded-xl border-2 border-outline-variant bg-surface-container-lowest p-6 hover:border-secondary transition-colors shadow-sm"
          >
            <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center mb-4">
              <Icon name="person_add" className="text-2xl" />
            </div>
            <h3 className="text-title-lg font-semibold text-on-background">Create new employee</h3>
            <p className="text-body-sm text-on-surface-variant mt-2">
              Open the full employee create form. New hire will be linked to this {team ? 'team' : 'department'}.
            </p>
          </button>
        </div>
      )}

      {mode === 'existing' && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" leftIcon={<Icon name="arrow_back" />} onClick={() => setMode('choose')}>
              Change option
            </Button>
            <div className="relative flex-1 min-w-[220px]">
              <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-outline-variant rounded-lg text-body-sm outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary"
                placeholder="Search by name, title, or department…"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {pool.map((m) => {
              const selected = selectedId === m.id
              return (
                <div
                  key={m.id}
                  className={cn(
                    'bg-surface-container-lowest rounded-xl border shadow-sm p-6 transition-colors',
                    selected ? 'border-secondary ring-2 ring-secondary/20' : 'border-outline-variant',
                  )}
                >
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => setSelectedId(m.id)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-full bg-secondary/10 text-secondary flex items-center justify-center font-bold">
                          {m.name
                            .split(' ')
                            .map((p) => p[0])
                            .join('')
                            .slice(0, 2)}
                        </div>
                        <div>
                          <h3 className="text-title-lg font-semibold">{m.name}</h3>
                          <p className="text-label-sm text-on-surface-variant uppercase tracking-wide">{m.department}</p>
                        </div>
                      </div>
                      <span
                        className={cn(
                          'px-2 py-1 rounded text-[10px] font-bold uppercase',
                          m.availability === 'Available' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700',
                        )}
                      >
                        {m.availability}
                      </span>
                    </div>
                    <p className="text-body-sm text-on-surface-variant mb-3">{m.title}</p>
                  </button>
                  <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-2">
                    Assign role in {contextLabel}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {(['Lead', 'Senior', 'Junior'] as DepartmentRole[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => {
                          setSelectedId(m.id)
                          setRole(m.id, r)
                        }}
                        className={cn(
                          'flex-1 py-2 px-3 border rounded-lg text-label-md transition-all',
                          roles[m.id] === r
                            ? 'bg-secondary-container text-on-secondary-container border-secondary'
                            : 'border-outline-variant text-on-surface-variant hover:border-secondary',
                        )}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                  <Button
                    variant="primary"
                    className="w-full"
                    leftIcon={<Icon name="add_circle" />}
                    disabled={!roles[m.id]}
                    onClick={addMember}
                  >
                    Add to {team ? 'Team' : 'Department'}
                  </Button>
                </div>
              )
            })}
          </div>
          {pool.length === 0 && (
            <div className="rounded-xl border border-dashed border-outline-variant p-10 text-center text-on-surface-variant">
              No employees match your search. Try a different query or create a new employee.
            </div>
          )}
        </>
      )}

      {toast && (
        <div className="fixed bottom-8 right-8 bg-inverse-surface text-inverse-on-surface px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-50">
          <Icon name="check_circle" className="text-emerald-400" />
          <div>
            <p className="font-bold text-sm">Member Added Successfully</p>
            <p className="text-xs opacity-80">Employee has been assigned to {contextLabel}.</p>
          </div>
        </div>
      )}
    </div>
  )
}
