import { z } from 'zod'

// --- Form state shape (string fields for controlled inputs) ---
// Maps to Create*Input on submit; transforms numeric/date fields

export const UserFormSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().optional(),
  role: z.string().optional(),
  status: z.enum(['Active', 'Inactive', 'Locked']).optional(),
  department: z.string().optional(),
})

export type UserFormInput = z.infer<typeof UserFormSchema>

export const RoleFormSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().optional(),
  status: z.enum(['Active', 'Archived']).optional(),
  permissions: z.array(z.enum(['VIEW', 'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'EXPORT', 'UNLOCK'])).optional(),
})

export type RoleFormInput = z.infer<typeof RoleFormSchema>

export const LeavePolicyFormSchema = z.object({
  name: z.string().min(1).max(120),
  leaveType: z.enum(['CASUAL', 'SICK', 'EARNED', 'MATERNITY']).optional(),
  annualEntitlement: z.number().int().min(0).optional(),
  carryForwardLimit: z.number().int().min(0).optional(),
  effectiveFrom: z.string().optional(),
  effectiveTo: z.string().nullable().optional(),
})

export type LeavePolicyFormInput = z.infer<typeof LeavePolicyFormSchema>

export const OfficeFormSchema = z.object({
  name: z.string().min(2).max(120),
  country: z.string().optional(),
  city: z.string().optional(),
  timezone: z.string().optional(),
  currency: z.string().optional(),
})

export type OfficeFormInput = z.infer<typeof OfficeFormSchema>

export const AuditFormSchema = z.object({
  action: z.string().min(1).max(200),
  target: z.string().optional(),
  module: z.string().optional(),
  actor: z.string().optional(),
  actorInitials: z.string().max(2).optional(),
  ip: z.string().optional(),
})

export type AuditFormInput = z.infer<typeof AuditFormSchema>

// Empty form factories

export const emptyUserForm = (): UserFormInput => ({
  name: '',
  email: '',
  role: '',
  status: 'Active',
  department: '',
})

export const emptyRoleForm = (): RoleFormInput => ({
  name: '',
  description: '',
  status: 'Active',
  permissions: [],
})

export const emptyLeavePolicyForm = (): LeavePolicyFormInput => ({
  name: '',
  leaveType: 'CASUAL',
  annualEntitlement: 12,
  carryForwardLimit: 3,
  effectiveFrom: new Date().toISOString().slice(0, 10),
  effectiveTo: null,
})

export const emptyOfficeForm = (): OfficeFormInput => ({
  name: '',
  country: '',
  city: '',
  timezone: '',
  currency: '',
})

export const emptyAuditForm = (): AuditFormInput => ({
  action: '',
  target: '',
  module: '',
  actor: '',
  actorInitials: '',
  ip: '',
})
