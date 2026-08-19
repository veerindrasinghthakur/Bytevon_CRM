import { useEffect, useState } from 'react'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import {
  getLocations,
  getOrganizationSettings,
  updateOrganizationSettings,
} from '../api/organization'
import type { LocationRow, OrganizationSettings } from '@/shared/schema'

export function OrganizationSettingsPage() {
  const [settings, setSettings] = useState<OrganizationSettings | null>(null)
  const [locations, setLocations] = useState<LocationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Partial<OrganizationSettings>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([getOrganizationSettings(), getLocations()])
      .then(([s, l]) => {
        setSettings(s)
        setDraft(s)
        setLocations(l.items)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      const next = await updateOrganizationSettings({
        company_name: draft.company_name,
        head_office_location_id: draft.head_office_location_id,
        default_timezone: draft.default_timezone,
        default_currency: draft.default_currency,
      })
      setSettings(next)
      setDraft(next)
      setEditing(false)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageLoadingSkeleton />
  if (error || !settings) return <ErrorState description={error ?? 'Missing settings'} />

  const head =
    locations.find((l) => l.id === settings.head_office_location_id)?.name ??
    `Location #${settings.head_office_location_id}`

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organization settings"
        description="Singleton organization profile"
        actions={
          editing ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setEditing(false); setDraft(settings) }}>
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
          )
        }
      />

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm space-y-5 max-w-2xl card-hover">
        <Field
          label="Company name"
          editing={editing}
          value={String(draft.company_name ?? '')}
          display={settings.company_name}
          onChange={(v) => setDraft((d) => ({ ...d, company_name: v }))}
        />
        <div>
          <p className="text-label-sm text-on-surface-variant mb-1">Head office</p>
          {editing ? (
            <select
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-sm"
              value={draft.head_office_location_id ?? ''}
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
          editing={editing}
          value={String(draft.default_timezone ?? '')}
          display={settings.default_timezone}
          onChange={(v) => setDraft((d) => ({ ...d, default_timezone: v }))}
        />
        <Field
          label="Default currency"
          editing={editing}
          value={String(draft.default_currency ?? '')}
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
