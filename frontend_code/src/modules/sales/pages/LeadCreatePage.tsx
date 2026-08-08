import { CreatePageShell } from '@/shared/components/layout/CreatePageShell'

export function LeadCreatePage() {
  return (
    <CreatePageShell
      title="New Lead"
      listPath="/sales/leads"
      listLabel="Leads"
      entityLabel="Lead"
      namePlaceholder="e.g. Acme Corp – Website Redesign"
    />
  )
}
