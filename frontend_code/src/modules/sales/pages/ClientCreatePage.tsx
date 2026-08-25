import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { Select } from '@/shared/components/ui/Select'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { useClient, useCreateClient, useUpdateClient } from '../hooks/use-sales'
import { salesRoutes } from '../routes'
import type { ClientType, RecordStatus } from '../types'
import { cn } from '@/shared/lib/cn'

export type ClientContactForm = {
  id: string
  name: string
  designation: string
  email: string
  phone: string
}

function emptyContact(): ClientContactForm {
  return {
    id: `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: '',
    designation: '',
    email: '',
    phone: '',
  }
}

const fieldClass =
  'w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-body-md text-on-surface outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-colors'
const labelClass = 'block text-label-md text-on-surface-variant mb-1.5'

export function ClientCreatePage() {
  const navigate = useNavigate()
  const params = useParams({ strict: false }) as { clientId?: string }
  const isEdit = Boolean(params.clientId)

  const existingQuery = useClient(params.clientId)
  const createMut = useCreateClient()
  const updateMut = useUpdateClient()
  const existing = existingQuery.data

  const [name, setName] = useState('')
  const [legalName, setLegalName] = useState('')
  const [type, setType] = useState<ClientType>('SMB')
  const [status, setStatus] = useState<RecordStatus>('Active')
  const [industry, setIndustry] = useState('')
  const [website, setWebsite] = useState('')
  const [country, setCountry] = useState('')
  const [state, setState] = useState('')
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const [taxId, setTaxId] = useState('')
  const [founded, setFounded] = useState('')
  const [chatLink, setChatLink] = useState('')
  const [contacts, setContacts] = useState<ClientContactForm[]>([emptyContact()])
  const [editingContactId, setEditingContactId] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!existing) return
    setName(existing.name ?? '')
    setLegalName(existing.legalName ?? '')
    setType(existing.type ?? 'SMB')
    setStatus(existing.status ?? 'Active')
    setIndustry(existing.industry ?? '')
    setWebsite(existing.website ?? '')
    setCountry(existing.country ?? '')
    setAddress(existing.address ?? '')
    setTaxId(existing.taxId ?? '')
    setFounded(existing.founded ?? '')
    setChatLink(existing.chatLink ?? '')
    setContacts([
      {
        id: 'primary',
        name: existing.primaryContact ?? '',
        designation: '',
        email: existing.email ?? '',
        phone: existing.phone ?? '',
      },
    ])
  }, [existing])

  const updateContact = (id: string, patch: Partial<ClientContactForm>) => {
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  }

  const removeContact = (id: string) => {
    setContacts((prev) => (prev.length <= 1 ? prev : prev.filter((c) => c.id !== id)))
    if (editingContactId === id) setEditingContactId(null)
  }

  const saving = createMut.isPending || updateMut.isPending

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!name.trim()) {
      setError('Client name is required.')
      return
    }
    const primary = contacts[0]
    try {
      if (isEdit && params.clientId) {
        await updateMut.mutateAsync({
          id: params.clientId,
          patch: {
            name: name.trim(),
            legalName: legalName.trim() || undefined,
            type,
            status,
            industry: industry.trim() || '—',
            website: website.trim() || undefined,
            country: country.trim() || '—',
            address: address.trim() || undefined,
            taxId: taxId.trim() || undefined,
            founded: founded || undefined,
            chatLink: chatLink.trim() || undefined,
            primaryContact: primary?.name || undefined,
            email: primary?.email || undefined,
            phone: primary?.phone || undefined,
          },
        })
      } else {
        await createMut.mutateAsync({
          name: name.trim(),
          industry: industry.trim() || undefined,
          type,
          country: country.trim() || undefined,
        })
      }
      safeNavigate(navigate, { to: salesRoutes.clients })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    }
  }

  if (isEdit && existingQuery.isLoading) return <PageLoadingSkeleton />

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={isEdit ? 'Edit Client' : 'New Client'}
        description={
          isEdit
            ? 'Update account, location, and contact persons.'
            : 'Register a client account with full address fields and contact persons (schema-aligned).'
        }
        showBack
        backTo={salesRoutes.clients}
        backLabel="Back to clients"
        breadcrumbs={
          <nav className="text-body-sm text-on-surface-variant">
            <Link to={salesRoutes.root} className="hover:text-secondary">
              Sales
            </Link>
            <span className="mx-2">/</span>
            <Link to={salesRoutes.clients} className="hover:text-secondary">
              Clients
            </Link>
            <span className="mx-2">/</span>
            <span className="text-on-surface">{isEdit ? 'Edit' : 'New'}</span>
          </nav>
        }
      />

      {error && (
        <div className="rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-body-sm text-error" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5 max-w-3xl">
        <section className="bv-surface p-6 space-y-4">
          <h2 className="text-title-md font-semibold">Account</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelClass} htmlFor="name">
                Client name <span className="text-error">*</span>
              </label>
              <input
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={fieldClass}
                placeholder="Nexus Global Holdings"
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass} htmlFor="legalName">
                Legal name
              </label>
              <input
                id="legalName"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                className={fieldClass}
                placeholder="Nexus Global Holdings, Inc."
              />
            </div>
            <Select
              label="Type"
              value={type}
              onChange={(v) => setType(v as ClientType)}
              options={[
                { value: 'Enterprise', label: 'Enterprise' },
                { value: 'SMB', label: 'SMB' },
                { value: 'Partner', label: 'Partner' },
              ]}
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
            <div>
              <label className={labelClass} htmlFor="industry">
                Industry
              </label>
              <input
                id="industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className={fieldClass}
                placeholder="Technology"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="website">
                Website
              </label>
              <input
                id="website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className={fieldClass}
                placeholder="nexusglobal.com"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="taxId">
                Tax ID
              </label>
              <input
                id="taxId"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="founded">
                Founding date
              </label>
              <input
                id="founded"
                type="date"
                value={founded}
                onChange={(e) => setFounded(e.target.value)}
                className={fieldClass}
              />
            </div>
          </div>
        </section>

        <section className="bv-surface p-6 space-y-4">
          <h2 className="text-title-md font-semibold">Location</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="country">
                Country
              </label>
              <input
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className={fieldClass}
                placeholder="United States"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="state">
                State / Province
              </label>
              <input
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="city">
                City
              </label>
              <input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className={fieldClass}
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass} htmlFor="address">
                Address
              </label>
              <textarea
                id="address"
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={cn(fieldClass, 'resize-y')}
                placeholder="Street, building, postal code…"
              />
            </div>
          </div>
        </section>

        <section className="bv-surface p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-title-md font-semibold">Contact persons</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<span className="material-symbols-outlined text-[18px]">person_add</span>}
              onClick={() => {
                const c = emptyContact()
                setContacts((prev) => [...prev, c])
                setEditingContactId(c.id)
              }}
            >
              Add contact
            </Button>
          </div>
          <p className="text-body-sm text-on-surface-variant">
            One contact at a time. Click a card to expand and edit; add another for a different project contact.
          </p>

          <div className="space-y-3">
            {contacts.map((c, index) => {
              const open = editingContactId === c.id
              return (
                <div
                  key={c.id}
                  className={cn(
                    'rounded-xl border border-outline-variant bg-surface-container-lowest overflow-hidden',
                    open && 'ring-2 ring-secondary/30',
                  )}
                >
                  <button
                    type="button"
                    className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-surface-container-low/50 transition-colors"
                    onClick={() => setEditingContactId(open ? null : c.id)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-xs font-bold shrink-0">
                        {(c.name || '?')
                          .split(' ')
                          .map((p) => p[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-on-surface truncate">
                          {c.name || `Contact ${index + 1}`}
                        </p>
                        <p className="text-xs text-on-surface-variant truncate">
                          {[c.designation, c.email].filter(Boolean).join(' · ') || 'Click to edit'}
                        </p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant">
                      {open ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>

                  {open && (
                    <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-outline-variant pt-4">
                      <div>
                        <label className={labelClass} htmlFor={`contact-name-${c.id}`}>
                          Name <span className="text-error">*</span>
                        </label>
                        <input
                          id={`contact-name-${c.id}`}
                          required
                          value={c.name}
                          onChange={(e) => updateContact(c.id, { name: e.target.value })}
                          className={fieldClass}
                          placeholder="Sarah Jenkins"
                        />
                      </div>
                      <div>
                        <label className={labelClass} htmlFor={`contact-desig-${c.id}`}>
                          Designation
                        </label>
                        <input
                          id={`contact-desig-${c.id}`}
                          value={c.designation}
                          onChange={(e) => updateContact(c.id, { designation: e.target.value })}
                          className={fieldClass}
                          placeholder="Head of Procurement"
                        />
                      </div>
                      <div>
                        <label className={labelClass} htmlFor={`contact-email-${c.id}`}>
                          Email
                        </label>
                        <input
                          id={`contact-email-${c.id}`}
                          type="email"
                          value={c.email}
                          onChange={(e) => updateContact(c.id, { email: e.target.value })}
                          className={fieldClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass} htmlFor={`contact-phone-${c.id}`}>
                          Phone
                        </label>
                        <input
                          id={`contact-phone-${c.id}`}
                          value={c.phone}
                          onChange={(e) => updateContact(c.id, { phone: e.target.value })}
                          className={fieldClass}
                        />
                      </div>
                      {contacts.length > 1 && (
                        <div className="md:col-span-2 flex justify-end">
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeContact(c.id)}>
                            Remove contact
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        <section className="rounded-xl border border-secondary/30 bg-secondary/5 p-6 space-y-4 executive-shadow">
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
            {isEdit ? 'Save changes' : 'Create client'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => safeNavigate(navigate, { to: salesRoutes.clients })}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
