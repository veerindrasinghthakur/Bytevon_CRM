import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { SearchableSelect } from '@/shared/components/ui/SearchableSelect'
import { createDepartment, listEmploymentOptionsForPicker } from '../api/departments'
import { cn } from '@/shared/lib/cn'

function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn('material-symbols-outlined', className)} aria-hidden>
      {name}
    </span>
  )
}

const inputClass =
  'w-full px-4 py-3 rounded-lg border border-outline-variant text-body-md bg-transparent outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 transition-colors'

export function DepartmentCreatePage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active')
  const [headId, setHeadId] = useState('')
  const [headOptions, setHeadOptions] = useState<{ value: string; label: string; meta?: string }[]>(
    [],
  )
  const [saving, setSaving] = useState(false)
  const [nameError, setNameError] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    listEmploymentOptionsForPicker().then(setHeadOptions)
  }, [])

  const handleSave = async () => {
    if (!name.trim()) {
      setNameError(true)
      return
    }
    setNameError(false)
    setError('')
    setSaving(true)
    try {
      const created = await createDepartment({
        name,
        headEmploymentId: headId ? Number(headId) : null,
        isArchived: status === 'Inactive',
      })
      navigate({
        to: '/workforce/departments/$departmentId',
        params: { departmentId: String(created.id) },
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 pb-28 animate-fade-in">
      <button
        type="button"
        className="flex items-center gap-2 text-secondary text-label-md hover:underline"
        onClick={() => navigate({ to: '/workforce/departments' })}
      >
        <Icon name="arrow_back" className="text-lg" /> Back to Department List
      </button>
      <PageHeader
        title="Add New Department"
        description="Creates a department in the shared mock database — it will appear on the list immediately."
      />

      {error && (
        <div className="rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-body-sm text-error">
          {error}
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 bv-surface p-8">
          <div className="flex items-center gap-3 mb-6">
            <Icon name="info" className="text-secondary" />
            <h3 className="text-title-lg font-semibold">Department Information</h3>
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-label-md">
                Department Name <span className="text-error">*</span>
              </label>
              <input
                className={cn(inputClass, nameError && 'border-error bg-error-container/10')}
                placeholder="e.g. Engineering, Sales, Human Resources"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              {nameError && <p className="text-error text-xs">Department name is required</p>}
            </div>
            <p className="text-body-sm text-on-surface-variant">
              Code is auto-generated (DEPT-00N) after save.
            </p>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 bv-surface p-8">
          <div className="flex items-center gap-3 mb-6">
            <Icon name="manage_accounts" className="text-secondary" />
            <h3 className="text-title-lg font-semibold">Management</h3>
          </div>
          <div className="space-y-2">
            <label className="text-label-md">Department Head</label>
            <SearchableSelect
              options={headOptions}
              value={headId}
              onChange={setHeadId}
              placeholder="Type to search employees…"
            />
          </div>
        </div>

        <div className="col-span-12 bv-surface p-8">
          <label className="text-label-md block mb-4">Status</label>
          <div className="flex items-center gap-6">
            {(['Active', 'Inactive'] as const).map((s) => (
              <label key={s} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  checked={status === s}
                  onChange={() => setStatus(s)}
                  className="w-5 h-5 text-secondary"
                />
                <span className="text-body-md">{s}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 right-0 left-0 z-30 bg-surface-container-lowest/95 backdrop-blur-md border-t border-outline-variant py-4 px-6 flex justify-end gap-3 executive-shadow">
        <Button variant="outline" onClick={() => navigate({ to: '/workforce/departments' })}>
          Cancel
        </Button>
        <Button variant="primary" isLoading={saving} onClick={handleSave}>
          Save Department
        </Button>
      </div>
    </div>
  )
}
