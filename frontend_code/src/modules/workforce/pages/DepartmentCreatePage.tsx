import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { SearchableSelect } from '@/shared/components/ui/SearchableSelect'
import { BackButton } from '@/shared/components/layout/BackButton'
import { createDepartment, listEmploymentOptionsForPicker } from '../api/departments'
import {
  departmentFormSchema,
  emptyDepartmentForm,
  toCreateDepartmentInput,
  type DepartmentFormInput,
} from '../types'
import { workforceRoutes } from '../routes'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { cn } from '@/shared/lib/cn'
import { DEPARTMENT_STATUS_OPTIONS } from '../schemas/enums'

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
  const [headOptions, setHeadOptions] = useState<{ value: string; label: string; meta?: string }[]>(
    [],
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const form = useForm<DepartmentFormInput>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: emptyDepartmentForm(),
  })

  useEffect(() => {
    listEmploymentOptionsForPicker().then(setHeadOptions)
  }, [])

  const goList = () => safeNavigate(navigate, { to: workforceRoutes.departments })

  const onSubmit = form.handleSubmit(async (values) => {
    setError('')
    setSaving(true)
    try {
      const payload = toCreateDepartmentInput(values)
      const created = await createDepartment(payload)
      safeNavigate(navigate, {
        to: workforceRoutes.departmentDetailPath,
        params: { departmentId: String(created.id) },
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  })

  const status = form.watch('status')

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

      <form onSubmit={onSubmit}>
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
              <label className="text-label-md" htmlFor="dept-name">
                Department Name <span className="text-error">*</span>
              </label>
              <input
                id="dept-name"
                className={cn(inputClass, form.formState.errors.name && 'border-error bg-error-container/10')}
                placeholder="e.g. Engineering, Sales, Human Resources"
                {...form.register('name')}
              />
              {form.formState.errors.name && (
                <p className="text-error text-xs">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-label-md" htmlFor="dept-desc">Description</label>
              <textarea
                id="dept-desc"
                className={cn(inputClass, 'resize-none')}
                rows={3}
                placeholder="Short mission or scope for this department…"
                {...form.register('description')}
              />
              <p className="text-xs text-on-surface-variant">UI field; persist when department schema supports description.</p>
            </div>
            <div className="space-y-2">
              <label className="text-label-md">Color tag</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.watch('colorTag') || '#0058bc'}
                  onChange={(e) => form.setValue('colorTag', e.target.value)}
                  className="w-12 h-12 rounded-lg border border-outline-variant cursor-pointer"
                />
                <input className={inputClass} {...form.register('colorTag')} />
              </div>
            </div>
            <p className="text-body-sm text-on-surface-variant">Code is auto-generated (DEPT-00N) after save.</p>
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
                  value={form.watch('headEmploymentId') ?? ''}
                  onChange={(v) => form.setValue('headEmploymentId', v)}
                  placeholder="Type to search employees…"
                />
              </div>
              <div className="space-y-2">
                <label className="text-label-md" htmlFor="parent-hint">Parent department (optional)</label>
                <input
                  id="parent-hint"
                  className={inputClass}
                  placeholder="UI only until hierarchy is wired"
                  {...form.register('parentHint')}
                />
              </div>
              <div>
                <label className="text-label-md block mb-3">Status</label>
                <div className="flex flex-col gap-3">
                  {DEPARTMENT_STATUS_OPTIONS.map(({ value: s }) => (
                    <label
                      key={s}
                      className={cn(
                        'flex items-center gap-3 cursor-pointer p-3 rounded-lg border transition-colors',
                        status === s ? 'border-secondary bg-secondary/5' : 'border-outline-variant',
                      )}
                    >
                      <input
                        type="radio"
                        name="status"
                        checked={status === s}
                        onChange={() => form.setValue('status', s)}
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
          <Button type="button" variant="outline" onClick={goList}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={saving}>
            Save Department
          </Button>
        </div>
      </form>
    </div>
  )
}
