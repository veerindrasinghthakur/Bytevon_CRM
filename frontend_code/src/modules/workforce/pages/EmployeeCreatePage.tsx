import { CreatePageShell } from '@/shared/components/layout/CreatePageShell'

export function EmployeeCreatePage() {
  return (
    <CreatePageShell
      title="New Employee"
      listPath="/workforce/employees"
      listLabel="Employees"
      entityLabel="Employee"
      namePlaceholder="e.g. Jane Doe"
    />
  )
}
