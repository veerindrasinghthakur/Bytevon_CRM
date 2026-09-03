export const ApprovalStatus = ['Pending', 'Approved', 'Rejected', 'In-Progress'] as const
export type ApprovalStatus = (typeof ApprovalStatus)[number]

export const ApprovalPriority = ['High', 'Medium', 'Normal', 'Low'] as const
export type ApprovalPriority = (typeof ApprovalPriority)[number]



export const approvalPriorityStyles: Record<ApprovalPriority, string> = {
  High: 'status-badge status-error',
  Medium: 'status-badge status-warning',
  Normal: 'status-badge status-info',
  Low: 'status-badge status-neutral',
}

export const approvalPriorityDot: Record<ApprovalPriority, string> = {
  High: 'bg-error',
  Medium: 'bg-[var(--color-warning-amber)]',
  Normal: 'bg-secondary',
  Low: 'bg-outline',
}

export const approvalTypeOptions = [
  { value: 'All', label: 'All Request Types' },
  { value: 'Leave Request', label: 'Leave Request' },
  { value: 'Expense Claim', label: 'Expense Claim' },
  { value: 'Purchase Order', label: 'Purchase Order' },
] 

export const approvalStatusOptions = [
  { value: 'Pending', label: 'Status: Pending' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Rejected', label: 'Rejected' },
] 

export const approvalPriorityFilterOptions = [
  { value: 'All', label: 'All priority' },
  { value: 'High', label: 'High' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Normal', label: 'Normal' },
  { value: 'Low', label: 'Low' },
] 

export const approvalStatusStyles: Record<ApprovalStatus, string> = {
  'In-Progress': 'status-badge status-warning',
  Approved: 'status-badge status-success',
  Rejected: 'status-badge status-error',
  Pending: 'status-badge status-warning',
}

export const approvalStatusDot: Record<ApprovalStatus, string> = {
  'In-Progress': 'bg-[var(--color-warning-amber)]',
  Approved: 'bg-secondary',
  Rejected: 'bg-error',
  Pending: 'bg-[var(--color-warning-amber)]',
}

export const approvalRequestFilters = ['All Requests', 'In-Progress', 'Approved', 'Rejected'] as const