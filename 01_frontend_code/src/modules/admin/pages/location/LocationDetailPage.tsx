import { useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { BackButton } from '@/shared/components/layout/BackButton'
import { Button } from '@/shared/components/ui/Button'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { useEditMode } from '@/shared/hooks/useEditMode'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { useLocationDetail, useUpdateLocation } from '../../hooks/location/use-locations'
import { archiveLocation } from '../../api/organization'
import type { LocationRow } from '@/shared/schema'
import { ArchiveButton } from '@/shared/components/ui/ArchiveButton'

export function LocationDetailPage() {
  const { locationId } = useParams({ strict: false }) as { locationId: string }
  const navigate = useNavigate()
  const id = Number(locationId)
  const { data: loc, isLoading, isError, error, refetch } = useLocationDetail(id)
  const updateMut = useUpdateLocation(id)
  const { isEditing, startEditing, cancelEditing, finishEditing } = useEditMode(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const archiveMut = useMutation({
    mutationFn: archiveLocation,
    onSuccess: () => {
      setActionError(null)
      safeNavigate(navigate, { to: '/admin/settings/locations' })
    },
    onError: (e: unknown) => {
      setActionError(getApiErrorMessage(e, 'Could not archive location'))
    },
  })

  const handleArchive = () => {
    if (!loc) return
    setActionError(null)
    archiveMut.mutate(loc.id)
  }
  const [draft, setDraft] = useState<Partial<LocationRow>>({})

  const beginEdit = () => {
    if (!loc) return
    setDraft({ ...loc })
    setActionError(null)
    startEditing()
  }

  const onCancel = () => {
    setDraft({})
    setActionError(null)
    cancelEditing()
  }

  const save = () => {
    if (!loc) return
    setActionError(null)
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
        onSuccess: () => {
          setDraft({})
          finishEditing()
        },
        onError: (e: unknown) => {
          setActionError(getApiErrorMessage(e, 'Could not save location'))
        },
      },
    )
  }

  if (isLoading) return <PageLoadingSkeleton />
  if (isError || !loc) {
    return (
      <ErrorState
        description={getApiErrorMessage(error, 'Location not found')}
        onRetry={() => void refetch()}
        onBack={() => safeNavigate(navigate, { to: '/admin/settings/locations' })}
      />
    )
  }

  const display = isEditing ? { ...loc, ...draft } : loc

  const field = (label: string, key: keyof LocationRow, readOnly = false) => (
    <div>
      <p className="text-label-sm text-on-surface-variant mb-1">{label}</p>
      {isEditing && !readOnly ? (
        <input
          className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-sm outline-none focus:border-secondary"
          value={String(draft[key] ?? loc[key] ?? '')}
          onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
        />
      ) : (
        <p className="text-body-md font-medium text-on-background">{String(display[key] ?? '—')}</p>
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
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button variant="primary" onClick={save} isLoading={updateMut.isPending}>
              Save
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              leftIcon={<span className="material-symbols-outlined">edit</span>}
              onClick={beginEdit}
            >
              Edit
            </Button>
            <ArchiveButton
              entityLabel={loc?.name}
              mode="archive"
              onConfirm={handleArchive}
              disabled={updateMut.isPending || archiveMut.isPending}
              isLoading={archiveMut.isPending}
            />
          </div>
        )}
      </div>

      {actionError && (
        <div className="rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-body-sm text-error" role="alert">
          {actionError}
        </div>
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
