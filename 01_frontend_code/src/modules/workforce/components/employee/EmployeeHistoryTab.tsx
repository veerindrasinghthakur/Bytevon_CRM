import { Button } from '@/shared/components/ui/Button'
import { Select } from '@/shared/components/ui/Select'
import { EmploymentState } from '@/shared/schema'
import type { EmployeeDetailDto } from '@/shared/schema'

type Props = {
  data: EmployeeDetailDto
  currentState: string
  stateTarget: string
  setStateTarget: (v: string) => void
  saving: boolean
  onApplyState: () => void
  canChangeState: boolean
}

export function EmployeeHistoryTab({
  data,
  currentState,
  stateTarget,
  setStateTarget,
  saving,
  onApplyState,
  canChangeState,
}: Props) {
  return (
    <div className="space-y-4">
      {canChangeState && (
        <section className="p-4 rounded-xl border border-outline-variant bg-surface-container-low space-y-3">
          <h4 className="font-semibold">Change state</h4>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={stateTarget}
              onChange={setStateTarget}
              options={Object.values(EmploymentState).map((s) => ({
                value: s,
                label: s.replace(/_/g, ' '),
              }))}
              placeholder="Change state…"
              minWidthClass="min-w-[10rem]"
              aria-label="Change employment state"
            />
            <Button
              variant="primary"
              size="sm"
              disabled={!stateTarget || stateTarget === currentState || saving}
              isLoading={saving}
              onClick={onApplyState}
            >
              Apply
            </Button>
          </div>
        </section>
      )}
      <h4 className="font-semibold">State history</h4>
      {(data.stateHistory ?? []).length === 0 ? (
        <p className="text-body-sm text-on-surface-variant">No state changes recorded.</p>
      ) : (
        <ul className="space-y-2">
          {(data.stateHistory ?? []).map((h) => (
            <li key={h.id} className="p-3 border border-outline-variant rounded-lg text-sm">
              <span className="font-medium">{String(h.new_state).replace(/_/g, ' ')}</span>
              <span className="text-on-surface-variant"> · {h.effective_date}</span>
              {h.reason ? <p className="text-on-surface-variant mt-1">{h.reason}</p> : null}
            </li>
          ))}
        </ul>
      )}
      <h4 className="font-semibold pt-2">Assignments</h4>
      {(data.assignmentHistory ?? []).length === 0 ? (
        <p className="text-body-sm text-on-surface-variant">No assignment history.</p>
      ) : (
        <ul className="space-y-2">
          {(data.assignmentHistory ?? []).map((a) => (
            <li key={a.id} className="p-3 border border-outline-variant rounded-lg text-sm">
              {a.work_mode} · from {a.effective_from}
              {a.effective_to ? ` to ${a.effective_to}` : ' (current)'}
              {a.change_reason ? <p className="text-on-surface-variant mt-1">{a.change_reason}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
