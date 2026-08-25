import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/shared/components/ui/Button'
import { useEditMode } from '@/shared/hooks/useEditMode'
import { cn } from '@/shared/lib/cn'
import { getOrganizationProfile, updateOrganizationProfile } from '../../api/settings'
import type { OrganizationProfile } from '../../types'

const emptyForm: OrganizationProfile = {
  name: '',
  legal: '',
  email: '',
  phone: '',
  website: '',
  tax: '',
  reg: '',
  description: '',
}

export function OrganizationProfileSection() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'settings', 'organization-profile'],
    queryFn: getOrganizationProfile,
  })

  const { isEditing, startEditing, cancelEditing, finishEditing } = useEditMode(false)
  const [form, setForm] = useState<OrganizationProfile>(emptyForm)

  useEffect(() => {
    if (data && !isEditing) setForm({ ...data })
  }, [data, isEditing])

  const save = useMutation({
    mutationFn: () => updateOrganizationProfile(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'settings', 'organization-profile'] })
      finishEditing()
    },
  })

  const set = (k: keyof OrganizationProfile, v: string) => setForm((p) => ({ ...p, [k]: v }))

  if (isLoading) {
    return <p className="text-body-sm text-on-surface-variant">Loading organization profile…</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-title-lg font-semibold text-on-background">Organization Information</h2>
          <p className="text-body-sm text-on-surface-variant mt-0.5">
            Primary organization identity. Fields unlock when you enter edit mode.
          </p>
        </div>
        {isEditing ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (data) setForm({ ...data })
                cancelEditing()
              }}
              disabled={save.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={save.isPending}
              onClick={() => save.mutate()}
            >
              Save Changes
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={startEditing}
            className="p-2 rounded-lg border border-outline-variant text-on-surface-variant hover:text-secondary hover:border-secondary transition-colors duration-200 cursor-pointer"
            aria-label="Edit organization"
            title="Edit"
          >
            <span className="material-symbols-outlined text-[22px]">edit</span>
          </button>
        )}
      </div>

      {/* Permanent form boundary — always visible in view and edit modes */}
      <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="shrink-0 space-y-3">
            <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">Logo</p>
            <div className="w-28 h-28 rounded-xl bg-surface-container-low flex items-center justify-center border border-dashed border-outline-variant">
              <span className="material-symbols-outlined text-4xl text-outline">image</span>
            </div>
            {isEditing && (
              <button type="button" className="text-xs font-medium text-secondary hover:underline cursor-pointer">
                Upload Logo
              </button>
            )}
          </div>

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
            <Field label="Organization Name" value={form.name} editing={isEditing} onChange={(v) => set('name', v)} />
            <Field label="Legal Name" value={form.legal} editing={isEditing} onChange={(v) => set('legal', v)} />
            <Field label="Email" value={form.email} editing={isEditing} onChange={(v) => set('email', v)} />
            <Field label="Phone" value={form.phone} editing={isEditing} onChange={(v) => set('phone', v)} />
            <Field label="Website" value={form.website} editing={isEditing} onChange={(v) => set('website', v)} />
            <Field label="Tax ID" value={form.tax} editing={isEditing} onChange={(v) => set('tax', v)} />
            <Field label="Registration No." value={form.reg} editing={isEditing} onChange={(v) => set('reg', v)} />
            <div className="sm:col-span-2">
              <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Description</p>
              {isEditing ? (
                <textarea
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  className="w-full min-h-[88px] rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-sm outline-none focus:border-secondary"
                />
              ) : (
                <p className="text-body-md text-on-background">{form.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  editing,
  onChange,
}: {
  label: string
  value: string
  editing: boolean
  onChange: (v: string) => void
}) {
  return (
    <div>
      <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">{label}</p>
      {editing ? (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-sm outline-none focus:border-secondary"
        />
      ) : (
        <p className={cn('text-body-md font-medium text-on-background')}>{value || '—'}</p>
      )}
    </div>
  )
}
