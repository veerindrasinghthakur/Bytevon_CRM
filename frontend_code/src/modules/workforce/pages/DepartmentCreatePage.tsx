import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { departments, employees } from '../data/mock'
import { cn } from '@/shared/lib/cn'

function Icon({ name, className }: { name: string; className?: string }) {
  return <span className={cn('material-symbols-outlined', className)} aria-hidden>{name}</span>
}

const COLORS = ['#0059bb', '#ba1a1a', '#001a41', '#444749', '#0070ea']
const inputClass =
  'w-full px-4 py-3 rounded-lg border border-outline-variant text-body-md bg-transparent outline-none focus:border-secondary'

export function DepartmentCreatePage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active')
  const [color, setColor] = useState(COLORS[0])
  const [saving, setSaving] = useState(false)
  const [nameError, setNameError] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) {
      setNameError(true)
      return
    }
    setNameError(false)
    setSaving(true)
    await new Promise((r) => setTimeout(r, 800))
    setSaving(false)
    navigate({ to: '/workforce/departments' })
  }

  return (
    <div className="space-y-6 pb-28">
      <button
        type="button"
        className="flex items-center gap-2 text-secondary text-label-md hover:underline"
        onClick={() => navigate({ to: '/workforce/departments' })}
      >
        <Icon name="arrow_back" className="text-lg" /> Back to Department List
      </button>
      <PageHeader
        title="Add New Department"
        description="Configure your organization&apos;s structural units and reporting lines."
      />

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Icon name="info" className="text-secondary" />
            <h3 className="text-title-lg font-semibold">Department Information</h3>
          </div>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-label-md">Department Name <span className="text-error">*</span></label>
                <input
                  className={cn(inputClass, nameError && 'border-error bg-error-container/10')}
                  placeholder="e.g. Engineering, Sales, Human Resources"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                {nameError && <p className="text-error text-xs">Department name is required</p>}
              </div>
              <div className="space-y-2">
                <label className="text-label-md">Department Code <span className="text-error">*</span></label>
                <input className={inputClass} placeholder="e.g. DEPT-001" value={code} onChange={(e) => setCode(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-label-md">Description</label>
              <textarea className={cn(inputClass, 'resize-none')} rows={4} placeholder="Briefly describe the purpose and scope of this department..." />
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Icon name="manage_accounts" className="text-secondary" />
            <h3 className="text-title-lg font-semibold">Management</h3>
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-label-md">Department Head</label>
              <select className={inputClass} defaultValue="">
                <option value="" disabled>Search for head...</option>
                {employees.slice(0, 5).map((e) => (
                  <option key={e.id}>{e.name} (ID: {e.employeeCode})</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-label-md">Parent Department</label>
              <select className={inputClass} defaultValue="none">
                <option value="none">None (Top Level)</option>
                {departments.map((d) => (
                  <option key={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="col-span-12 bg-surface-container-lowest border border-outline-variant rounded-xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Icon name="settings" className="text-secondary" />
            <h3 className="text-title-lg font-semibold">Settings &amp; Identity</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <label className="text-label-md block">Status</label>
              <div className="flex items-center gap-6">
                {(['Active', 'Inactive'] as const).map((s) => (
                  <label key={s} className="flex items-center gap-3 cursor-pointer">
                    <input type="radio" name="status" checked={status === s} onChange={() => setStatus(s)} className="w-5 h-5 text-secondary" />
                    <span className="text-body-md">{s}</span>
                  </label>
                ))}
              </div>
              <p className="text-body-sm text-on-surface-variant opacity-70">Inactive departments are hidden from active resource allocation views.</p>
            </div>
            <div className="space-y-4">
              <label className="text-label-md block">Department Color Tag</label>
              <div className="flex flex-wrap gap-3">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={cn('w-10 h-10 rounded-lg transition-all', color === c && 'ring-2 ring-offset-2 ring-secondary')}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                    aria-label={c}
                  />
                ))}
                <button type="button" className="w-10 h-10 rounded-lg border-2 border-dashed border-outline-variant flex items-center justify-center">
                  <Icon name="add" className="text-on-surface-variant" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 right-0 left-0 z-30 bg-surface-container-lowest border-t border-outline-variant py-4 px-6 flex justify-between items-center shadow-2xl">
        <p className="text-body-sm text-on-surface-variant flex items-center gap-2">
          <Icon name="verified" className="text-base" /> All changes will be logged to system audit
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate({ to: '/workforce/departments' })}>Cancel</Button>
          <Button variant="outline">Save Draft</Button>
          <Button variant="primary" isLoading={saving} onClick={handleSave}>Save Department</Button>
        </div>
      </div>
    </div>
  )
}
