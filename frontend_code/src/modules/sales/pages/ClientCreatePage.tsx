import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import type { ClientType, RecordStatus } from '../types'

export function ClientCreatePage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [legalName, setLegalName] = useState('')
  const [type, setType] = useState<ClientType>('SMB')
  const [status, setStatus] = useState<RecordStatus>('Active')
  const [industry, setIndustry] = useState('')
  const [country, setCountry] = useState('')
  const [website, setWebsite] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [primaryContact, setPrimaryContact] = useState('')
  const [chatLink, setChatLink] = useState('')
  const [saving, setSaving] = useState(false)

  const fieldClass =
    'w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-body-md text-on-surface outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20'
  const labelClass = 'block text-label-md text-on-surface-variant mb-1.5'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await new Promise((r) => setTimeout(r, 400))
    setSaving(false)
    navigate({ to: '/sales/clients' })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Client"
        description="Register a client account and optional chat link."
        showBack
        backTo="/sales/clients"
        backLabel="Back to clients"
        breadcrumbs={
          <nav className="text-body-sm text-on-surface-variant">
            <Link to="/sales" className="hover:text-secondary">
              Sales
            </Link>
            <span className="mx-2">/</span>
            <Link to="/sales/clients" className="hover:text-secondary">
              Clients
            </Link>
            <span className="mx-2">/</span>
            <span className="text-on-surface">New</span>
          </nav>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-5 max-w-3xl">
        <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 space-y-4">
          <h2 className="text-title-md font-semibold">Account</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelClass} htmlFor="name">
                Client name <span className="text-error">*</span>
              </label>
              <input id="name" required value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} placeholder="Nexus Global Holdings" />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass} htmlFor="legalName">
                Legal name
              </label>
              <input id="legalName" value={legalName} onChange={(e) => setLegalName(e.target.value)} className={fieldClass} placeholder="Nexus Global Holdings, Inc." />
            </div>
            <div>
              <label className={labelClass} htmlFor="type">
                Type
              </label>
              <select id="type" value={type} onChange={(e) => setType(e.target.value as ClientType)} className={fieldClass}>
                <option value="Enterprise">Enterprise</option>
                <option value="SMB">SMB</option>
                <option value="Partner">Partner</option>
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="status">
                Status
              </label>
              <select id="status" value={status} onChange={(e) => setStatus(e.target.value as RecordStatus)} className={fieldClass}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="industry">
                Industry
              </label>
              <input id="industry" value={industry} onChange={(e) => setIndustry(e.target.value)} className={fieldClass} placeholder="Technology" />
            </div>
            <div>
              <label className={labelClass} htmlFor="country">
                Country
              </label>
              <input id="country" value={country} onChange={(e) => setCountry(e.target.value)} className={fieldClass} placeholder="United States" />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 space-y-4">
          <h2 className="text-title-md font-semibold">Contact</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="primaryContact">
                Primary contact
              </label>
              <input id="primaryContact" value={primaryContact} onChange={(e) => setPrimaryContact(e.target.value)} className={fieldClass} placeholder="Sarah Jenkins" />
            </div>
            <div>
              <label className={labelClass} htmlFor="email">
                Email
              </label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={fieldClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="phone">
                Phone
              </label>
              <input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className={fieldClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="website">
                Website
              </label>
              <input id="website" value={website} onChange={(e) => setWebsite(e.target.value)} className={fieldClass} placeholder="nexusglobal.com" />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-secondary/30 bg-secondary/5 p-6 space-y-4">
          <h2 className="text-title-md font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">chat</span>
            Chat with client
          </h2>
          <input
            type="url"
            value={chatLink}
            onChange={(e) => setChatLink(e.target.value)}
            className={fieldClass}
            placeholder="https://chat.bytevon.app/c/..."
          />
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit" variant="primary" isLoading={saving}>
            Create client
          </Button>
          <Button type="button" variant="ghost" onClick={() => navigate({ to: '/sales/clients' })}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
