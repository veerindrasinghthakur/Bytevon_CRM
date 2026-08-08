import { CreatePageShell } from '@/shared/components/layout/CreatePageShell'

export function ClientCreatePage() {
  return (
    <CreatePageShell
      title="New Client"
      listPath="/sales/clients"
      listLabel="Clients"
      entityLabel="Client"
      namePlaceholder="e.g. Nexus Global"
    />
  )
}
