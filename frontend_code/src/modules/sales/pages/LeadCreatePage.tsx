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
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { getLeadFilterOptions, listSalesRepresentatives } from '../api/sales'
import { useCreateLead, useLead, useUpdateLead } from '../hooks/use-sales'
import { salesRoutes } from '../routes'
import { leadFormSchema, type LeadFormSchemaInput } from '../schemas/lead-form'
import type { LeadPriority, PipelineStage, RecordStatus } from '../types'
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
  const repsQuery = useQuery({
    queryKey: queryKeys.sales.salesRepresentatives(),
    queryFn: listSalesRepresentatives,
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
      source: 'LinkedIn',
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
      source: existing.source ?? 'LinkedIn',
      priority: existing.priority ?? 'Medium',
      status: existing.status ?? 'Active',
      stage: existing.stage ?? 'New',
      budget: existing.budget != null ? String(existing.budget) : '',
      date: existing.date ?? '',
      assignedEmploymentId: '',
      notes: existing.notes ?? '',
      chatLink: existing.chatLink ?? '',
    })
  }, [existing, form])

  useEffect(() => {
    if (!existing?.assignedTo || !repsQuery.data?.length) return
    const match = repsQuery.data!.find(
      (r) => r.name.toLowerCase() === existing.assignedTo!.toLowerCase(),
    )
    if (match) {
      form.setValue('assignedEmploymentId', String(match.employmentId))
    }
  }, [existing, repsQuery.data, form])

  const stages = filterOptionsQuery.data?.stages ?? []
  const priorities = filterOptionsQuery.data?.priorities ?? []
  const sources = filterOptionsQuery.data?.sources ?? []
  const statuses = filterOptionsQuery.data?.statuses ?? ['Active', 'Inactive']

  const repOptions = useMemo(() => {
    const items = repsQuery.data ?? []
    return [
      { value: '', label: 'Unassigned' },
      ...items.map((r) => ({
        value: String(r.employmentId),
        label: `${r.name} (${r.employeeCode})`,
      })),
    ]
  }, [repsQuery.data])

  const saving = createMut.isPending || updateMut.isPending

  const archiveLead = async () => {
    if (!isEdit || !params.leadId) return

    try {
      await updateMut.mutateAsync({
        id: params.leadId,
        patch: { status: 'Inactive' },
      })
      safeNavigate(navigate, { to: salesRoutes.leads, search: {} })
    } catch (err) {
      form.setError('root', { message: err instanceof Error ? err.message : 'Archive failed' })
    }
  }

  const onSubmit = async (data: LeadFormSchemaInput) => {
    const selectedRep = (repsQuery.data ?? []).find(
      (r) => String(r.employmentId) === data.assignedEmploymentId,
    )
    const payload = {
      title: data.title.trim(),
      contactName: data.contactName.trim(),
      contactTitle: data.contactTitle.trim() || undefined,
      company: data.company.trim(),
      industry: data.industry.trim() || undefined,
      email: data.email.trim() || undefined,
      phone: data.phone.trim() || undefined,
      source: data.source,
      priority: data.priority,
      status: data.status,
      stage: data.stage,
      budget: data.budget ? Number(data.budget) : 0,
      date: data.date || undefined,
      assignedEmploymentId: data.assignedEmploymentId
        ? Number(data.assignedEmploymentId)
        : null,
      assignedTo: selectedRep?.name,
      notes: data.notes.trim() || undefined,
      chatLink: data.chatLink.trim() || undefined,
    }
    try {
      if (isEdit && params.leadId) {
        await updateMut.mutateAsync({ id: params.leadId, patch: payload })
      } else {
        await createMut.mutateAsync(payload)
      }
      safeNavigate(navigate, { to: salesRoutes.leads, search: {} })
    } catch (err) {
      form.setError('root', { message: err instanceof Error ? err.message : 'Save failed' })
    }
  }

  if (isEdit && existingQuery.isLoading) return <PageLoadingSkeleton />

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
            <Link to={salesRoutes.root} search={{}} className="hover:text-secondary">
              Sales
            </Link>
            <span className="mx-2">/</span>
            <span className="text-on-surface">{isEdit ? 'Edit' : 'New'}</span>
          </nav>
        }
      />

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 max-w-4xl">
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
              <input
                id="contactTitle"
                {...form.register('contactTitle')}
                className={fieldClass}
                placeholder="VP of Growth"
              />
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
                Client is optional. On WON, an existing client is reused or a new one is created.
              </p>
            </div>
            <div>
              <label className={labelClass} htmlFor="industry">
                Industry
              </label>
              <input
                id="industry"
                {...form.register('industry')}
                className={fieldClass}
                placeholder="SaaS / Technology"
              />
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
              <input
                id="phone"
                {...form.register('phone')}
                className={fieldClass}
                placeholder="+1 (555) 012-3456"
              />
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
              value={form.watch('stage')}
              onChange={(v) => form.setValue('stage', v as PipelineStage)}
              options={stages.map((s) => ({ value: s, label: s }))}
              minWidthClass="w-full"
            />
            <Select
              label="Priority"
              value={form.watch('priority')}
              onChange={(v) => form.setValue('priority', v as LeadPriority)}
              options={priorities.map((p) => ({ value: p, label: p }))}
              minWidthClass="w-full"
            />
            <Select
              label="Status"
              value={form.watch('status')}
              onChange={(v) => form.setValue('status', v as RecordStatus)}
              options={statuses.map((s) => ({ value: s, label: s }))}
              minWidthClass="w-full"
            />
            <Select
              label="Source"
              value={form.watch('source')}
              onChange={(v) => form.setValue('source', v)}
              options={sources.map((s) => ({ value: s, label: s }))}
              minWidthClass="w-full"
            />
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
                Estimated budget (USD)
              </label>
              <input
                id="budget"
                type="number"
                min={0}
                {...form.register('budget')}
                className={fieldClass}
                placeholder="120000"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="date">
                Expected close date
              </label>
              <input
                id="date"
                type="date"
                {...form.register('date')}
                className={fieldClass}
              />
            </div>
            <div>
              <Select
                label="Assigned sales representative"
                value={form.watch('assignedEmploymentId')}
                onChange={(v) => form.setValue('assignedEmploymentId', v)}
                placeholder="Select Sales employee"
                options={repOptions}
                minWidthClass="w-full"
              />
              <p className="text-[11px] text-on-surface-variant mt-1">
                Employees currently assigned to the Sales department.
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
          <Button
            type="button"
            variant="ghost"
            onClick={() => safeNavigate(navigate, { to: salesRoutes.leads, search: {} })}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
