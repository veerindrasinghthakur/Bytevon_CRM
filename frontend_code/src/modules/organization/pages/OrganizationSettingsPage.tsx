import { useState } from 'react'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { EditButton } from '@/shared/components/ui/EditButton'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { useEditMode } from '@/shared/hooks/useEditMode'
import {
  useOrganizationSettings,
  useOrgLocationsForSelect,
  useUpdateOrganizationSettings,
} from '../hooks/use-organization'
import type { OrganizationSettings } from '@/shared/schema'

export function OrganizationSettingsPage() {
  const settingsQ = useOrganizationSettings()
  const locationsQ = useOrgLocationsForSelect()
  const updateMut = useUpdateOrganizationSettings()
  const { isEditing, startEditing, cancelEditing, finishEditing } = useEditMode(false)
  // Client form draft only — set on beginEdit, cleared on cancel/save. Server data stays in Query.
  const [draft, setDraft] = useState<Partial<OrganizationSettings>>({})

  const settings = settingsQ.data
  const locations = locationsQ.data?.items ?? []

  if (settingsQ.isLoading || locationsQ.isLoading) return <PageLoadingSkeleton />
  if (settingsQ.isError || !settings) {
    return (
      <ErrorState
        description={(settingsQ.error as Error)?.message ?? 'Missing settings'}
        onRetry={() => void settingsQ.refetch()}
      />
    )
  }

  const beginEdit = () => {
    setDraft({ ...settings })
    startEditing()
  }

  const onCancel = () => {
    setDraft({})
    cancelEditing()
  }

  const head =
    locations.find((l) => l.id === settings.head_office_location_id)?.name ??
    `Location #${settings.head_office_location_id}`

  const save = () => {
    updateMut.mutate(
      {
        company_name: draft.company_name,
        head_office_location_id: draft.head_office_location_id,
        default_timezone: draft.default_timezone,
        default_currency: draft.default_currency,
      },
      {
        onSuccess: () => {
          setDraft({})
          finishEditing()
        },
      },
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Organization settings"
        description="Singleton organization profile"
        actions={
          isEditing ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button variant="primary" onClick={save} isLoading={updateMut.isPending}>
                Save
              </Button>
            </div>
          ) : (
            <EditButton variant="primary" onClick={beginEdit} />
          )
        }
      />

      {updateMut.isError && (
        <p className="text-body-sm text-error">{(updateMut.error as Error).message}</p>
      )}

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm space-y-5 max-w-2xl card-hover">
        <Field
          label="Company name"
          editing={isEditing}
          value={String(draft.company_name ?? settings.company_name ?? '')}
          display={settings.company_name}
          onChange={(v) => setDraft((d) => ({ ...d, company_name: v }))}
        />
        <div>
          <p className="text-label-sm text-on-surface-variant mb-1">Head office</p>
          {isEditing ? (
            <select
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-sm"
              value={draft.head_office_location_id ?? settings.head_office_location_id ?? ''}
              onChange={(e) =>
                setDraft((d) => ({ ...d, head_office_location_id: Number(e.target.value) }))
              }
            >
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          ) : (
            <p className="font-medium">{head}</p>
          )}
        </div>
        <Field
          label="Default timezone"
          editing={isEditing}
          value={String(draft.default_timezone ?? settings.default_timezone ?? '')}
          display={settings.default_timezone}
          onChange={(v) => setDraft((d) => ({ ...d, default_timezone: v }))}
        />
        <Field
          label="Default currency"
          editing={isEditing}
          value={String(draft.default_currency ?? settings.default_currency ?? '')}
          display={settings.default_currency}
          onChange={(v) => setDraft((d) => ({ ...d, default_currency: v }))}
        />
      </div>
    </div>
  )
}

function Field({
  label,
  editing,
  value,
  display,
  onChange,
}: {
  label: string
  editing: boolean
  value: string
  display: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <p className="text-label-sm text-on-surface-variant mb-1">{label}</p>
      {editing ? (
        <input
          className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-sm"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <p className="font-medium text-on-background">{display}</p>
      )}
    </div>
  )
}
