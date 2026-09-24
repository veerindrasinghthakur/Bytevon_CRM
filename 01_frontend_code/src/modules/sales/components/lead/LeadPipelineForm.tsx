import type { UseFormReturn } from 'react-hook-form'
import { Select } from '@/shared/components/ui/Select'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import type { LeadFormSchemaInput } from '../../schemas/lead/lead-form'
import {
  LeadPriorityOptions,
  PipelineStageOptions,
  RecordStatusOptions,
  type LeadPriority,
  type PipelineStage,
  type RecordStatus,
} from '../../schemas/enums'

type SelectOption = { value: string; label: string }

type Props = {
  form: UseFormReturn<LeadFormSchemaInput>
  stageValue: string
  priorityValue: string
  statusValue: string
  platformValue: string
  stages: string[]
  priorities: string[]
  statuses: string[]
  platformOptions: SelectOption[]
  platformsLoading: boolean
  platformsError: unknown
  platformsEmpty: boolean
}

/** Pipeline stage, priority, status, and source selects. */
export function LeadPipelineForm({
  form,
  stageValue,
  priorityValue,
  statusValue,
  platformValue,
  stages,
  priorities,
  platformOptions,
  platformsLoading,
  platformsError,
  platformsEmpty,
}: Props) {
  return (
    <section className="bv-surface p-6 space-y-4">
      <h2 className="text-title-md font-semibold text-on-background flex items-center gap-2">
        <span className="material-symbols-outlined text-secondary">filter_alt</span>
        Pipeline & status
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Select
          label="Stage"
          value={stageValue}
          onChange={(v) => form.setValue('stage', v as PipelineStage)}
          options={[
            ...PipelineStageOptions,
            ...stages
              .filter((s) => !PipelineStageOptions.some((option) => option.value === s))
              .map((s) => ({ value: s, label: s })),
          ]}
          minWidthClass="w-full"
        />
        <Select
          label="Priority"
          value={priorityValue}
          onChange={(v) => form.setValue('priority', v as LeadPriority)}
          options={[
            ...LeadPriorityOptions,
            ...priorities
              .filter((p) => !LeadPriorityOptions.some((option) => option.value === p))
              .map((p) => ({ value: p, label: p })),
          ]}
          minWidthClass="w-full"
        />
        <Select
          label="Status"
          value={statusValue}
          onChange={(v) => form.setValue('status', v as RecordStatus)}
          options={[...RecordStatusOptions]}
          minWidthClass="w-full"
        />
        <div>
          <Select
            label="Source"
            value={platformValue}
            onChange={(v) => form.setValue('platformId', v)}
            options={platformOptions}
            minWidthClass="w-full"
            disabled={platformsLoading}
          />
          {platformsError != null && (
            <p className="text-[11px] text-error mt-1">
              {getApiErrorMessage(platformsError, 'Failed to load sources')}
            </p>
          )}
          {!platformsLoading && platformsError == null && platformsEmpty && (
            <p className="text-[11px] text-on-surface-variant mt-1">
              No platforms configured. Add sources under Sales platforms.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
