import { useEffect, useMemo } from 'react'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { ArchiveButton } from '@/shared/components/ui/ArchiveButton'
import { Select } from '@/shared/components/ui/Select'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { queryKeys } from '@/shared/lib/query-keys'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { looseLinkProps, safeNavigate } from '@/shared/lib/safeNavigate'
import { listEmployments } from '@/modules/workforce/api/employment'
import { getLeadFilterOptions, listPlatforms } from '../api/sales'
import { useCreateLead, useLead, useUpdateLead } from '../hooks/use-sales'
import { salesRoutes } from '../routes'
import { leadFormSchema, optTrim, type LeadFormSchemaInput } from '../schemas/lead-form'
import {
  LeadPriorityOptions,
  LeadPriorityValues,
  PipelineStageOptions,
  PipelineStageValues,
  RecordStatusOptions,
  type LeadPriority,
  type PipelineStage,
  type RecordStatus,
} from '../schemas/enums'
import { cn } from '@/shared/lib/cn'

const fieldClass =
  'w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-body-md text-on-surface outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-colors'
const labelClass = 'block text-label-md text-on-surface-variant mb-1.5'

export function LeadCreatePage() {
  const navigate = useNavigate()
  const params = useParams({ strict: false }) as { leadId?: string }
  const isEdit = Boolean(params.leadId)

  const existingQuery = useLead(params.leadId)
  const filterOptionsQuery = useQuery({
    queryKey: queryKeys.sales.leads.filterOptions(),
    queryFn: getLeadFilterOptions,
    staleTime: Infinity,
    refetchOnMount: false,
  })

  /** Lead sources = platforms table (backend CRUD). */
  const platformsQuery = useQuery({
    queryKey: queryKeys.sales.platforms(),
    queryFn: () => listPlatforms(false),
    staleTime: 60_000,
  })

  /** Assignee = workforce employments (not hardcoded names). */
  const employeesQuery = useQuery({
    queryKey: queryKeys.workforce.employees.list({ scope: 'lead-assignee', pageSize: 200 }),
    queryFn: () => listEmployments({ page: 1, pageSize: 200 }),
    staleTime: 60_000,
  })

  const createMut = useCreateLead()
  const updateMut = useUpdateLead()
  const existing = existingQuery.data

  const form = useForm<LeadFormSchemaInput>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      title: '',
      contactName: '',
      contactTitle: '',
      company: '',
      industry: '',
      email: '',
      phone: '',
      platformId: '',
      priority: 'Medium' as LeadPriority,
      status: 'Active' as RecordStatus,
      stage: 'New' as PipelineStage,
      budget: '',
      date: '',
      assignedEmploymentId: '',
      notes: '',
      chatLink: '',
    },
  })

  useEffect(() => {
    if (!existing) return
    form.reset({
      title: existing.title ?? '',
      contactName: existing.contactName ?? '',
      contactTitle: existing.contactTitle ?? '',
      company: existing.company ?? '',
      industry: existing.industry ?? '',
      email: existing.email ?? '',
      phone: existing.phone ?? '',
      platformId:
        existing.platformId != null
          ? String(existing.platformId)
          : '',
      priority: existing.priority ?? 'Medium',
      status: existing.status ?? 'Active',
      stage: existing.stage ?? 'New',
      budget: existing.budget != null ? String(existing.budget) : '',
      date: existing.date ?? '',
      assignedEmploymentId:
        existing.assignedEmploymentId != null ? String(existing.assignedEmploymentId) : '',
      notes: existing.notes ?? '',
      chatLink: existing.chatLink ?? '',
    })
  }, [existing, form])

  /** Match platform by name when only source string is available on edit. */
  useEffect(() => {
    if (!existing?.source || form.getValues('platformId')) return
    const match = (platformsQuery.data ?? []).find(
      (p) => p.name.toLowerCase() === existing.source.toLowerCase(),
    )
    if (match) form.setValue('platformId', String(match.id))
  }, [existing, platformsQuery.data, form])

  const stages = filterOptionsQuery.data?.stages ?? [...PipelineStageValues]
  const priorities = filterOptionsQuery.data?.priorities ?? [...LeadPriorityValues]
  const statuses = filterOptionsQuery.data?.statuses ?? [...RecordStatusOptions.map((option) => option.value)]

  const platformOptions = useMemo(() => {
    const items = platformsQuery.data ?? []
    return [
      { value: '', label: platformsQuery.isLoading ? 'Loading sources…' : 'Select source' },
      ...items.map((p) => ({
        value: String(p.id),
        label: p.name,
      })),
    ]
  }, [platformsQuery.data, platformsQuery.isLoading])

  const employeeOptions = useMemo(() => {
    const items = employeesQuery.data?.items ?? []
    return [
      {
        value: '',
        label: employeesQuery.isLoading ? 'Loading employees…' : 'Unassigned',
      },
      ...items.map((e) => ({
        value: String(e.id),
        label: `${e.fullName} (${e.employee_code})`,
      })),
    ]
  }, [employeesQuery.data, employeesQuery.isLoading])

  const saving = createMut.isPending || updateMut.isPending

  const archiveLead = async () => {
    if (!isEdit || !params.leadId) return
    try {
      await updateMut.mutateAsync({
        id: params.leadId,
        patch: { status: 'Inactive' },
      })
      safeNavigate(navigate, { to: salesRoutes.leads })
    } catch (err) {
      form.setError('root', { message: getApiErrorMessage(err, 'Archive failed') })
    }
  }

  const onSubmit = async (data: LeadFormSchemaInput) => {
    const platformId = data.platformId ? Number(data.platformId) : null
    const platformName = (platformsQuery.data ?? []).find((p) => p.id === platformId)?.name
    const employeeId = data.assignedEmploymentId ? Number(data.assignedEmploymentId) : null
    const employee = (employeesQuery.data?.items ?? []).find((e) => e.id === employeeId)

    const payload = {
      title: data.title.trim(),
      contactName: data.contactName.trim(),
      contactTitle: optTrim(data.contactTitle),
      company: optTrim(data.company),
      industry: optTrim(data.industry),
      email: optTrim(data.email),
      phone: optTrim(data.phone),
      platformId,
      source: platformName,
      priority: data.priority,
      status: data.status,
      stage: data.stage,
      budget: data.budget ? Number(data.budget) : undefined,
      date: optTrim(data.date),
      assignedEmploymentId: employeeId,
      assignedTo: employee?.fullName,
      notes: optTrim(data.notes),
      chatLink: optTrim(data.chatLink),
    }
    try {
      if (isEdit && params.leadId) {
        await updateMut.mutateAsync({ id: params.leadId, patch: payload })
      } else {
        await createMut.mutateAsync(payload)
      }
      safeNavigate(navigate, { to: salesRoutes.leads })
    } catch (err) {
      form.setError('root', { message: getApiErrorMessage(err, 'Save failed') })
    }
  }

  if (isEdit && existingQuery.isLoading) return <PageLoadingSkeleton />

  const stageValue = form.watch('stage') ?? ''
  const priorityValue = form.watch('priority') ?? ''
  const statusValue = form.watch('status') ?? ''
  const platformValue = form.watch('platformId') ?? ''
  const assignedValue = form.watch('assignedEmploymentId') ?? ''

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={isEdit ? 'Edit Lead' : 'Create Lead'}
        description={
          isEdit
            ? `Update ${existing?.title ?? 'lead'}`
            : 'Capture a new opportunity. Client is optional until the lead is won.'
        }
        showBack
        backTo={salesRoutes.leads}
        backLabel="Back to leads"
        breadcrumbs={
          <nav className="text-body-sm text-on-surface-variant">
            <Link {...looseLinkProps({ to: salesRoutes.root, className: 'hover:text-secondary' })}>
              Sales
            </Link>
            <span className="mx-2">/</span>
            <span className="text-on-surface">{isEdit ? 'Edit' : 'New'}</span>
          </nav>
        }
      />

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 max-w-4xl">
        {form.formState.errors.root?.message && (
          <div className="rounded-lg border border-error/40 bg-error/10 px-4 py-3 text-body-sm text-error">
            {form.formState.errors.root.message}
          </div>
        )}

        <section className="bv-surface p-6 space-y-4">
          <h2 className="text-title-md font-semibold text-on-background flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">badge</span>
            Lead identity
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelClass} htmlFor="title">
                Lead title <span className="text-error">*</span>
              </label>
              <input
                id="title"
                required
                {...form.register('title')}
                className={fieldClass}
                placeholder="e.g. TechNexus ERP Migration"
              />
              {form.formState.errors.title && (
                <p className="text-[11px] text-error mt-1">{form.formState.errors.title.message}</p>
              )}
            </div>
            <div>
              <label className={labelClass} htmlFor="contactName">
                Contact name <span className="text-error">*</span>
              </label>
              <input
                id="contactName"
                required
                {...form.register('contactName')}
                className={fieldClass}
                placeholder="Sarah Miller"
              />
              {form.formState.errors.contactName && (
                <p className="text-[11px] text-error mt-1">{form.formState.errors.contactName.message}</p>
              )}
            </div>
            <div>
              <label className={labelClass} htmlFor="contactTitle">
                Contact title
              </label>
              <input id="contactTitle" {...form.register('contactTitle')} className={fieldClass} placeholder="VP of Growth" />
            </div>
            <div>
              <label className={labelClass} htmlFor="company">
                Company
              </label>
              <input
                id="company"
                {...form.register('company')}
                className={fieldClass}
                placeholder="TechNexus Corp. (optional — client created on WON)"
              />
              <p className="text-[11px] text-on-surface-variant mt-1">
                Optional. On WON, an existing client is reused or a new one is created from this name.
              </p>
            </div>
            <div>
              <label className={labelClass} htmlFor="industry">
                Industry
              </label>
              <input id="industry" {...form.register('industry')} className={fieldClass} placeholder="SaaS / Technology" />
            </div>
            <div>
              <label className={labelClass} htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                {...form.register('email')}
                className={fieldClass}
                placeholder="s.miller@technexus.com"
              />
              {form.formState.errors.email && (
                <p className="text-[11px] text-error mt-1">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div>
              <label className={labelClass} htmlFor="phone">
                Phone
              </label>
              <input id="phone" {...form.register('phone')} className={fieldClass} placeholder="+1 (555) 012-3456" />
            </div>
          </div>
        </section>

        <section className="bv-surface p-6 space-y-4">
          <h2 className="text-title-md font-semibold text-on-background flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">filter_alt</span>
            Pipeline & status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select
              label="Stage"
              value={stageValue}
              onChange={(v) => form.setValue('stage', v as PipelineStage)}
              options={[
                ...PipelineStageOptions,
                ...stages
                  .filter((s) => !PipelineStageOptions.some((option) => option.value === s))
                  .map((s) => ({ value: s, label: s })),
              ]}
              minWidthClass="w-full"
            />
            <Select
              label="Priority"
              value={priorityValue}
              onChange={(v) => form.setValue('priority', v as LeadPriority)}
              options={[
                ...LeadPriorityOptions,
                ...priorities
                  .filter((p) => !LeadPriorityOptions.some((option) => option.value === p))
                  .map((p) => ({ value: p, label: p })),
              ]}
              minWidthClass="w-full"
            />
            <Select
              label="Status"
              value={statusValue}
              onChange={(v) => form.setValue('status', v as RecordStatus)}
              options={[
                ...RecordStatusOptions,
                ...statuses
                  .filter((s) => !RecordStatusOptions.some((option) => option.value === s))
                  .map((s) => ({ value: s, label: s })),
              ]}
              minWidthClass="w-full"
            />
            <div>
              <Select
                label="Source"
                value={platformValue}
                onChange={(v) => form.setValue('platformId', v)}
                options={platformOptions}
                minWidthClass="w-full"
                disabled={platformsQuery.isLoading}
              />
              {platformsQuery.isError && (
                <p className="text-[11px] text-error mt-1">
                  {getApiErrorMessage(platformsQuery.error, 'Failed to load sources')}
                </p>
              )}
              {!platformsQuery.isLoading && !platformsQuery.isError && (platformsQuery.data?.length ?? 0) === 0 && (
                <p className="text-[11px] text-on-surface-variant mt-1">
                  No platforms configured. Add sources under Sales platforms.
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="bv-surface p-6 space-y-4">
          <h2 className="text-title-md font-semibold text-on-background flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">payments</span>
            Commercial
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass} htmlFor="budget">
                Estimated budget / quotation
              </label>
              <input id="budget" type="number" min={0} step="0.01" {...form.register('budget')} className={fieldClass} placeholder="120000" />
            </div>
            <div>
              <label className={labelClass} htmlFor="date">
                Expected close date
              </label>
              <input id="date" type="date" {...form.register('date')} className={fieldClass} />
            </div>
            <div>
              <Select
                label="Assigned representative"
                value={assignedValue}
                onChange={(v) => form.setValue('assignedEmploymentId', v)}
                placeholder="Select employee"
                options={employeeOptions}
                minWidthClass="w-full"
                disabled={employeesQuery.isLoading}
              />
              {employeesQuery.isError && (
                <p className="text-[11px] text-error mt-1">
                  {getApiErrorMessage(employeesQuery.error, 'Failed to load employees')}
                </p>
              )}
              <p className="text-[11px] text-on-surface-variant mt-1">
                Submits employment ID to assigned_employment_id.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-secondary/30 bg-secondary/5 p-6 space-y-4 executive-shadow">
          <h2 className="text-title-md font-semibold text-on-background flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">chat</span>
            Chat with client
          </h2>
          <div>
            <label className={labelClass} htmlFor="chatLink">
              Chat link
            </label>
            <input
              id="chatLink"
              type="url"
              {...form.register('chatLink')}
              className={fieldClass}
              placeholder="https://chat.bytevon.app/c/..."
            />
            <p className="text-[11px] text-on-surface-variant mt-1">UI-only — not stored on leads table.</p>
          </div>
        </section>

        <section className="bv-surface p-6 space-y-4">
          <h2 className="text-title-md font-semibold text-on-background flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">notes</span>
            Background & context
          </h2>
          <textarea
            id="notes"
            rows={5}
            {...form.register('notes')}
            className={cn(fieldClass, 'resize-y')}
            placeholder="Discovery notes, internal context, next steps..."
            aria-label="Notes"
          />
        </section>

        <div className="flex items-center gap-3 pt-2 flex-wrap">
          {isEdit && (
            <ArchiveButton
              entityLabel={existing?.title ?? 'this lead'}
              onConfirm={() => void archiveLead()}
              isLoading={updateMut.isPending}
            />
          )}
          <Button type="submit" variant="primary" isLoading={saving}>
            {isEdit ? 'Save changes' : 'Create lead'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => safeNavigate(navigate, { to: salesRoutes.leads })}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
