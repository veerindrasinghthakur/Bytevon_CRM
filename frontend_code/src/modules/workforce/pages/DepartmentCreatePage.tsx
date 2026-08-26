import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { SearchableSelect } from '@/shared/components/ui/SearchableSelect'
import { BackButton } from '@/shared/components/layout/BackButton'
import { createDepartment, listEmploymentOptionsForPicker } from '../api/departments'
import { emptyDepartmentForm, toCreateDepartmentInput, type DepartmentFormInput } from '../types'
import { workforceRoutes } from '../routes'
import { safeNavigate } from '@/shared/lib/safeNavigate'
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
  const [form, setForm] = useState<DepartmentFormInput>(() => emptyDepartmentForm())
  const [headOptions, setHeadOptions] = useState<{ value: string; label: string; meta?: string }[]>(
    [],
  )
  const [saving, setSaving] = useState(false)
  const [nameError, setNameError] = useState(false)
  const [error, setError] = useState('')

  const setField = <K extends keyof DepartmentFormInput>(key: K, value: DepartmentFormInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  useEffect(() => {
    listEmploymentOptionsForPicker().then(setHeadOptions)
  }, [])

  const goList = () => safeNavigate(navigate, { to: workforceRoutes.departments })

  const handleSave = async () => {
    if (!form.name.trim()) {
      setNameError(true)
      return
    }
    setNameError(false)
    setError('')
    setSaving(true)
    try {
      const payload = toCreateDepartmentInput(form)
      const created = await createDepartment(payload)
      safeNavigate(navigate, {
        to: workforceRoutes.departmentDetail(created.id),
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
      <BackButton to={workforceRoutes.departments} label="Back to Department List" />
      <PageHeader
        title="Add New Department"
        description="Define identity, leadership, and operational settings for a new org unit."
      />

      {error && (
        <div className="rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-body-sm text-error">
          {error}
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 bv-surface p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-outline-variant pb-4">
            <span className="w-10 h-10 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
              <Icon name="badge" />
            </span>
            <div>
              <h3 className="text-title-lg font-semibold">Identity</h3>
              <p className="text-body-sm text-on-surface-variant">Name, description, and visual tag</p>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-label-md">
              Department Name <span className="text-error">*</span>
            </label>
            <input
              className={cn(inputClass, nameError && 'border-error bg-error-container/10')}
              placeholder="e.g. Engineering, Sales, Human Resources"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
            />
            {nameError && <p className="text-error text-xs">Department name is required</p>}
          </div>
          <div className="space-y-2">
            <label className="text-label-md">Description</label>
            <textarea
              className={cn(inputClass, 'resize-none')}
              rows={3}
              placeholder="Short mission or scope for this department…"
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
            />
            <p className="text-xs text-on-surface-variant">UI field; persist when department schema supports description.</p>
          </div>
          <div className="space-y-2">
            <label className="text-label-md">Color tag</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.colorTag || '#0058bc'}
                onChange={(e) => setField('colorTag', e.target.value)}
                className="w-12 h-12 rounded-lg border border-outline-variant cursor-pointer"
              />
              <input
                className={inputClass}
                value={form.colorTag}
                onChange={(e) => setField('colorTag', e.target.value)}
              />
            </div>
          </div>
          <p className="text-body-sm text-on-surface-variant">
            Code is auto-generated (DEPT-00N) after save.
          </p>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bv-surface p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-outline-variant pb-4">
              <span className="w-10 h-10 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
                <Icon name="tune" />
              </span>
              <div>
                <h3 className="text-title-lg font-semibold">Settings</h3>
                <p className="text-body-sm text-on-surface-variant">Leadership & status</p>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-label-md">Department Head</label>
              <SearchableSelect
                options={headOptions}
                value={form.headEmploymentId}
                onChange={(v) => setField('headEmploymentId', v)}
                placeholder="Type to search employees…"
              />
            </div>
            <div className="space-y-2">
              <label className="text-label-md">Parent department (optional)</label>
              <input
                className={inputClass}
                value={form.parentHint}
                onChange={(e) => setField('parentHint', e.target.value)}
                placeholder="UI only until hierarchy is wired"
              />
            </div>
            <div>
              <label className="text-label-md block mb-3">Status</label>
              <div className="flex flex-col gap-3">
                {(['Active', 'Inactive'] as const).map((s) => (
                  <label
                    key={s}
                    className={cn(
                      'flex items-center gap-3 cursor-pointer p-3 rounded-lg border transition-colors',
                      form.status === s ? 'border-secondary bg-secondary/5' : 'border-outline-variant',
                    )}
                  >
                    <input
                      type="radio"
                      name="status"
                      checked={form.status === s}
                      onChange={() => setField('status', s)}
                      className="w-4 h-4 text-secondary"
                    />
                    <span className="text-body-md">{s}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 right-0 left-0 z-30 bg-surface-container-lowest/95 backdrop-blur-md border-t border-outline-variant py-4 px-6 flex justify-end gap-3 executive-shadow">
        <Button variant="outline" onClick={goList}>
          Cancel
        </Button>
        <Button variant="primary" isLoading={saving} onClick={handleSave}>
          Save Department
        </Button>
      </div>
    </div>
  )
}
