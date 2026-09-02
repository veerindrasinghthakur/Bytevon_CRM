import { useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { BackButton } from '@/shared/components/layout/BackButton'
import { Button } from '@/shared/components/ui/Button'
import { EditButton } from '@/shared/components/ui/EditButton'
import { Select } from '@/shared/components/ui/Select'
import { SearchableSelect } from '@/shared/components/ui/SearchableSelect'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { Can } from '@/shared/rbac'
import { Action, ResourceName } from '@/shared/schema'
import type { DepartmentEmployee } from '../api/departments'
import { useDepartmentDetail } from '../hooks/use-department-detail'
import { DynamicRouteCrumbs } from '../components/RouteCrumbs'
import { workforceRoutes } from '../routes'
import { cn } from '@/shared/lib/cn'

function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn('material-symbols-outlined', className)} aria-hidden>
      {name}
    </span>
  )
}

export function DepartmentDetailPage() {
  const { departmentId } = useParams({ strict: false }) as { departmentId: string }
  const navigate = useNavigate()
  const id = Number(departmentId)

  const {
    department: d,
    staff,
    isLoading,
    isError,
    refetch,
    updateDepartment,
    assignEmployee,
    removeEmployee,
    isMutating,
    listCandidates,
    listHeadOptions,
  } = useDepartmentDetail(id)

  const [addOpen, setAddOpen] = useState(false)
  const [mode, setMode] = useState<'choose' | 'existing'>('choose')
  const [candidates, setCandidates] = useState<{ value: string; label: string; meta?: string }[]>([])
  const [selectedEmp, setSelectedEmp] = useState('')

  const [isEditing, setIsEditing] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [draftHeadId, setDraftHeadId] = useState<string>('')
  const [headPickerOpen, setHeadPickerOpen] = useState(false)
  const [headOptions, setHeadOptions] = useState<{ value: string; label: string }[]>([])
  const [removeTarget, setRemoveTarget] = useState<DepartmentEmployee | null>(null)

  const openPositions = Math.max(
    0,
    (d as (typeof d & { openPositions?: number }) | null)?.openPositions ?? 0,
  )

  const startEdit = async () => {
    if (!d) return
    setDraftName(d.name)
    setDraftHeadId(d.headEmploymentId != null ? String(d.headEmploymentId) : '')
    setIsEditing(true)
    const fromStaff = staff.map((e) => ({
      value: String(e.employmentId),
      label: `${e.name} (${e.employeeCode})`,
    }))
    if (fromStaff.length > 0) {
      setHeadOptions(fromStaff)
    } else {
      const all = await listHeadOptions()
      setHeadOptions(all.map((o) => ({ value: o.value, label: o.label })))
    }
  }

  const cancelEdit = () => {
    if (d) {
      setDraftName(d.name)
      setDraftHeadId(d.headEmploymentId != null ? String(d.headEmploymentId) : '')
    }
    setIsEditing(false)
    setHeadPickerOpen(false)
  }

  const saveEdit = async () => {
    if (!d) return
    try {
      await updateDepartment({
        name: draftName.trim() || d.name,
        headEmploymentId: draftHeadId ? Number(draftHeadId) : null,
      })
      setIsEditing(false)
      setHeadPickerOpen(false)
    } catch {
      /* mutation error surface later if needed */
    }
  }

  const openAdd = async () => {
    setMode('choose')
    setSelectedEmp('')
    setAddOpen(true)
  }

  const loadCandidates = async () => {
    const rows = await listCandidates()
    setCandidates(rows)
    setMode('existing')
  }

  const assignExisting = async () => {
    if (!selectedEmp) return
    try {
      await assignEmployee(Number(selectedEmp))
      setAddOpen(false)
    } catch {
      /* ignore */
    }
  }

  const confirmRemove = async () => {
    if (!removeTarget) return
    try {
      await removeEmployee(removeTarget.employmentId)
      setRemoveTarget(null)
    } catch {
      /* ignore */
    }
  }

  if (isLoading) {
    return <PageLoadingSkeleton />
  }

  if (isError) {
    return (
      <ErrorState
        title="Could not load department"
        description="Department data failed to load. Retry or go back."
        onRetry={() => void refetch()}
      />
    )
  }

  if (!d) {
    return (
      <div className="space-y-4 animate-fade-in">
        <BackButton to={workforceRoutes.departments} label="Back to departments" />
        <ErrorState
          title="Department not found"
          description="This department may have been archived or the link is invalid."
          showBack={false}
          onBack={() => navigate({ to: workforceRoutes.departments, search: {} })}
        />
      </div>
    )
  }

  const headEmployee =
    staff.find((e) => e.employmentId === d.headEmploymentId) ??
    staff.find((e) => e.name === d.headName) ??
    null

  const displayName = isEditing ? draftName : d.name
  const displayHeadName = isEditing
    ? headOptions.find((o) => o.value === draftHeadId)?.label?.replace(/\s*\(.*\)$/, '') ??
      (draftHeadId ? d.headName : 'Unassigned')
    : d.headName || 'Unassigned'

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <BackButton to={workforceRoutes.departments} label="Back to departments" />
        <DynamicRouteCrumbs className="mt-2 mb-3" lastLabel={d.name} />
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            {isEditing ? (
              <input
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                className="text-headline-lg font-bold text-on-background bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            ) : (
              <h1 className="text-headline-lg text-on-background">{displayName}</h1>
            )}
            <span className="px-3 py-1 bg-surface-container-highest text-secondary text-label-sm rounded-full">
              {d.code}
            </span>
            <span
              className={cn(
                'px-3 py-1 rounded-full text-label-sm font-medium',
                d.status === 'Active' ? 'bg-secondary/10 text-secondary' : 'bg-surface-container',
              )}
            >
              {d.status}
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {isEditing ? (
              <>
                <Button variant="ghost" onClick={cancelEdit} disabled={isMutating}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={() => void saveEdit()} isLoading={isMutating}>
                  Save
                </Button>
              </>
            ) : (
              <>
                <Can action={Action.UPDATE} resource={ResourceName.DEPARTMENT}>
                  <EditButton onClick={() => void startEdit()} label="Edit Department" />
                </Can>
                <Can action={Action.UPDATE} resource={ResourceName.DEPARTMENT}>
                  <Button variant="primary" leftIcon={<Icon name="person_add" />} onClick={() => void openAdd()}>
                    Add Member
                  </Button>
                </Can>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bv-surface card-hover p-6 transition-all hover:-translate-y-0.5">
          <p className="text-on-surface-variant text-label-md mb-2">Total Staff</p>
          <p className="text-display-lg font-bold">{d.staffCount}</p>
        </div>
        <div className="bv-surface card-hover p-6 transition-all hover:-translate-y-0.5">
          <p className="text-on-surface-variant text-label-md mb-2">Active assignments</p>
          <p className="text-display-lg font-bold">{staff.length}</p>
        </div>
        {openPositions > 0 && (
          <div className="bv-surface card-hover p-6 border-secondary/30 transition-all hover:-translate-y-0.5">
            <p className="text-on-surface-variant text-label-md mb-2 flex items-center gap-1">
              <Icon name="work" className="text-base text-secondary" /> Open positions
            </p>
            <p className="text-display-lg font-bold text-secondary">{openPositions}</p>
          </div>
        )}
        <div className="bv-surface card-hover p-6 transition-all hover:-translate-y-0.5">
          <p className="text-on-surface-variant text-label-md mb-2">Department Head</p>
          <p className="text-title-lg font-bold">{displayHeadName || '—'}</p>
        </div>
      </div>

      <section className="bv-surface p-6 card-hover">
        <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
          <h3 className="text-title-md font-semibold flex items-center gap-2">
            <Icon name="star" className="text-amber-500" /> Department Head
          </h3>
          {isEditing && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Icon name="swap_horiz" />}
              onClick={() => setHeadPickerOpen((o) => !o)}
            >
              {headPickerOpen ? 'Hide picker' : 'Change head'}
            </Button>
          )}
        </div>

        {isEditing && headPickerOpen && (
          <div className="mb-4 p-4 rounded-xl border border-outline-variant bg-surface-container-low space-y-3">
            <Select
              label="Select department head"
              value={draftHeadId}
              onChange={setDraftHeadId}
              options={[{ value: '', label: 'Unassigned' }, ...headOptions]}
              placeholder="Choose employee…"
              minWidthClass="min-w-full"
            />
          </div>
        )}

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-secondary/15 text-secondary flex items-center justify-center text-xl font-bold">
            {(displayHeadName || '?')
              .split(' ')
              .map((p) => p[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="text-lg font-bold text-on-background">{displayHeadName || 'Unassigned'}</p>
            <p className="text-sm text-on-surface-variant">
              {headEmployee?.positionName ?? 'Department Lead'} · {displayName}
            </p>
            {headEmployee?.email && (
              <p className="text-xs text-on-surface-variant mt-1">{headEmployee.email}</p>
            )}
          </div>
          {headEmployee && !isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                navigate({
                  to: workforceRoutes.employeeDetailPath,
                  params: { employeeId: String(headEmployee.employmentId) },
                  search: {},
                })
              }
            >
              View profile
            </Button>
          )}
        </div>
      </section>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-title-lg font-semibold">Team members</h3>
          <span className="text-sm text-on-surface-variant">{staff.length} people</span>
        </div>

        {staff.length === 0 ? (
          <div className="bv-surface p-12 text-center text-on-surface-variant space-y-3">
            <Icon name="group_off" className="text-5xl" />
            <p>No employees assigned yet.</p>
            {!isEditing && (
              <Can action={Action.UPDATE} resource={ResourceName.DEPARTMENT}>
                <Button variant="primary" size="sm" onClick={() => void openAdd()}>
                  Add Member
                </Button>
              </Can>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {staff.map((e) => {
              const initials = e.name
                .split(' ')
                .map((p) => p[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()
              const isHead =
                e.employmentId === d.headEmploymentId ||
                e.name === d.headName ||
                (isEditing && draftHeadId === String(e.employmentId))
              return (
                <div
                  key={e.employmentId}
                  className="bv-surface p-5 text-left card-hover transition-all hover:-translate-y-1 hover:border-secondary/40 group relative"
                >
                  {isEditing && (
                    <button
                      type="button"
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-error/10 text-error hover:bg-error hover:text-white flex items-center justify-center transition-colors z-10"
                      aria-label={`Remove ${e.name}`}
                      onClick={(ev) => {
                        ev.stopPropagation()
                        setRemoveTarget(e)
                      }}
                    >
                      <Icon name="remove" className="text-lg" />
                    </button>
                  )}
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => {
                      if (isEditing) return
                      navigate({
                        to: workforceRoutes.employeeDetailPath,
                        params: { employeeId: String(e.employmentId) },
                        search: {},
                      })
                    }}
                  >
                    <div className="flex items-start gap-3 pr-8">
                      <div className="w-12 h-12 rounded-full bg-secondary/15 text-secondary flex items-center justify-center font-bold">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-on-background truncate flex items-center gap-1">
                          {e.name}
                          {isHead && <Icon name="star" className="text-amber-500 text-base" />}
                        </p>
                        <p className="text-sm text-on-surface-variant truncate">{e.positionName}</p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">
                            {e.employeeCode}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary/10 text-secondary">
                            {e.state.replace(/_/g, ' ')}
                          </span>
                          {isHead && (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                              Head
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-on-surface/30 backdrop-blur-sm"
            aria-label="Close"
            onClick={() => setAddOpen(false)}
          />
          <div className="relative bv-surface executive-shadow w-full sm:max-w-md p-6 space-y-4 z-10 rounded-t-2xl sm:rounded-xl">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-title-lg font-semibold">Add Member</h3>
                <p className="text-body-sm text-on-surface-variant mt-1">Add to {d.name}</p>
              </div>
              <button
                type="button"
                className="p-1 rounded-lg hover:bg-surface-container"
                onClick={() => setAddOpen(false)}
              >
                <Icon name="close" />
              </button>
            </div>
            {mode === 'choose' && (
              <div className="grid gap-3">
                <button
                  type="button"
                  className="text-left p-4 rounded-xl border border-outline-variant hover:border-secondary"
                  onClick={() =>
                    navigate({
                      to: workforceRoutes.employeeNew,
                      search: { departmentId: String(id) } as never,
                    })
                  }
                >
                  <p className="font-semibold">Create new employee</p>
                </button>
                <button
                  type="button"
                  className="text-left p-4 rounded-xl border border-outline-variant hover:border-secondary"
                  onClick={() => void loadCandidates()}
                >
                  <p className="font-semibold">Add existing employee</p>
                </button>
              </div>
            )}
            {mode === 'existing' && (
              <div className="space-y-4">
                <SearchableSelect
                  label="Employee"
                  options={candidates}
                  value={selectedEmp}
                  onChange={setSelectedEmp}
                  placeholder="Search employees…"
                  emptyLabel="Everyone is already in this department"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setMode('choose')}>
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    disabled={!selectedEmp || isMutating}
                    onClick={() => void assignExisting()}
                  >
                    {isMutating ? 'Assigning…' : 'Assign to department'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {removeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
            aria-label="Close"
            onClick={() => setRemoveTarget(null)}
          />
          <div className="relative bv-surface executive-shadow w-full max-w-md p-6 space-y-4 z-10 rounded-xl">
            <h3 className="text-title-lg font-semibold">Remove from department?</h3>
            <p className="text-body-sm text-on-surface-variant">
              <strong>{removeTarget.name}</strong> will no longer be assigned to <strong>{d.name}</strong>.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setRemoveTarget(null)} disabled={isMutating}>
                Cancel
              </Button>
              <Button
                variant="primary"
                className="!bg-error !text-white"
                isLoading={isMutating}
                onClick={() => void confirmRemove()}
              >
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
