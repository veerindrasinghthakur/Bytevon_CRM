/** Approvals domain types */

export type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected' | 'In-Progress'
export type ApprovalPriority = 'High' | 'Medium' | 'Normal' | 'Low'

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
