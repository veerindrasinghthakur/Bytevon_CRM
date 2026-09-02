import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { EditButton } from '@/shared/components/ui/EditButton'
import { Select } from '@/shared/components/ui/Select'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { useEditMode } from '@/shared/hooks/useEditMode'
import {
  useOrganizationSettings,
  useOrgLocationsForSelect,
  useUpdateOrganizationSettings,
} from '../../hooks/use-organization'
import type { OrganizationSettings } from '@/shared/schema'
import { cn } from '@/shared/lib/cn'

const organizationSettingsSchema = z.object({
  company_name: z.string().min(2, 'Company name is required'),
  head_office_location_id: z.number().int().positive('Select a head office location'),
  default_timezone: z.string().min(1, 'Timezone is required'),
  default_currency: z.string().min(1, 'Currency is required'),
})

type OrganizationSettingsForm = z.infer<typeof organizationSettingsSchema>

export function OrganizationSettingsPage() {
  const settingsQ = useOrganizationSettings()
  const locationsQ = useOrgLocationsForSelect()
  const updateMut = useUpdateOrganizationSettings()
  const { isEditing, startEditing, cancelEditing, finishEditing } = useEditMode(false)

  const settings = settingsQ.data
  const locations = locationsQ.data?.items ?? []

  const form = useForm<OrganizationSettingsForm>({
    resolver: zodResolver(organizationSettingsSchema),
    defaultValues: {
      company_name: '',
      head_office_location_id: 0,
      default_timezone: '',
      default_currency: '',
    },
  })

  useEffect(() => {
    if (settings && !isEditing) {
      form.reset({
        company_name: settings.company_name,
        head_office_location_id: settings.head_office_location_id,
        default_timezone: settings.default_timezone,
        default_currency: settings.default_currency,
      })
    }
  }, [settings, isEditing, form])

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
    startEditing()
  }

  const onCancel = () => {
    if (settings) {
      form.reset({
        company_name: settings.company_name,
        head_office_location_id: settings.head_office_location_id,
        default_timezone: settings.default_timezone,
        default_currency: settings.default_currency,
      })
    }
    cancelEditing()
  }

  const head =
    locations.find((l) => l.id === settings.head_office_location_id)?.name ??
    `Location #${settings.head_office_location_id}`

  const onSubmit = (values: OrganizationSettingsForm) => {
    updateMut.mutate(
      {
        company_name: values.company_name,
        head_office_location_id: values.head_office_location_id,
        default_timezone: values.default_timezone,
        default_currency: values.default_currency,
      },
      {
        onSuccess: () => {
          finishEditing()
        },
      },
    )
  }

  const locationOptions = locations.map((l) => ({ value: String(l.id), label: l.name }))

  const formValues = form.watch()

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
              <Button
                variant="primary"
                isLoading={updateMut.isPending}
                onClick={form.handleSubmit(onSubmit)}
              >
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

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 shadow-sm space-y-5 max-w-2xl card-hover">
          <div>
            <label className="block text-label-sm text-on-surface-variant mb-1">Company name</label>
            {isEditing ? (
              <input
                {...form.register('company_name')}
                className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-sm outline-none focus:border-secondary"
              />
            ) : (
              <p className="font-medium text-on-background">{formValues.company_name || settings.company_name}</p>
            )}
            {form.formState.errors.company_name && isEditing && (
              <p className="text-caption text-error mt-1">{form.formState.errors.company_name.message}</p>
            )}
          </div>
          <div>
            <p className="text-label-sm text-on-surface-variant mb-1">Head office</p>
            {isEditing ? (
              <Select
                {...form.register('head_office_location_id', { valueAsNumber: true })}
                options={[{ value: '', label: 'Select location' }, ...locationOptions]}
                placeholder="Select head office"
              />
            ) : (
              <p className="font-medium">{head}</p>
            )}
            {form.formState.errors.head_office_location_id && isEditing && (
              <p className="text-caption text-error mt-1">{form.formState.errors.head_office_location_id.message}</p>
            )}
          </div>
          <div>
            <label className="block text-label-sm text-on-surface-variant mb-1">Default timezone</label>
            {isEditing ? (
              <input
                {...form.register('default_timezone')}
                className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-sm outline-none focus:border-secondary"
              />
            ) : (
              <p className="font-medium text-on-background">{formValues.default_timezone || settings.default_timezone}</p>
            )}
            {form.formState.errors.default_timezone && isEditing && (
              <p className="text-caption text-error mt-1">{form.formState.errors.default_timezone.message}</p>
            )}
          </div>
          <div>
            <label className="block text-label-sm text-on-surface-variant mb-1">Default currency</label>
            {isEditing ? (
              <input
                {...form.register('default_currency')}
                className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-sm outline-none focus:border-secondary"
              />
            ) : (
              <p className="font-medium text-on-background">{formValues.default_currency || settings.default_currency}</p>
            )}
            {form.formState.errors.default_currency && isEditing && (
              <p className="text-caption text-error mt-1">{form.formState.errors.default_currency.message}</p>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={updateMut.isPending}>
              Save
            </Button>
          </div>
        )}
      </form>
    </div>
  )
}
