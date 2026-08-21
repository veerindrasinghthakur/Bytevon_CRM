import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { permissionCatalogSeed } from '../data/rbac-catalog'
import { adminRoles } from '../data/mock'
import type { AdminRole, PermissionCatalog, RolePermissionAction } from '../types'

function delay(ms = 200) {
  return new Promise((r) => setTimeout(r, ms))
}

/**
 * Seeded RBAC catalogue: resources (modules) + actions.
 * Backend: GET /rbac/resources + /rbac/permissions (or combined).
 * Mock returns permissionCatalogSeed shaped like DB seed.
 */
export async function listPermissionCatalog(): Promise<PermissionCatalog> {
  if (env.useMockApi) {
    await delay()
    return {
      modules: [...permissionCatalogSeed.modules],
      actions: [...permissionCatalogSeed.actions],
      resources: permissionCatalogSeed.resources.map((r) => ({ ...r })),
      permissions: permissionCatalogSeed.permissions.map((p) => ({ ...p })),
    }
  }

  const [resourcesRes, permissionsRes] = await Promise.all([
    apiClient.get<Array<{ id: number; name: string; description?: string | null }>>(
      '/rbac/resources',
    ),
    apiClient.get<
      Array<{
        id: number
        resource_id: number
        action: RolePermissionAction
        resource?: { name: string }
        resource_name?: string
      }>
    >('/rbac/permissions'),
  ])

  const resources = resourcesRes.data.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description ?? null,
  }))
  const nameById = Object.fromEntries(resources.map((r) => [r.id, r.name]))

  const permissions = permissionsRes.data.map((p) => ({
    id: p.id,
    resource_id: p.resource_id,
    resource_name: p.resource_name ?? p.resource?.name ?? nameById[p.resource_id] ?? String(p.resource_id),
    action: p.action,
  }))

  const modules = resources.map((r) => r.name)
  const actionSet = new Set<RolePermissionAction>(permissions.map((p) => p.action))
  const actionOrder: RolePermissionAction[] = [
    'VIEW',
    'CREATE',
    'UPDATE',
    'DELETE',
    'APPROVE',
    'EXPORT',
  ]
  const actions = actionOrder.filter((a) => actionSet.has(a))
  for (const a of actionSet) {
    if (!actions.includes(a)) actions.push(a)
  }

  return { modules, actions, resources, permissions }
}

export async function listAdminRoles(): Promise<AdminRole[]> {
  if (env.useMockApi) {
    await delay()
    return adminRoles.map((r) => ({ ...r }))
  }
  const { data } = await apiClient.get<AdminRole[]>('/rbac/roles')
  return data
}

export async function getAdminRole(roleId: string): Promise<AdminRole | null> {
  if (env.useMockApi) {
    await delay()
    return adminRoles.find((r) => r.id === roleId) ?? null
  }
  try {
    const { data } = await apiClient.get<AdminRole>(`/rbac/roles/${roleId}`)
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
      coverageLabel: '0 modules',
      created: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      }),
      updated: 'just now',
    }
  }
  const { data } = await apiClient.post<AdminRole>('/rbac/roles', payload)
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
  const { data } = await apiClient.patch<AdminRole>(`/rbac/roles/${roleId}`, payload)
  return data
}
