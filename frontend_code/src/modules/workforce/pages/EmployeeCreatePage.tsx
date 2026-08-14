import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { departments } from '../data/mock'
import { cn } from '@/shared/lib/cn'

function Icon({ name, className }: { name: string; className?: string }) {
  return <span className={cn('material-symbols-outlined', className)} aria-hidden>{name}</span>
}

function Field({
  label,
  required,
  children,
  hint,
  error,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
  hint?: string
  error?: string
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-label-md text-on-surface-variant">
        {label} {required && <span className="text-error">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-on-surface-variant/70">{hint}</p>}
      {error && (
        <p className="text-xs text-error flex items-center gap-1">
          <Icon name="error" className="text-sm" /> {error}
        </p>
      )}
    </div>
  )
}

const inputClass =
  'w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface outline-none focus:border-secondary focus:ring-1 focus:ring-secondary'

export function EmployeeCreatePage() {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [title, setTitle] = useState('')
  const [emailError, setEmailError] = useState('')

  const handleSave = async () => {
    if (email && !email.includes('@')) {
      setEmailError('Please enter a valid corporate email.')
      return
    }
    setEmailError('')
    setSaving(true)
    await new Promise((r) => setTimeout(r, 800))
    setSaving(false)
    navigate({ to: '/workforce/employees' })
  }

  return (
    <div className="space-y-6 pb-28 max-w-5xl">
      <PageHeader
        title="Add New Employee"
        description="Create a full employee profile with employment, contact, and document details."
        showBack
      />

      {/* Photo */}
      <section className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm flex flex-col md:flex-row items-center gap-6">
        <div className="w-28 h-28 rounded-xl bg-surface-container-high border-2 border-dashed border-outline flex items-center justify-center text-on-surface-variant">
          <Icon name="add_a_photo" className="text-4xl" />
        </div>
        <div className="flex-1 text-center md:text-left space-y-2">
          <h3 className="text-title-lg font-semibold text-on-background">Employee Profile Photo</h3>
          <p className="text-body-sm text-on-surface-variant">JPEG or PNG, max 5MB. Recommended 400×400px.</p>
          <div className="flex gap-2 justify-center md:justify-start pt-1">
            <Button variant="outline" size="sm">Upload New</Button>
            <Button variant="ghost" size="sm">Remove</Button>
          </div>
        </div>
      </section>

      {/* Personal */}
      <section className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-secondary mb-2">
          <Icon name="person" />
          <h3 className="text-title-lg font-bold text-on-background">Personal Information</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label="First Name" required>
            <input className={inputClass} placeholder="e.g. Jonathan" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </Field>
          <Field label="Last Name" required>
            <input className={inputClass} placeholder="e.g. Wick" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </Field>
          <Field label="Date of Birth" required>
            <input className={inputClass} type="date" />
          </Field>
          <Field label="Gender">
            <select className={inputClass} defaultValue="">
              <option value="" disabled>Select Gender</option>
              <option>Male</option>
              <option>Female</option>
              <option>Non-binary</option>
              <option>Prefer not to say</option>
            </select>
          </Field>
          <Field label="Nationality">
            <input className={inputClass} placeholder="e.g. British" />
          </Field>
        </div>
      </section>

      {/* Employment */}
      <section className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-secondary mb-2">
          <Icon name="work" />
          <h3 className="text-title-lg font-bold text-on-background">Employment Information</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Employee ID" required hint="Automatically generated based on payroll sequence.">
            <div className="relative">
              <input className={cn(inputClass, 'bg-surface-container text-on-surface-variant cursor-not-allowed')} disabled value="BTVN-49201" />
              <span className="absolute right-4 top-3 text-xs font-semibold text-outline">AUTO-GEN</span>
            </div>
          </Field>
          <Field label="Job Title" required>
            <input className={inputClass} placeholder="e.g. Senior Solutions Architect" value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Department">
            <select className={inputClass} defaultValue={departments[0]?.name}>
              {departments.map((d) => (
                <option key={d.id}>{d.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Manager">
            <input className={inputClass} placeholder="Search manager..." />
          </Field>
          <Field label="Joining Date" required>
            <input className={inputClass} type="date" />
          </Field>
          <Field label="Employment Type">
            <select className={inputClass}>
              <option>Full-Time Regular</option>
              <option>Contractor</option>
              <option>Part-Time</option>
              <option>Intern</option>
            </select>
          </Field>
        </div>
      </section>

      {/* Contact + Emergency */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-secondary mb-2">
            <Icon name="contact_mail" />
            <h3 className="text-title-lg font-bold text-on-background">Contact Information</h3>
          </div>
          <Field label="Work Email" required error={emailError}>
            <input
              className={cn(inputClass, emailError && 'border-error')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@bytevon.com"
            />
          </Field>
          <Field label="Personal Email">
            <input className={inputClass} type="email" placeholder="personal@example.com" />
          </Field>
          <Field label="Phone Number" required>
            <input className={inputClass} type="tel" placeholder="+1 (555) 000-0000" />
          </Field>
        </section>
        <section className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-secondary mb-2">
            <Icon name="emergency" />
            <h3 className="text-title-lg font-bold text-on-background">Emergency Contact</h3>
          </div>
          <Field label="Full Name" required>
            <input className={inputClass} placeholder="Contact Person Name" />
          </Field>
          <Field label="Relationship" required>
            <input className={inputClass} placeholder="e.g. Spouse, Parent" />
          </Field>
          <Field label="Phone Number" required>
            <input className={inputClass} type="tel" placeholder="+1 (555) 000-0000" />
          </Field>
        </section>
      </div>

      {/* Address */}
      <section className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-secondary mb-2">
          <Icon name="location_on" />
          <h3 className="text-title-lg font-bold text-on-background">Address</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Field label="Street Address" required>
              <input className={inputClass} placeholder="Unit, Street Name" />
            </Field>
          </div>
          <Field label="City" required>
            <input className={inputClass} placeholder="City" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="State">
              <input className={inputClass} placeholder="State/Prov" />
            </Field>
            <Field label="ZIP Code">
              <input className={inputClass} placeholder="00000" />
            </Field>
          </div>
          <Field label="Country" required>
            <select className={inputClass}>
              <option>United Kingdom</option>
              <option>United States</option>
              <option>Canada</option>
              <option>Germany</option>
              <option>India</option>
            </select>
          </Field>
        </div>
      </section>

      {/* Bank */}
      <section className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-secondary mb-2">
          <Icon name="payments" />
          <h3 className="text-title-lg font-bold text-on-background">Bank Details</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Account Holder Name">
            <input className={inputClass} placeholder="As per bank records" />
          </Field>
          <Field label="Bank Name">
            <input className={inputClass} placeholder="Full name of bank" />
          </Field>
          <Field label="Account Number">
            <input className={inputClass} placeholder="0000000000" />
          </Field>
          <Field label="IFSC / SWIFT Code">
            <input className={inputClass} placeholder="Bank ID code" />
          </Field>
        </div>
      </section>

      {/* Documents */}
      <section className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-secondary mb-2">
          <Icon name="description" />
          <h3 className="text-title-lg font-bold text-on-background">Documents</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {["Identity Proof (Passport/ID)", "Signed Contract"].map((label) => (
            <div key={label} className="p-4 border border-outline-variant rounded-lg flex items-center justify-between bg-surface">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-surface-container-high rounded flex items-center justify-center text-secondary">
                  <Icon name="badge" />
                </div>
                <div>
                  <p className="font-medium text-on-surface text-sm">{label}</p>
                  <p className="text-xs text-on-surface-variant">Upload required file</p>
                </div>
              </div>
              <button type="button" className="p-2 text-secondary hover:bg-secondary/10 rounded-full">
                <Icon name="cloud_upload" />
              </button>
            </div>
          ))}
        </div>
        <div className="p-6 border-2 border-dashed border-outline-variant rounded-xl text-center text-on-surface-variant">
          <Icon name="upload_file" className="text-4xl mb-2" />
          <p className="text-label-md">Drop additional files here or <span className="text-secondary underline">browse</span></p>
          <p className="text-xs mt-1">PDF, DOCX, JPG (Max 10MB per file)</p>
        </div>
      </section>

      {/* Sticky footer */}
      <div className="fixed bottom-0 right-0 left-0 md:left-[var(--shell-left,0)] z-30 bg-surface border-t border-outline-variant px-6 py-4 flex justify-between items-center shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <Button variant="ghost" onClick={() => navigate({ to: '/workforce/employees' })}>Cancel</Button>
        <div className="flex gap-3">
          <Button variant="outline">Save Draft</Button>
          <Button variant="primary" isLoading={saving} onClick={handleSave}>Save Employee</Button>
        </div>
      </div>
    </div>
  )
}
