import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { looseLinkProps, safeNavigate } from '@/shared/lib/safeNavigate'
import { useClient, useCreateClient, useUpdateClient, useClientContacts } from '../../hooks/use-sales'
import { addClientContact, listClientContacts } from '../../api/client'
import { env } from '@/config/env'
import { salesRoutes } from '../../routes'
import {
  clientFormSchema,
  emptyClientContact,
  type ClientFormSchemaInput,
} from '../../schemas/client/client-form'
import { ClientAccountForm } from '../../components/client/ClientAccountForm'
import { ClientLocationForm } from '../../components/client/ClientLocationForm'
import { ClientContactsForm } from '../../components/client/ClientContactsForm'
import { ClientChatForm } from '../../components/client/ClientChatForm'
import { ClientFormActions } from '../../components/client/ClientFormActions'

export function ClientCreatePage() {
  const navigate = useNavigate()
  const params = useParams({ strict: false }) as { clientId?: string }
  const isEdit = Boolean(params.clientId)

  const existingQuery = useClient(params.clientId)
  const createMut = useCreateClient()
  const updateMut = useUpdateClient()
  const existing = existingQuery.data
  const existingContactsQuery = useClientContacts(isEdit ? params.clientId : undefined)

  const form = useForm<ClientFormSchemaInput>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: '',
      legalName: '',
      type: 'SMB',
      status: 'Active',
      industry: '',
      website: '',
      country: '',
      state: '',
      city: '',
      address: '',
      taxId: '',
      founded: '',
      chatLink: '',
      contacts: [emptyClientContact()],
    },
  })

  const { fields: contacts, append, remove } = useFieldArray({
    control: form.control,
    name: 'contacts',
  })

  const watchedContacts = form.watch('contacts') ?? []
  const [editingContactId, setEditingContactId] = useState<string | null>(null)

  useEffect(() => {
    if (!existing) return
    const saved = existingContactsQuery.data
    form.reset({
      name: existing.name ?? '',
      legalName: existing.legalName ?? '',
      type: existing.type ?? 'SMB',
      status: existing.status ?? 'Active',
      industry: existing.industry ?? '',
      website: existing.website ?? '',
      country: existing.country ?? '',
      state: existing.state ?? '',
      city: existing.city ?? '',
      address: existing.address ?? '',
      taxId: existing.taxId ?? '',
      founded: existing.founded ?? '',
      chatLink: existing.chatLink ?? '',
      contacts:
        saved && saved.length > 0
          ? saved.map((c, i) => ({
              id: `saved-${i}`,
              name: c.name,
              designation: c.designation ?? '',
              email: c.email ?? '',
              phone: c.phone ?? '',
            }))
          : [
              {
                id: 'primary',
                name: existing.primaryContact ?? '',
                designation: '',
                email: existing.email ?? '',
                phone: existing.phone ?? '',
              },
            ],
    })
  }, [existing, existingContactsQuery.data, form])

  const saving = createMut.isPending || updateMut.isPending

  const onSubmit = async (data: ClientFormSchemaInput) => {
    const primary = data.contacts[0]
    const payload = {
      name: data.name.trim(),
      legalName: data.legalName?.trim() || undefined,
      type: data.type,
      status: data.status,
      industry: data.industry?.trim() || undefined,
      website: data.website?.trim() || undefined,
      country: data.country?.trim() || undefined,
      state: data.state?.trim() || undefined,
      city: data.city?.trim() || undefined,
      address: data.address?.trim() || undefined,
      taxId: data.taxId?.trim() || undefined,
      founded: data.founded || undefined,
      chatLink: data.chatLink?.trim() || undefined,
      primaryContact: primary?.name || undefined,
      email: primary?.email || undefined,
      phone: primary?.phone || undefined,
    }
    try {
      let savedId = params.clientId
      if (isEdit && params.clientId) {
        await updateMut.mutateAsync({
          id: params.clientId,
          patch: {
            ...payload,
            industry: data.industry?.trim() || '—',
            country: data.country?.trim() || '—',
          },
        })
      } else {
        const created = await createMut.mutateAsync(payload)
        savedId = created.id
      }
      // Persist contact persons (backend stores them separately).
      if (savedId && !env.useMockApi) {
        const existingContacts = isEdit
          ? await listClientContacts(savedId).catch(() => [])
          : []
        const seen = new Set(
          existingContacts.map((c) => `${c.name}::${c.email ?? ''}`.toLowerCase()),
        )
        for (const c of data.contacts) {
          const name = c.name?.trim()
          if (!name) continue
          const key = `${name}::${c.email?.trim() ?? ''}`.toLowerCase()
          if (seen.has(key)) continue
          seen.add(key)
          await addClientContact(savedId, {
            name,
            designation: c.designation?.trim() || undefined,
            email: c.email?.trim() || undefined,
            phone: c.phone?.trim() || undefined,
          })
        }
      }
      safeNavigate(navigate, { to: salesRoutes.clients })
    } catch (err) {
      form.setError('root', { message: err instanceof Error ? err.message : 'Save failed' })
    }
  }

  const addContact = () => {
    const c = emptyClientContact()
    append(c)
    setEditingContactId(c.id)
  }

  const removeContact = (id: string) => {
    if (contacts.length <= 1) return
    const idx = contacts.findIndex((c) => c.id === id)
    if (idx < 0) return
    remove(idx)
    if (editingContactId === id) setEditingContactId(null)
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
            <Link {...looseLinkProps({ to: salesRoutes.root, className: 'hover:text-secondary' })}>
              Sales
            </Link>
            <span className="mx-2">/</span>
            <Link {...looseLinkProps({ to: salesRoutes.clients, className: 'hover:text-secondary' })}>
              Clients
            </Link>
            <span className="mx-2">/</span>
            <span className="text-on-surface">{isEdit ? 'Edit' : 'New'}</span>
          </nav>
        }
      />

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 max-w-3xl">
        <ClientAccountForm form={form} />
        <ClientLocationForm form={form} />
        <ClientContactsForm
          form={form}
          contacts={contacts}
          watchedContacts={watchedContacts}
          editingContactId={editingContactId}
          setEditingContactId={setEditingContactId}
          onAdd={addContact}
          onRemove={removeContact}
        />
        <ClientChatForm form={form} />
        <ClientFormActions
          isEdit={isEdit}
          saving={saving}
          onCancel={() => safeNavigate(navigate, { to: salesRoutes.clients })}
        />
      </form>
    </div>
  )
}
