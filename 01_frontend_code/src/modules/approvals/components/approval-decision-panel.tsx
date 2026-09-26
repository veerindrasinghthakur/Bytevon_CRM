import type { UseFormRegister } from 'react-hook-form'
import { Button } from '@/shared/components/ui/Button'
import { Can } from '@/shared/rbac'
import { Action } from '@/shared/schema'
import type { ApprovalActionFormInput } from '../schema/approval.schema'

export function ApprovalDecisionPanel({
  register,
  busy,
  isPending,
  onRunAction,
  onPostComment,
}: {
  register: UseFormRegister<ApprovalActionFormInput>
  busy: boolean
  isPending: boolean
  onRunAction: (action: ApprovalActionFormInput['action']) => void
  onPostComment: () => void
}) {
  return (
    <div className="bv-surface p-6 sticky top-24 space-y-4">
      <h4 className="text-title-lg font-semibold text-on-background mb-2">Decision Center</h4>
      <Can action={Action.APPROVE} resource="approval">
        <Button
          type="button"
          variant="primary"
          className="w-full justify-center py-3"
          leftIcon={
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              check_circle
            </span>
          }
          onClick={() => onRunAction('approved')}
          disabled={busy}
        >
          {isPending ? 'Working…' : 'Approve Request'}
        </Button>
      </Can>
      <Can action={Action.UPDATE} resource="approval">
        <Button
          type="button"
          variant="outline"
          className="w-full justify-center py-3 border-secondary text-secondary"
          leftIcon={<span className="material-symbols-outlined">edit_square</span>}
          onClick={() => onRunAction('revision')}
          disabled={busy}
        >
          Request Revision
        </Button>
      </Can>
      <Can action={Action.APPROVE} resource="approval">
        <Button
          type="button"
          variant="outline"
          className="w-full justify-center py-3 border-error text-error hover:bg-error/10"
          leftIcon={<span className="material-symbols-outlined">cancel</span>}
          onClick={() => onRunAction('rejected')}
          disabled={busy}
        >
          Reject Request
        </Button>
      </Can>

      <hr className="border-outline-variant my-4" />

      <h4 className="text-label-md font-bold uppercase text-on-surface-variant">Discussion</h4>
      <textarea
        {...register('comment')}
        className="w-full border border-outline-variant rounded-lg p-3 text-body-sm focus:ring-2 focus:ring-secondary min-h-[100px] bg-transparent outline-none transition-colors"
        placeholder="Add a comment or instruction…"
      />
      <div className="flex justify-between items-center">
        <button
          type="button"
          className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors"
        >
          attach_file
        </button>
        <Can action={Action.UPDATE} resource="approval">
          <Button type="button" variant="secondary" size="sm" onClick={onPostComment}>
            Post Comment
          </Button>
        </Can>
      </div>

      <div className="pt-4 border-t border-outline-variant">
        <div className="flex items-center gap-2 mb-2 text-on-surface-variant">
          <span className="material-symbols-outlined text-[18px]">info</span>
          <span className="text-label-sm uppercase tracking-widest font-bold">Policy Note</span>
        </div>
        <p className="text-body-sm text-on-surface-variant leading-relaxed italic">
          Significant requests may require secondary sign-off. Document your decision clearly for audit.
        </p>
      </div>
    </div>
  )
}
