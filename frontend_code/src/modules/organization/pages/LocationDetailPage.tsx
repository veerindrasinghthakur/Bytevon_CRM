import { useEffect, useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { BackButton } from '@/shared/components/layout/BackButton'
import { Button } from '@/shared/components/ui/Button'
import { EditButton } from '@/shared/components/ui/EditButton'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { useEditMode } from '@/shared/hooks/useEditMode'
import { useLocationDetail, useUpdateLocation } from '../hooks/use-locations'
import type { LocationRow } from '@/shared/schema'

export function LocationDetailPage() {
  const { locationId } = useParams({ strict: false }) as { locationId: string }
  const navigate = useNavigate()
  const id = Number(locationId)
  const { data: loc, isLoading, isError, error, refetch } = useLocationDetail(id)
  const updateMut = useUpdateLocation(id)
  const { isEditing, startEditing, cancelEditing, finishEditing } = useEditMode(false)
  const [draft, setDraft] = useState<Partial<LocationRow>>({})

  useEffect(() => {
    if (loc) setDraft(loc)
  }, [loc])

  const save = () => {
    if (!loc) return
    updateMut.mutate(
      {
        name: draft.name,
        address: draft.address,
        city: draft.city,
        state: draft.state,
        country: draft.country,
        timezone: draft.timezone,
        currency: draft.currency,
        attendance_radius_meters: draft.attendance_radius_meters,
      },
      {
        onSuccess: () => finishEditing(),
      },
    )
  }

  if (isLoading) return <PageLoadingSkeleton />
  if (isError || !loc) {
    return (
      <ErrorState
        description={(error as Error)?.message ?? 'Location not found'}
        onRetry={() => void refetch()}
        onBack={() => navigate({ to: '/admin/settings/locations' })}
      />
    )
  }

  const field = (label: string, key: keyof LocationRow, readOnly = false) => (
    <div>
      <p className="text-label-sm text-on-surface-variant mb-1">{label}</p>
      {isEditing && !readOnly ? (
        <input
          className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-sm outline-none focus:border-secondary"
          value={String(draft[key] ?? '')}
          onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
        />
      ) : (
        <p className="text-body-md font-medium text-on-background">{String(loc[key] ?? '—')}</p>
      )}
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <BackButton to="/admin/settings/locations" label="Back to locations" />
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h2 className="text-title-lg font-semibold text-on-background">{loc.name}</h2>
          <p className="text-body-sm text-on-surface-variant mt-0.5">
            {loc.city}, {loc.country} · {loc.timezone}
          </p>
        </div>
        {isEditing ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDraft(loc)
                cancelEditing()
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={save} isLoading={updateMut.isPending}>
              Save
            </Button>
          </div>
        ) : (
          <EditButton variant="primary" onClick={startEditing} />
        )}
      </div>

      {updateMut.isError && (
        <p className="text-body-sm text-error">{(updateMut.error as Error).message}</p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bv-surface p-6 space-y-4">
          <h3 className="text-title-md font-semibold text-on-background">Address</h3>
          {field('Name', 'name')}
          {field('Address', 'address')}
          {field('City', 'city')}
          {field('State', 'state')}
          {field('Country', 'country')}
        </div>
        <div className="bv-surface p-6 space-y-4">
          <h3 className="text-title-md font-semibold text-on-background">Operations</h3>
          {field('Timezone', 'timezone')}
          {field('Currency', 'currency')}
          {field('Attendance radius (m)', 'attendance_radius_meters')}
          {field('Fiscal year start month', 'fiscal_year_start_month', true)}
          <div>
            <p className="text-label-sm text-on-surface-variant mb-1">Allowed IP CIDRs</p>
            <p className="text-body-sm font-mono">{loc.allowed_ip_cidrs?.join(', ') || '—'}</p>
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
