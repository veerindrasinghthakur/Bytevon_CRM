import { useState } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { cn } from '@/shared/lib/cn'
import { changeLeadStage } from '../../api/sales'
import { stageStyles, PipelineStageValues, type PipelineStage } from '../../schemas/enums'
import type { UseMutationResult } from '@tanstack/react-query'
import type { Lead } from '../../types'

const FORWARD_STAGES = PipelineStageValues.filter((s) => s !== 'Lost') as PipelineStage[]

function nextPipelineStage(current: string): PipelineStage | null {
  const idx = FORWARD_STAGES.indexOf(current as PipelineStage)
  if (idx < 0 || idx >= FORWARD_STAGES.length - 1) return null
  return FORWARD_STAGES[idx + 1]
}

type UpdateLeadMut = UseMutationResult<
  Lead,
  Error,
  { id: string; patch: Partial<Lead> },
  { previousLead?: Lead }
>

type Props = {
  leadId: string
  stage: string
  updateLead: UpdateLeadMut
  onRefetch: () => Promise<unknown>
}

/** Pipeline stage chips + advance confirmation. */
export function LeadPipelineBar({ leadId, stage, updateLead, onRefetch }: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [stageError, setStageError] = useState<string | null>(null)
  const [advancing, setAdvancing] = useState(false)

  const currentIdx = PipelineStageValues.indexOf(stage as PipelineStage)
  const nextStage = nextPipelineStage(stage)
  const isTerminal = stage === 'Won' || stage === 'Lost'

  const handleAdvanceStage = async () => {
    if (!nextStage) return
    setStageError(null)
    setAdvancing(true)
    try {
      if (nextStage === 'Won') {
        await changeLeadStage(leadId, 'Won')
        await onRefetch()
      } else {
        await updateLead.mutateAsync({
          id: leadId,
          patch: { stage: nextStage, status: 'Active' },
        })
      }
      setConfirmOpen(false)
    } catch (err) {
      setStageError(getApiErrorMessage(err, 'Could not update stage'))
    } finally {
      setAdvancing(false)
    }
  }

  return (
    <div className="bv-surface p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-[10px] font-bold uppercase text-on-surface-variant">Pipeline stage</p>
        {!isTerminal && nextStage && (
          <div className="flex flex-col items-end gap-2 max-w-full">
            {!confirmOpen ? (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<span className="material-symbols-outlined text-[18px]">moving</span>}
                onClick={() => {
                  setStageError(null)
                  setConfirmOpen(true)
                }}
              >
                Update current status to {nextStage}
              </Button>
            ) : (
              <div className="flex flex-wrap items-center gap-2 justify-end">
                <p className="text-body-sm text-on-surface-variant w-full text-right sm:w-auto">
                  Move from <span className="font-semibold text-on-surface">{stage}</span> to{' '}
                  <span className="font-semibold text-on-surface">{nextStage}</span>?
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={advancing}
                  onClick={() => {
                    setConfirmOpen(false)
                    setStageError(null)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={advancing}
                  leftIcon={
                    <span className="material-symbols-outlined text-[18px]">
                      {advancing ? 'progress_activity' : 'check'}
                    </span>
                  }
                  onClick={() => void handleAdvanceStage()}
                >
                  {advancing ? 'Updating…' : `Confirm → ${nextStage}`}
                </Button>
              </div>
            )}
            {stageError && (
              <p className="text-body-sm text-error text-right" role="alert">
                {stageError}
              </p>
            )}
          </div>
        )}
        {isTerminal && (
          <p className="text-body-sm text-on-surface-variant">
            This lead is in a terminal stage ({stage}). Stage can no longer be advanced.
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {PipelineStageValues.filter((s) => s !== 'Lost').map((s, i, arr) => {
          const done = currentIdx >= i && stage !== 'Lost'
          const active = stage === s
          return (
            <div key={s} className="flex items-center gap-2">
              <span
                className={cn(
                  'px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-colors',
                  active
                    ? stageStyles[s]
                    : done
                      ? 'bg-secondary/15 text-secondary'
                      : 'bg-surface-container text-on-surface-variant',
                )}
              >
                {s}
              </span>
              {i < arr.length - 1 && (
                <span className="material-symbols-outlined text-on-surface-variant text-sm">
                  chevron_right
                </span>
              )}
            </div>
          )
        })}
        {stage === 'Lost' && (
          <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-bold uppercase', stageStyles.Lost)}>
            Lost
          </span>
        )}
      </div>
    </div>
  )
}
