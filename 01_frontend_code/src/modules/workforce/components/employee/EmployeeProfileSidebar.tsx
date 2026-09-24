import { Button } from '@/shared/components/ui/Button'
import type { EmployeeDetailDto } from '@/shared/schema'
import { Icon } from './employee-detail-utils'

type Props = {
  data: EmployeeDetailDto
  fullName: string
  initials: string
  manager?: { name: string; code: string; employmentId: number } | null
  onLinkDepartment?: () => void
}

export function EmployeeProfileSidebar({ data, fullName, initials, manager, onLinkDepartment }: Props) {
  return (
    <div className="xl:col-span-3 space-y-4">
      <div className="bv-surface card-hover p-6 text-center">
        <div className="w-28 h-28 mx-auto rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-3xl font-bold mb-3">
          {initials}
        </div>
        <h2 className="text-title-lg font-semibold">{fullName}</h2>
        <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-4">
          {data.employment?.employee_code}
        </p>
        <div className="text-left space-y-3 border-t border-outline-variant pt-4">
          {data.person?.personal_email && (
            <div className="flex gap-3">
              <Icon name="mail" className="text-secondary" />
              <div>
                <p className="text-label-sm text-on-surface-variant">Personal email</p>
                <p className="text-body-sm">{data.person.personal_email}</p>
              </div>
            </div>
          )}
          {data.person?.personal_phone && (
            <div className="flex gap-3">
              <Icon name="call" className="text-secondary" />
              <div>
                <p className="text-label-sm text-on-surface-variant">Phone</p>
                <p className="text-body-sm">{data.person.personal_phone}</p>
              </div>
            </div>
          )}
          {data.location && (
            <div className="flex gap-3">
              <Icon name="location_on" className="text-secondary" />
              <div>
                <p className="text-label-sm text-on-surface-variant">Location</p>
                <p className="text-body-sm">{data.location.name}</p>
              </div>
            </div>
          )}
        </div>
        <div className="mt-4 p-3 bg-surface-container-low rounded-lg text-left space-y-2">
          <div>
            <p className="text-label-sm text-on-surface-variant">Department</p>
            <p className="font-semibold text-sm">{data.department?.name ?? '—'}</p>
          </div>
          <div>
            <p className="text-label-sm text-on-surface-variant">Position</p>
            <p className="font-medium text-sm">{data.position?.name ?? '—'}</p>
          </div>
          <div>
            <p className="text-label-sm text-on-surface-variant">Shift</p>
            <p className="font-medium text-sm">{data.shift?.name ?? '—'}</p>
          </div>
          <div>
            <p className="text-label-sm text-on-surface-variant">Work mode</p>
            <p className="font-medium text-sm">{data.currentAssignment?.work_mode ?? '—'}</p>
          </div>
          {(data.roleNames?.length ?? 0) > 0 && (
            <div>
              <p className="text-label-sm text-on-surface-variant">Roles</p>
              <p className="font-medium text-sm">{data.roleNames.join(', ')}</p>
            </div>
          )}
        </div>
      </div>

      <div className="bv-surface p-5 card-hover">
        <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-3">
          Reporting manager
        </p>
        {manager ? (
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-secondary/15 text-secondary flex items-center justify-center font-bold">
              {manager.name
                .split(' ')
                .map((p) => p[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-sm text-on-background">{manager.name}</p>
              <p className="text-xs text-on-surface-variant">{manager.code}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center">
              <Icon name="supervisor_account" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-on-background">Not linked</p>
              <p className="text-xs text-on-surface-variant">No department head assigned</p>
            </div>
          </div>
        )}
        {!manager && onLinkDepartment && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            leftIcon={<Icon name="link" />}
            onClick={onLinkDepartment}
          >
            Link department
          </Button>
        )}
      </div>
    </div>
  )
}
