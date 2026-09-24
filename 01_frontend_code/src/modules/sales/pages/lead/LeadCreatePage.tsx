import { useEffect, useMemo } from 'react'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { queryKeys } from '@/shared/lib/query-keys'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { looseLinkProps, safeNavigate } from '@/shared/lib/safeNavigate'
import { listEmployments } from '@/modules/workforce/api/employment'
import { getLeadFilterOptions, listPlatforms } from '../../api/sales'
import { useCreateLead, useLead, useUpdateLead } from '../../hooks/use-sales'
import { salesRoutes } from '../../routes'
import { leadFormSchema, optTrim, type LeadFormSchemaInput } from '../../schemas/lead/lead-form'
import {
  LeadPriorityValues,
  PipelineStageValues,
  RecordStatusOptions,
  type LeadPriority,
  type PipelineStage,
  type RecordStatus,
} from '../../schemas/enums'
import { LeadIdentityForm } from '../../components/lead/LeadIdentityForm'
import { LeadPipelineForm } from '../../components/lead/LeadPipelineForm'
import { LeadCommercialForm } from '../../components/lead/LeadCommercialForm'
import { LeadChatForm } from '../../components/lead/LeadChatForm'
import { LeadNotesForm } from '../../components/lead/LeadNotesForm'
import { LeadFormActions } from '../../components/lead/LeadFormActions'

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

  const platformsQuery = useQuery({
    queryKey: queryKeys.sales.platforms(),
    queryFn: () => listPlatforms(false),
    staleTime: 60_000,
  })

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
      autoCreateProject: false,
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
      platformId: existing.platformId != null ? String(existing.platformId) : '',
      priority: existing.priority ?? 'Medium',
      status: existing.status ?? 'Active',
      stage: existing.stage ?? 'New',
      budget: existing.budget != null ? String(existing.budget) : '',
      date: existing.date ?? '',
      assignedEmploymentId:
        existing.assignedEmploymentId != null ? String(existing.assignedEmploymentId) : '',
      notes: existing.notes ?? '',
      chatLink: existing.chatLink ?? '',
      autoCreateProject: false,
    })
  }, [existing, form])

  useEffect(() => {
    if (!existing?.source || form.getValues('platformId')) return
    const match = (platformsQuery.data ?? []).find(
      (p) => p.name.toLowerCase() === existing.source.toLowerCase(),
    )
    if (match) form.setValue('platformId', String(match.id))
  }, [existing, platformsQuery.data, form])

  const stages = filterOptionsQuery.data?.stages ?? [...PipelineStageValues]
  const priorities = filterOptionsQuery.data?.priorities ?? [...LeadPriorityValues]
  const statuses =
    filterOptionsQuery.data?.statuses ?? [...RecordStatusOptions.map((option) => option.value)]

  const platformOptions = useMemo(() => {
    const items = platformsQuery.data ?? []
    return [
      { value: '', label: platformsQuery.isLoading ? 'Loading sources…' : 'Select source' },
      ...items.map((p) => ({ value: String(p.id), label: p.name })),
    ]
  }, [platformsQuery.data, platformsQuery.isLoading])

  const employeeOptions = useMemo(() => {
    const items = employeesQuery.data?.items ?? []
    return [
      { value: '', label: employeesQuery.isLoading ? 'Loading employees…' : 'Unassigned' },
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
      await updateMut.mutateAsync({ id: params.leadId, patch: { status: 'Inactive' } })
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
      auto_create_project: data.autoCreateProject ?? false,
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

        <LeadIdentityForm form={form} />
        <LeadPipelineForm
          form={form}
          stageValue={stageValue}
          priorityValue={priorityValue}
          statusValue={statusValue}
          platformValue={platformValue}
          stages={stages}
          priorities={priorities}
          statuses={statuses}
          platformOptions={platformOptions}
          platformsLoading={platformsQuery.isLoading}
          platformsError={platformsQuery.isError ? platformsQuery.error : null}
          platformsEmpty={(platformsQuery.data?.length ?? 0) === 0}
        />
        <LeadCommercialForm
          form={form}
          assignedValue={assignedValue}
          employeeOptions={employeeOptions}
          employeesLoading={employeesQuery.isLoading}
          employeesError={employeesQuery.isError ? employeesQuery.error : null}
        />
        <LeadChatForm form={form} />
        <LeadNotesForm form={form} />
        <label className="flex items-center gap-2 text-body-sm text-on-surface max-w-4xl">
          <input
            type="checkbox"
            checked={form.watch('autoCreateProject') ?? false}
            onChange={(e) => form.setValue('autoCreateProject', e.target.checked)}
          />
          Create project on WON
        </label>
        <LeadFormActions
          isEdit={isEdit}
          saving={saving}
          archiveLoading={updateMut.isPending}
          entityLabel={existing?.title ?? 'this lead'}
          onArchive={() => void archiveLead()}
          onCancel={() => safeNavigate(navigate, { to: salesRoutes.leads })}
        />
      </form>
    </div>
  )
}
