import type { ApprovalRow } from './request.types'

export interface ApproverOption {
  value: string
  label: string
}

export type DecideAction = 'approve' | 'reject' | 'revision'

export interface ApprovalQuickContentProps {
  row: ApprovalRow
}
