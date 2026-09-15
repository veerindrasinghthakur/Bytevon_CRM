import type { EmployeeDetailDto } from '@/shared/schema'

type Props = {
  data: EmployeeDetailDto
  stateLabel: string
}

export function EmployeeOverviewTab({ data, stateLabel }: Props) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border border-outline-variant rounded-lg card-hover">
          <p className="text-label-sm text-on-surface-variant mb-1">Joining date</p>
          <p className="text-title-lg font-semibold">{data.employment?.joining_date ?? '—'}</p>
        </div>
        <div className="p-4 border border-outline-variant rounded-lg card-hover">
          <p className="text-label-sm text-on-surface-variant mb-1">Current state</p>
          <p className="text-title-lg font-semibold text-secondary">{stateLabel}</p>
        </div>
        <div className="p-4 border border-outline-variant rounded-lg card-hover">
          <p className="text-label-sm text-on-surface-variant mb-1">Employment type</p>
          <p className="text-title-lg font-semibold">{data.employment?.employment_type ?? '—'}</p>
        </div>
      </div>
      <p className="text-body-sm text-on-surface-variant">
        Full history and related records are available in the other tabs.
      </p>
    </>
  )
}
