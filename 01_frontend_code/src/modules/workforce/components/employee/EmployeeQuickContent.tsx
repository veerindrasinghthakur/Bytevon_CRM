import {
  QuickSection,
  QuickMetaTile,
  QuickRelatedRow,
  QuickPersonRow,
} from '@/shared/components/layout/QuickOverviewParts'

type Props = {
  departmentName?: string
  positionName?: string
  employment_type: string
  hasLogin?: boolean
  email?: string
}

export function EmployeeQuickContent({
  departmentName,
  positionName,
  employment_type,
  hasLogin,
  email,
}: Props) {
  return (
    <>
      <QuickSection title="Assignment">
        <div className="space-y-3">
          <QuickPersonRow
            initials={(departmentName ?? 'DE').slice(0, 2)}
            roleLabel="Department"
            name={departmentName ?? '—'}
          />
          <QuickPersonRow
            initials={(positionName ?? 'PO').slice(0, 2)}
            roleLabel="Position"
            name={positionName ?? '—'}
          />
        </div>
      </QuickSection>
      <QuickSection title="Employment">
        <div className="grid grid-cols-2 gap-3">
          <QuickMetaTile icon="badge" label="Type" value={employment_type.replace(/_/g, ' ')} />
          <QuickMetaTile icon="login" label="Login" value={hasLogin ? 'Enabled' : 'No login'} />
        </div>
      </QuickSection>
      <QuickSection title="Related">
        <QuickRelatedRow icon="mail" label="Email" value={email ?? '—'} />
        <QuickRelatedRow icon="domain" label="Department" value={departmentName ?? '—'} />
        <QuickRelatedRow icon="work" label="Position" value={positionName ?? '—'} />
      </QuickSection>
    </>
  )
}
