import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { adminRoles } from '../data/mock'
import type { AdminRole } from '../types'

function delay(ms = 200) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function listAdminRoles(): Promise<AdminRole[]> {
  if (env.useMockApi) {
    await delay()
    return adminRoles.map((r) => ({ ...r }))
  }
  const { data } = await apiClient.get<AdminRole[]>('/admin/roles')
  return data
}

export async function getAdminRole(roleId: string): Promise<AdminRole | null> {
  if (env.useMockApi) {
    await delay()
    return adminRoles.find((r) => r.id === roleId) ?? null
  }
  try {
    const { data } = await apiClient.get<AdminRole>(`/admin/roles/${roleId}`)
    return data
  } catch {
    return null
  }
}

export async function createAdminRole(payload: {
  name: string
  description: string
  status: 'Active' | 'Archived'
}): Promise<AdminRole> {
  if (env.useMockApi) {
    await delay(300)
    return {
      id: `R-${Date.now()}`,
      name: payload.name,
      description: payload.description,
      usersCount: 0,
      permissions: [],
      status: payload.status,
      category: 'Standard',
      coveragePct: 0,
      coverageLabel: '0/18 Modules',
      created: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      updated: 'just now',
    }
  }
  const { data } = await apiClient.post<AdminRole>('/admin/roles', payload)
  return data
}

export async function updateAdminRole(
  roleId: string,
  payload: Partial<Pick<AdminRole, 'name' | 'description' | 'status' | 'permissions'>>,
): Promise<AdminRole> {
  if (env.useMockApi) {
    await delay(300)
    const existing = adminRoles.find((r) => r.id === roleId)
    if (!existing) throw new Error('Role not found')
    return { ...existing, ...payload, updated: 'just now' }
  }
  const { data } = await apiClient.patch<AdminRole>(`/admin/roles/${roleId}`, payload)
  return data
}
