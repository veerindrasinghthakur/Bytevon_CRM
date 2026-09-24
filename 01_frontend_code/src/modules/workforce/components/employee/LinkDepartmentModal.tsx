import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/shared/components/ui/Button'
import { EntitySearch, type EntityOption } from '@/shared/components/forms/EntitySearch'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { queryKeys } from '@/shared/lib/query-keys'
import { listDepartments } from '../../api/departments'
import { createEmploymentAssignment } from '../../api/employment'

/**
 * Popup to search and select a department, then link it to the employment
 * via a new employment assignment (backend POST
 * /workforce/employments/{id}/assignments).
 */
export function LinkDepartmentModal({
  open,
  employmentId,
  onClose,
  onLinked,
}: {
  open: boolean
  employmentId: number
  onClose: () => void
  onLinked: () => void
}) {
  const [selected, setSelected] = useState<EntityOption | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const departmentsQuery = useQuery({
    queryKey: queryKeys.workforce.departments.list({ includeArchived: false }),
    queryFn: () => listDepartments({ includeArchived: false, page: 1, pageSize: 200 }),
    enabled: open,
    staleTime: 60_000,
  })

  const options: EntityOption[] = useMemo(
    () =>
      (departmentsQuery.data?.items ?? []).map((d) => ({
        id: d.id,
        label: d.name,
        sublabel: [d.code, d.headName ? `Head: ${d.headName}` : 'No head']
          .filter(Boolean)
          .join(' · '),
      })),
    [departmentsQuery.data],
  )

  if (!open) return null

  const submit = async () => {
    setFormError(null)
    if (!selected) {
      setFormError('Select a department first.')
      return
    }
    setSaving(true)
    try {
      await createEmploymentAssignment(employmentId, {
        departmentId: Number(selected.id),
        changeReason: 'Department linked from employee profile',
      })
      setSelected(null)
      onLinked()
      onClose()
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Could not link department'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal
        className="relative z-10 w-full max-w-md bv-surface executive-shadow border border-outline-variant p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-title-lg font-semibold">Link department</h2>
            <p className="text-body-sm text-on-surface-variant">
              Search and select a department for this employee.
            </p>
          </div>
          <button
            type="button"
            className="p-2 rounded-full hover:bg-surface-container"
            onClick={onClose}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <EntitySearch
          label="Department *"
          placeholder={departmentsQuery.isLoading ? 'Loading departments…' : 'Search departments…'}
          options={options}
          value={selected}
          onChange={setSelected}
          disabled={departmentsQuery.isLoading}
          emptyMessage={
            departmentsQuery.isError ? 'Failed to load departments' : 'No departments match'
          }
        />
        {departmentsQuery.isError && (
          <p className="text-body-sm text-error">
            {getApiErrorMessage(departmentsQuery.error, 'Could not load departments')}
          </p>
        )}
        {formError && (
          <p className="text-body-sm text-error" role="alert">
            {formError}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={!selected || saving}
            isLoading={saving}
            onClick={() => void submit()}
          >
            Link department
          </Button>
        </div>
      </div>
    </div>
  )
}
