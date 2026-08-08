import { CreatePageShell } from '@/shared/components/layout/CreatePageShell'

export function DepartmentCreatePage() {
  return (
    <CreatePageShell
      title="New Department"
      listPath="/workforce/departments"
      listLabel="Departments"
      entityLabel="Department"
      namePlaceholder="e.g. Engineering"
    />
  )
}
