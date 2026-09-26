/**
 * Canonical approval status/priority types (moved from root enums.ts).
 * The runtime const arrays live in lib/approval-enums.ts.
 */
export type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected' | 'In-Progress'

export type ApprovalPriority = 'High' | 'Medium' | 'Normal' | 'Low'
