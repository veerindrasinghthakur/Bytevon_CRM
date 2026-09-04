import { useMemo, useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { BackButton } from '@/shared/components/layout/BackButton'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import {
  listCandidateMembers,
  listWorkforceDepartments,
  listWorkforceEmployees,
  listWorkforceTeams,
} from '../api/workforce'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import type { AddMemberMode, CandidateMember, DepartmentRole } from '../types'
import { DEPARTMENT_ROLE_OPTIONS } from '../schemas/enums'
import { RouteCrumbs } from '../components/RouteCrumbs'
import { cn } from '@/shared/lib/cn'

function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn('material-symbols-outlined', className)} aria-hidden>
      {name}
    </span>
  )
}

/**
 * Add member flow. Prefer bottom-sheet presentation when opened as overlay
 * from team/department detail; full page still works via route.
 */
export function AddMemberPage() {
  const params = useParams({ strict: false }) as { departmentId?: string; teamId?: string }
  const navigate = useNavigate()
  const departmentList = listWorkforceDepartments()
  const teamList = listWorkforceTeams()
  const dept = departmentList.find((d) => d.id === params.departmentId) ?? departmentList[0]
  const team = teamList.find((t) => t.id === params.teamId)
  const contextLabel = team ? team.name : dept.name
  const backTo = params.teamId
    ? `/workforce/teams/${params.teamId}`
    : `/workforce/departments/${dept.id}`

  const [mode, setMode] = useState<AddMemberMode>('choose')
  const [search, setSearch] = useState('')
  const [roles, setRoles] = useState<Record<string, DepartmentRole | null>>({})
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [toast, setToast] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(true)

  const pool = useMemo(() => {
    const fromCandidates: CandidateMember[] = listCandidateMembers().map((m) => ({
      id: m.id,
      name: m.name,
      title: m.title,
      department: m.department,
      experienceYears: undefined,
      joinedLabel: undefined,
      availability: m.availability ?? 'Available',
    }))
    const fromEmployees: CandidateMember[] = listWorkforceEmployees().map((e) => ({
      id: e.id,
      name: e.name,
      title: e.title,
      department: e.department,
      experienceYears: undefined,
      joinedLabel: undefined,
      availability: 'Available',
    }))
    const seen = new Set<string>()
    const merged = [...fromCandidates, ...fromEmployees].filter((m) => {
      if (seen.has(m.id)) return false
      seen.add(m.id)
      return true
    })
    const q = search.toLowerCase()
    return merged.filter((m) => {
      if (!q) return true
      const title = m.title ?? ''
      const department = m.department ?? ''
      return (
        m.name.toLowerCase().includes(q) ||
        title.toLowerCase().includes(q) ||
        department.toLowerCase().includes(q)
      )
    })
  }, [search])

  const setRole = (id: string, role: DepartmentRole) => {
    setRoles((prev) => ({ ...prev, [id]: role }))
  }

  const close = () => {
    setSheetOpen(false)
    setTimeout(() => safeNavigate(navigate, { to: backTo }), 200)
  }

  const addMember = () => {
    setToast(true)
    setTimeout(() => {
      setToast(false)
      close()
    }, 1000)
  }

  const goCreateNew = () => {
    safeNavigate(navigate, {
      to: '/workforce/employees/new',
      search: {
        departmentId: params.departmentId ?? dept.id,
        teamId: params.teamId,
      },
    })
  }

  return (
    <div className="relative min-h-[60vh] animate-fade-in">
      <div className="opacity-40 pointer-events-none space-y-4">
        <BackButton to={backTo} label="Back" />
        <PageHeader title={contextLabel} description="Background context" />
      </div>

      {/* Bottom sheet overlay */}
      <div className="fixed inset-0 z-50 flex flex-col justify-end">
        <button
          type="button"
          className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
          aria-label="Close"
          onClick={close}
        />
        <div
          className={cn(
            'relative z-10 bg-surface-container-lowest rounded-t-2xl border-t border-outline-variant shadow-2xl max-h-[88vh] flex flex-col transition-transform duration-300',
            sheetOpen ? 'translate-y-0' : 'translate-y-full',
          )}
          role="dialog"
          aria-modal
        >
          <div className="flex justify-center pt-3 pb-1">
            <span className="w-10 h-1 rounded-full bg-outline-variant" />
          </div>
          <div className="px-6 py-3 border-b border-outline-variant flex items-start justify-between gap-3">
            <div>
              <h2 className="text-title-lg font-bold text-on-background">Add Member</h2>
              <p className="text-body-sm text-on-surface-variant">Assign to {contextLabel}</p>
            </div>
            <button
              type="button"
              className="p-2 rounded-full hover:bg-surface-container transition-colors"
              onClick={close}
            >
              <Icon name="close" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {mode === 'choose' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setMode('existing')}
                  className="text-left bv-surface card-hover p-5 border-2 border-outline-variant hover:border-secondary transition-all"
                >
                  <div className="w-11 h-11 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center mb-3">
                    <Icon name="person_search" className="text-2xl" />
                  </div>
                  <h3 className="font-semibold text-on-background">Add existing employee</h3>
                  <p className="text-body-sm text-on-surface-variant mt-1">Search directory and assign role</p>
                </button>
                <button
                  type="button"
                  onClick={goCreateNew}
                  className="text-left bv-surface card-hover p-5 border-2 border-outline-variant hover:border-secondary transition-all"
                >
                  <div className="w-11 h-11 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center mb-3">
                    <Icon name="person_add" className="text-2xl" />
                  </div>
                  <h3 className="font-semibold text-on-background">Create new employee</h3>
                  <p className="text-body-sm text-on-surface-variant mt-1">Full onboarding form</p>
                </button>
              </div>
            )}

            {mode === 'existing' && (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="outline" size="sm" leftIcon={<Icon name="arrow_back" />} onClick={() => setMode('choose')}>
                    Back
                  </Button>
                  <div className="relative flex-1 min-w-[200px]">
                    <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-outline-variant rounded-lg text-body-sm outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary"
                      placeholder="Search by name, title, or department…"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {pool.map((m) => {
                    const selected = selectedId === m.id
                    return (
                      <div
                        key={m.id}
                        className={cn(
                          'bv-surface p-4 transition-all',
                          selected ? 'border-secondary ring-2 ring-secondary/20' : '',
                        )}
                      >
                        <button type="button" className="w-full text-left" onClick={() => setSelectedId(m.id)}>
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-11 h-11 rounded-full bg-secondary/10 text-secondary flex items-center justify-center font-bold text-sm">
                              {m.name
                                .split(' ')
                                .map((p) => p[0])
                                .join('')
                                .slice(0, 2)}
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-semibold truncate">{m.name}</h3>
                              <p className="text-xs text-on-surface-variant truncate">{m.title}</p>
                            </div>
                          </div>
                        </button>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {DEPARTMENT_ROLE_OPTIONS.map((option) => {
                            const r = option.value as DepartmentRole
                            return (
                            <button
                              key={r}
                              type="button"
                              onClick={() => {
                                setSelectedId(m.id)
                                setRole(m.id, r)
                              }}
                              className={cn(
                                'flex-1 py-1.5 px-2 border rounded-lg text-xs font-semibold transition-all',
                                roles[m.id] === r
                                  ? 'bg-secondary text-on-secondary border-secondary'
                                  : 'border-outline-variant text-on-surface-variant hover:border-secondary',
                              )}
                            >
                              {r}
                            </button>
                            )
                          })}
                        </div>
                        <Button
                          variant="primary"
                          size="sm"
                          className="w-full"
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
                  <div className="rounded-xl border border-dashed border-outline-variant p-8 text-center text-on-surface-variant">
                    No employees match. Try another query or create a new employee.
                  </div>
                )}
              </>
            )}
          </div>

          <div className="p-4 border-t border-outline-variant flex justify-end gap-2">
            <Button variant="outline" onClick={close}>
              Cancel
            </Button>
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-8 right-8 bg-inverse-surface text-inverse-on-surface px-6 py-4 rounded-xl executive-shadow flex items-center gap-3 z-[60]">
          <Icon name="check_circle" className="text-emerald-400" />
          <div>
            <p className="font-bold text-sm">Member Added Successfully</p>
            <p className="text-xs opacity-80">Assigned to {contextLabel}.</p>
          </div>
        </div>
      )}

      {/* crumbs for accessibility / SEO when full route */}
      <div className="sr-only">
        <RouteCrumbs items={[{ label: 'Add Member' }]} />
      </div>
    </div>
  )
}
