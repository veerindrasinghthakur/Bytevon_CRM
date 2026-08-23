import { useState } from 'react'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { Select } from '@/shared/components/ui/Select'
import { leads } from '../data/mock'
import type { LeadPriority, PipelineStage, RecordStatus } from '../types'
import { cn } from '@/shared/lib/cn'

const stages: PipelineStage[] = [
  'New',
  'Contacted',
  'Qualified',
  'Proposal',
  'Negotiation',
  'Won',
  'Lost',
]
const priorities: LeadPriority[] = ['Critical', 'High', 'Medium', 'Low']
const sources = ['LinkedIn', 'Website', 'Referral', 'Direct Referral', 'Event', 'Other']

/** Mock employment options — replace with workforce employees query later */
const SALES_REPS = [
  { value: '', label: 'Unassigned' },
  { value: 'Alex Rivera', label: 'Alex Rivera' },
  { value: 'Jordan Lee', label: 'Jordan Lee' },
  { value: 'Sam Patel', label: 'Sam Patel' },
  { value: 'Morgan Chen', label: 'Morgan Chen' },
  { value: 'Casey Brooks', label: 'Casey Brooks' },
]

export function LeadCreatePage() {
  const navigate = useNavigate()
  const params = useParams({ strict: false }) as { leadId?: string }
  const existing = params.leadId ? leads.find((l) => l.id === params.leadId) : undefined
  const isEdit = Boolean(existing)

  const [title, setTitle] = useState(existing?.title ?? '')
  const [contactName, setContactName] = useState(existing?.contactName ?? '')
  const [contactTitle, setContactTitle] = useState(existing?.contactTitle ?? '')
  const [company, setCompany] = useState(existing?.company ?? '')
  const [industry, setIndustry] = useState(existing?.industry ?? '')
  const [email, setEmail] = useState(existing?.email ?? '')
  const [phone, setPhone] = useState(existing?.phone ?? '')
  const [source, setSource] = useState(existing?.source ?? 'LinkedIn')
  const [priority, setPriority] = useState<LeadPriority>(existing?.priority ?? 'Medium')
  const [status, setStatus] = useState<RecordStatus>(existing?.status ?? 'Active')
  const [stage, setStage] = useState<PipelineStage>(existing?.stage ?? 'New')
  const [budget, setBudget] = useState(existing?.budget?.toString() ?? '')
  const [date, setDate] = useState(existing?.date ?? '')
  const [assignedTo, setAssignedTo] = useState(existing?.assignedTo ?? '')
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [chatLink, setChatLink] = useState(existing?.chatLink ?? '')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await new Promise((r) => setTimeout(r, 400))
    setSaving(false)
    navigate({ to: '/sales/leads' })
  }

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
        backTo="/sales/leads"
        backLabel="Back to leads"
        breadcrumbs={
          <nav className="text-body-sm text-on-surface-variant">
            <Link to="/sales" className="hover:text-secondary">
              Sales
            </Link>
            <span className="mx-2">/</span>
            <Link to="/sales/leads" className="hover:text-secondary">
              Leads
            </Link>
            <span className="mx-2">/</span>
            <span className="text-on-surface">{isEdit ? 'Edit' : 'New'}</span>
          </nav>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-5 max-w-4xl">
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
              options={[
                { value: 'Active', label: 'Active' },
                { value: 'Inactive', label: 'Inactive' },
              ]}
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
                value={assignedTo}
                onChange={setAssignedTo}
                placeholder="Select employee"
                options={SALES_REPS}
                minWidthClass="w-full"
              />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-secondary/30 bg-secondary/5 p-6 space-y-4 executive-shadow">
          <h2 className="text-title-md font-semibold text-on-background flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">chat</span>
            Chat with client
          </h2>
          <p className="text-body-sm text-on-surface-variant">
            Paste the conversation URL so the team can open the thread from the lead record and list.
          </p>
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
          <Button type="button" variant="ghost" onClick={() => navigate({ to: '/sales/leads' })}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
