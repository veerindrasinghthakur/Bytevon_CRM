import { useState } from 'react'
import { cn } from '@/shared/lib/cn'
import { Can } from '@/shared/rbac'
import { Action } from '@/shared/schema'

/** Two-step remove-member button: first click asks for confirmation. */
export function RemoveMemberButton({
  memberName,
  employmentId,
  disabled,
  isRemoving,
  onRemove,
  className,
}: {
  memberName: string
  employmentId: number | null | undefined
  disabled?: boolean
  isRemoving?: boolean
  onRemove: (employmentId: number) => void
  className?: string
}) {
  const [confirming, setConfirming] = useState(false)

  if (confirming) {
    return (
      <span className={cn('inline-flex items-center gap-1 text-body-sm', className)}>
        <span className="text-on-surface-variant hidden xl:inline">Remove {memberName}?</span>
        <button
          type="button"
          disabled={isRemoving}
          onClick={() => {
            if (employmentId != null) onRemove(employmentId)
            setConfirming(false)
          }}
          className="text-error hover:underline font-semibold disabled:opacity-40 px-1"
        >
          {isRemoving ? 'Removing…' : 'Confirm'}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="text-on-surface-variant hover:text-on-surface px-1"
        >
          Cancel
        </button>
      </span>
    )
  }

  return (
    <Can action={Action.DELETE} resource="project" minScope="TEAM">
      <button
        type="button"
        title={`Remove ${memberName}`}
        aria-label={`Remove ${memberName}`}
        disabled={disabled || employmentId == null}
        onClick={() => setConfirming(true)}
        className={cn('text-on-surface-variant hover:text-error disabled:opacity-40 p-1', className)}
      >
        <span className="material-symbols-outlined" aria-hidden>
          delete
        </span>
      </button>
    </Can>
  )
}
