import { useEffect, useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { BackButton } from '@/shared/components/layout/BackButton'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { getSchemaDepartments, getLocations, getPositions, getShifts } from '@/modules/admin'
import { WorkMode } from '@/shared/schema'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { workforceRoutes } from '../routes'

export function ChangeAssignmentPage() {
  const { employeeId } = useParams({ strict: false }) as { employeeId: string }
  const navigate = useNavigate()
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([])
  const [positions, setPositions] = useState<{ id: number; name: string }[]>([])
  const [locations, setLocations] = useState<{ id: number; name: string }[]>([])
  const [shifts, setShifts] = useState<{ id: number; name: string }[]>([])
  const [form, setForm] = useState({
    department_id: 1,
    position_id: 1,
    location_id: 1,
    shift_id: 1,
    work_mode: WorkMode.OFFICE as string,
    effective_from: new Date().toISOString().slice(0, 10),
    change_reason: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    void Promise.all([getSchemaDepartments(), getPositions(), getLocations(), getShifts()]).then(
      ([d, p, l, s]) => {
        setDepartments(d.items)
        setPositions(p.items)
        setLocations(l.items)
        setShifts(s.items)
      },
    )
  }, [])

  const submit = async () => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 400))
    setSaving(false)
    safeNavigate(navigate, {
      to: workforceRoutes.employeeDetailPath,
      params: { employeeId },
    })
  }

  const select = (
    label: string,
    key: 'department_id' | 'position_id' | 'location_id' | 'shift_id',
    options: { id: number; name: string }[],
  ) => (
    <div>
      <label className="text-label-sm text-on-surface-variant mb-1 block">{label}</label>
      <select
        className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-body-sm focus:ring-2 focus:ring-secondary/30 focus:border-secondary outline-none transition-colors"
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: Number(e.target.value) }))}
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    </div>
  )

  return (
    <div className="space-y-6 max-w-xl animate-fade-in">
      <BackButton to={workforceRoutes.employeeDetail(employeeId)} label="Back to employee" />
      <PageHeader
        title="Change assignment"
        description="Creates a new employment_assignments row and closes the previous effective_to"
      />
      <div className="bv-surface p-6 space-y-4">
        {select('Department', 'department_id', departments)}
        {select('Position', 'position_id', positions)}
        {select('Location', 'location_id', locations)}
        {select('Shift', 'shift_id', shifts)}
        <div>
          <label className="text-label-sm text-on-surface-variant mb-1 block">Work mode</label>
          <select
            className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-body-sm focus:ring-2 focus:ring-secondary/30 outline-none transition-colors"
            value={form.work_mode}
            onChange={(e) => setForm((f) => ({ ...f, work_mode: e.target.value }))}
          >
            <option value={WorkMode.OFFICE}>OFFICE</option>
            <option value={WorkMode.WFH}>WFH</option>
          </select>
        </div>
        <div>
          <label className="text-label-sm text-on-surface-variant mb-1 block">Effective from</label>
          <input
            type="date"
            className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-body-sm focus:ring-2 focus:ring-secondary/30 outline-none transition-colors"
            value={form.effective_from}
            onChange={(e) => setForm((f) => ({ ...f, effective_from: e.target.value }))}
          />
        </div>
        <div>
          <label className="text-label-sm text-on-surface-variant mb-1 block">Change reason</label>
          <input
            className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-body-sm focus:ring-2 focus:ring-secondary/30 outline-none transition-colors"
            value={form.change_reason}
            onChange={(e) => setForm((f) => ({ ...f, change_reason: e.target.value }))}
            placeholder="Promotion, transfer, relocation…"
          />
        </div>
        <Button variant="primary" onClick={() => void submit()} disabled={saving || !form.change_reason}>
          {saving ? 'Saving…' : 'Save assignment'}
        </Button>
      </div>
    </div>
  )
}
