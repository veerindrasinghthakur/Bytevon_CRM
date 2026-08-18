import { useEffect, useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { BackButton } from '@/shared/components/layout/BackButton'
import { Button } from '@/shared/components/ui/Button'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { getLocation, updateLocation } from '../api/organization'
import type { LocationRow } from '@/shared/schema'

export function LocationDetailPage() {
  const { locationId } = useParams({ strict: false }) as { locationId: string }
  const navigate = useNavigate()
  const id = Number(locationId)
  const [loc, setLoc] = useState<LocationRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Partial<LocationRow>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setLoading(true)
    getLocation(id)
      .then((r) => {
        setLoc(r)
        if (r) setDraft(r)
        if (!r) setError('Location not found')
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  const save = async () => {
    if (!loc) return
    setSaving(true)
    try {
      const next = await updateLocation(loc.id, {
        name: draft.name,
        address: draft.address,
        city: draft.city,
        state: draft.state,
        country: draft.country,
        timezone: draft.timezone,
        currency: draft.currency,
        attendance_radius_meters: draft.attendance_radius_meters,
      })
      setLoc(next)
      setDraft(next)
      setEditing(false)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageLoadingSkeleton />
  if (error || !loc) {
    return (
      <ErrorState
        description={error ?? 'Not found'}
        onBack={() => navigate({ to: '/admin/settings/locations' })}
      />
    )
  }

  const field = (label: string, key: keyof LocationRow, readOnly = false) => (
    <div>
      <p className="text-label-sm text-on-surface-variant mb-1">{label}</p>
      {editing && !readOnly ? (
        <input
          className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-sm"
          value={String(draft[key] ?? '')}
          onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
        />
      ) : (
        <p className="text-body-md font-medium text-on-background">{String(loc[key] ?? '—')}</p>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <BackButton to="/admin/settings/locations" label="Back to locations" />
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h2 className="text-title-lg font-semibold text-on-background">{loc.name}</h2>
          <p className="text-body-sm text-on-surface-variant mt-0.5">
            {loc.city}, {loc.country} · {loc.timezone}
          </p>
        </div>
        {editing ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setEditing(false); setDraft(loc) }}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => void save()} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        ) : (
          <Button
            variant="primary"
            leftIcon={<span className="material-symbols-outlined text-lg">edit</span>}
            onClick={() => setEditing(true)}
          >
            Edit
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm space-y-4 card-hover">
          <h3 className="text-title-md font-semibold text-on-background">Address</h3>
          {field('Name', 'name')}
          {field('Address', 'address')}
          {field('City', 'city')}
          {field('State', 'state')}
          {field('Country', 'country')}
        </div>
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm space-y-4 card-hover">
          <h3 className="text-title-md font-semibold text-on-background">Operations</h3>
          {field('Timezone', 'timezone')}
          {field('Currency', 'currency')}
          {field('Attendance radius (m)', 'attendance_radius_meters')}
          {field('Fiscal year start month', 'fiscal_year_start_month', true)}
          <div>
            <p className="text-label-sm text-on-surface-variant mb-1">Allowed IP CIDRs</p>
            <p className="text-body-sm font-mono">{loc.allowed_ip_cidrs.join(', ') || '—'}</p>
          </div>
          <div>
            <p className="text-label-sm text-on-surface-variant mb-1">Geo</p>
            <p className="text-body-sm">
              {loc.latitude}, {loc.longitude}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
