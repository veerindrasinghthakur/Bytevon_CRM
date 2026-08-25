import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { Select } from '@/shared/components/ui/Select'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import {
  getLeadById,
  getLeadFilterOptions,
  listSalesRepresentatives,
} from '../api/sales'
import { useCreateLead, useUpdateLead } from '../hooks/use-sales'
import type { LeadPriority, PipelineStage, RecordStatus } from '../types'
import { cn } from '@/shared/lib/cn'

export function LeadCreatePage() {
  const navigate = useNavigate()
  const params = useParams({ strict: false }) as { leadId?: string }
  const isEdit = Boolean(params.leadId)

  const existingQuery = useQuery({
    queryKey: ['sales', 'leads', 'detail', params.leadId],
    queryFn: () => getLeadById(params.leadId!),
    enabled: Boolean(params.leadId),
  })
  const filterOptionsQuery = useQuery({
    queryKey: ['sales', 'leads', 'filter-options'],
    queryFn: getLeadFilterOptions,
    staleTime: 60_000,
  })
  const repsQuery = useQuery({
    queryKey: ['sales', 'sales-representatives'],
    queryFn: listSalesRepresentatives,
    staleTime: 60_000,
  })

  const createMut = useCreateLead()
  const updateMut = useUpdateLead()

  const existing = existingQuery.data

  const [title, setTitle] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactTitle, setContactTitle] = useState('')
  const [company, setCompany] = useState('')
  const [industry, setIndustry] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [source, setSource] = useState('LinkedIn')
  const [priority, setPriority] = useState<LeadPriority>('Medium')
  const [status, setStatus] = useState<RecordStatus>('Active')
  const [stage, setStage] = useState<PipelineStage>('New')
  const [budget, setBudget] = useState('')
  const [date, setDate] = useState('')
  const [assignedEmploymentId, setAssignedEmploymentId] = useState('')
  const [notes, setNotes] = useState('')
  const [chatLink, setChatLink] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!existing) return
    setTitle(existing.title ?? '')
    setContactName(existing.contactName ?? '')
    setContactTitle(existing.contactTitle ?? '')
    setCompany(existing.company ?? '')
    setIndustry(existing.industry ?? '')
    setEmail(existing.email ?? '')
    setPhone(existing.phone ?? '')
    setSource(existing.source ?? 'LinkedIn')
    setPriority(existing.priority ?? 'Medium')
    setStatus(existing.status ?? 'Active')
    setStage(existing.stage ?? 'New')
    setBudget(existing.budget != null ? String(existing.budget) : '')
    setDate(existing.date ?? '')
    setNotes(existing.notes ?? '')
    setChatLink(existing.chatLink ?? '')
  }, [existing])

  // Match assigned rep by name when employment id not on record
  useEffect(() => {
    if (!existing?.assignedTo || !repsQuery.data?.length) return
    if (assignedEmploymentId) return
    const match = repsQuery.data.find(
      (r) => r.name.toLowerCase() === existing.assignedTo!.toLowerCase(),
    )
    if (match) setAssignedEmploymentId(String(match.employmentId))
  }, [existing, repsQuery.data, assignedEmploymentId])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!title.trim() || !contactName.trim()) {
      setError('Title and contact name are required.')
      return
    }
    const selectedRep = (repsQuery.data ?? []).find(
      (r) => String(r.employmentId) === assignedEmploymentId,
    )
    const payload = {
      title: title.trim(),
      contactName: contactName.trim(),
      contactTitle: contactTitle.trim() || undefined,
      company: company.trim(),
      industry: industry.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      source,
      priority,
      status,
      stage,
      budget: budget ? Number(budget) : 0,
      date: date || undefined,
      assignedEmploymentId: assignedEmploymentId ? Number(assignedEmploymentId) : null,
      assignedTo: selectedRep?.name,
      notes: notes.trim() || undefined,
      chatLink: chatLink.trim() || undefined,
    }
    try {
      if (isEdit && params.leadId) {
        await updateMut.mutateAsync({ id: params.leadId, patch: payload })
      } else {
        await createMut.mutateAsync(payload)
      }
      navigate({ to: '/sales' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    }
  }

  if (isEdit && existingQuery.isLoading) return <PageLoadingSkeleton />

  const fieldClass =
    'w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-body-md text-on-surface outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-colors'
  const labelClass = 'block text-label-md text-on-surface-variant mb-1.5'

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
        backTo="/sales"
        backLabel="Back to leads"
        breadcrumbs={
          <nav className="text-body-sm text-on-surface-variant">
            <Link to="/sales" className="hover:text-secondary">
              Sales
            </Link>
            <span className="mx-2">/</span>
            <span className="text-on-surface">{isEdit ? 'Edit' : 'New'}</span>
          </nav>
        }
      />

      {error && (
        <div className="rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-body-sm text-error">
          {error}
        </div>
      )}

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5 max-w-4xl">
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
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={fieldClass}
                placeholder="e.g. TechNexus ERP Migration"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="contactName">
                Contact name <span className="text-error">*</span>
              </label>
              <input
                id="contactName"
                required
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className={fieldClass}
                placeholder="Sarah Miller"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="contactTitle">
                Contact title
              </label>
              <input
                id="contactTitle"
                value={contactTitle}
                onChange={(e) => setContactTitle(e.target.value)}
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
                value={company}
                onChange={(e) => setCompany(e.target.value)}
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
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={fieldClass}
                placeholder="s.miller@technexus.com"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="phone">
                Phone
              </label>
              <input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
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
              value={stage}
              onChange={(v) => setStage(v as PipelineStage)}
              options={stages.map((s) => ({ value: s, label: s }))}
              minWidthClass="w-full"
            />
            <Select
              label="Priority"
              value={priority}
              onChange={(v) => setPriority(v as LeadPriority)}
              options={priorities.map((p) => ({ value: p, label: p }))}
              minWidthClass="w-full"
            />
            <Select
              label="Status"
              value={status}
              onChange={(v) => setStatus(v as RecordStatus)}
              options={statuses.map((s) => ({ value: s, label: s }))}
              minWidthClass="w-full"
            />
            <Select
              label="Source"
              value={source}
              onChange={setSource}
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
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
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
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={fieldClass}
              />
            </div>
            <div>
              <Select
                label="Assigned sales representative"
                value={assignedEmploymentId}
                onChange={setAssignedEmploymentId}
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
              value={chatLink}
              onChange={(e) => setChatLink(e.target.value)}
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
            rows={5}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={cn(fieldClass, 'resize-y')}
            placeholder="Discovery notes, internal context, next steps..."
          />
        </section>

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" variant="primary" isLoading={saving}>
            {isEdit ? 'Save changes' : 'Create lead'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => navigate({ to: '/sales' })}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
