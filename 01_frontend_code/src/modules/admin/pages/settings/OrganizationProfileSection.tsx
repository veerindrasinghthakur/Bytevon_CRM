import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm, type UseFormRegisterReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/shared/components/ui/Button'
import { EditButton } from '@/shared/components/ui/EditButton'
import { useEditMode } from '@/shared/hooks/useEditMode'
import { cn } from '@/shared/lib/cn'
import { getOrganizationProfile, updateOrganizationProfile } from '../../api/settings'
import { queryKeys } from '@/shared/lib/query-keys'
import { organizationProfileSchema, type OrganizationProfileInput } from '../../schemas/settings'

/** Extended form values: schema fields + backend settings that persist. */
type ProfileFormValues = OrganizationProfileInput & {
  defaultTimezone?: string
  defaultCurrency?: string
}

export function OrganizationProfileSection() {
  const qc = useQueryClient()
  const { data, isLoading, isError, error } = useQuery({
    queryKey: queryKeys.admin.settings.all,
    queryFn: getOrganizationProfile,
  })

  const { isEditing, startEditing, cancelEditing, finishEditing } = useEditMode(false)

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(organizationProfileSchema),
    defaultValues: {
      name: '',
      legal: '',
      email: '',
      phone: '',
      website: '',
      tax: '',
      reg: '',
      description: '',
      defaultTimezone: '',
      defaultCurrency: '',
    },
  })

  useEffect(() => {
    if (data && !isEditing) {
      form.reset({
        name: data.name ?? '',
        legal: data.legal ?? '',
        email: data.email ?? '',
        phone: data.phone ?? '',
        website: data.website ?? '',
        tax: data.tax ?? '',
        reg: data.reg ?? '',
        description: data.description ?? '',
        defaultTimezone: data.defaultTimezone ?? '',
        defaultCurrency: data.defaultCurrency ?? '',
      })
    }
  }, [data, isEditing, form])

  const save = useMutation({
    mutationFn: () => {
      const values = form.getValues()
      return updateOrganizationProfile({
        name: values.name,
        legal: values.legal,
        email: values.email,
        phone: values.phone,
        website: values.website,
        tax: values.tax,
        reg: values.reg,
        description: values.description,
        defaultTimezone: values.defaultTimezone,
        defaultCurrency: values.defaultCurrency,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.settings.all })
      finishEditing()
    },
  })

  const formValues = form.watch()

  if (isLoading) {
    return <p className="text-body-sm text-on-surface-variant">Loading organization profile…</p>
  }

  if (isError) {
    return (
      <p className="text-body-sm text-error">
        Failed to load organization settings
        {error instanceof Error ? `: ${error.message}` : ''}
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-title-lg font-semibold text-on-background">Organization Information</h2>
          <p className="text-body-sm text-on-surface-variant mt-0.5">
            Primary organization identity from organization settings. Company name, timezone, and
            currency are saved to the backend.
          </p>
        </div>
        {isEditing ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (data) {
                  form.reset({
                    name: data.name ?? '',
                    legal: data.legal ?? '',
                    email: data.email ?? '',
                    phone: data.phone ?? '',
                    website: data.website ?? '',
                    tax: data.tax ?? '',
                    reg: data.reg ?? '',
                    description: data.description ?? '',
                    defaultTimezone: data.defaultTimezone ?? '',
                    defaultCurrency: data.defaultCurrency ?? '',
                  })
                }
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
          <EditButton iconOnly onClick={startEditing} title="Edit organization" aria-label="Edit organization" />
        )}
      </div>

      <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="shrink-0 space-y-3">
            <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">Logo</p>
            <div className="w-28 h-28 rounded-xl bg-surface-container-low flex items-center justify-center border border-dashed border-outline-variant overflow-hidden">
              {data?.logoReference ? (
                <img src={data.logoReference} alt="Organization logo" className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-4xl text-outline">image</span>
              )}
            </div>
            {isEditing && (
              <button type="button" className="text-xs font-medium text-secondary hover:underline cursor-pointer">
                Upload Logo
              </button>
            )}
          </div>

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
            <Field
              label="Organization Name"
              editing={isEditing}
              register={form.register('name')}
              value={formValues.name ?? ''}
            />
            <Field
              label="Default Timezone"
              editing={isEditing}
              register={form.register('defaultTimezone')}
              value={formValues.defaultTimezone ?? ''}
            />
            <Field
              label="Default Currency"
              editing={isEditing}
              register={form.register('defaultCurrency')}
              value={formValues.defaultCurrency ?? ''}
            />
            <Field label="Legal Name" editing={isEditing} register={form.register('legal')} value={formValues.legal ?? ''} />
            <Field label="Email" editing={isEditing} register={form.register('email')} value={formValues.email ?? ''} />
            <Field label="Phone" editing={isEditing} register={form.register('phone')} value={formValues.phone ?? ''} />
            <Field label="Website" editing={isEditing} register={form.register('website')} value={formValues.website ?? ''} />
            <Field label="Tax ID" editing={isEditing} register={form.register('tax')} value={formValues.tax ?? ''} />
            <Field label="Registration No." editing={isEditing} register={form.register('reg')} value={formValues.reg ?? ''} />
            <div className="sm:col-span-2">
              <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Description</p>
              {isEditing ? (
                <textarea
                  {...form.register('description')}
                  className="w-full min-h-[88px] rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-sm outline-none focus:border-secondary"
                />
              ) : (
                <p className="text-body-md text-on-background">{formValues.description || '—'}</p>
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
  editing,
  register,
  value,
}: {
  label: string
  editing: boolean
  register: UseFormRegisterReturn
  value: string
}) {
  return (
    <div>
      <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">{label}</p>
      {editing ? (
        <input
          {...register}
          className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-sm outline-none focus:border-secondary"
        />
      ) : (
        <p className={cn('text-body-md font-medium text-on-background')}>{value || '—'}</p>
      )}
    </div>
  )
}
