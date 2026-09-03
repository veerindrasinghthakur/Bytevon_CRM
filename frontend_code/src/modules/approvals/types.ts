import type { ApprovalStatus, ApprovalPriority } from './enums'

export type { ApprovalStatus, ApprovalPriority } from './enums'

export interface ApprovalRow {
  id: string
  type: string
  typeIcon: string
  typeColor: string
  requester: string
  requesterInitials: string
  date: string
  priority: ApprovalPriority
  status: ApprovalStatus
  stage?: string
  approver?: string
}

export interface ApprovalKpis {
  total: number
  pending: number
  approvedToday: number
  rejectedToday: number
  overdue: number
}

export interface ApproverOption {
  value: string
  label: string
}

