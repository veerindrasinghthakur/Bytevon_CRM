import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { paginateItems } from '@/shared/lib/list-params'
import { permissionCatalogSeed } from '../data/rbac-catalog'
import { adminRoles } from '../data/mock'
import type { AdminRole, PermissionCatalog, RolePermissionAction } from '../types'

import { delay} from '@/shared/mock/db'


const TOTAL_MODULES = 18

/** Derive coverage from permission keys (module-ish tokens). */
export function computeCoverage(permissions: string[]): { pct: number; label: string } {
  if (!permissions?.length) return { pct: 0, label: '0 modules' }
  const modules = new Set<
    string
  >()
  for (const p of permissions) {
    const part = p.split(/[./_]/)[0]?.toLowerCase()
    if (part) modules.add(part)
  }
  if (permissions.some((p) => p.includes('manage') || p.includes('security') || p === '*')) {
    return { pct: 100, label: 'Full Access' }
  }
  const count = Math.min(modules.size, TOTAL_MODULES)
  const pct = Math.round((count / TOTAL_MODULES) * 100)
  return { pct, label: `${count}/${TOTAL_MODULES} Modules` }
}

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
    apiClient.get<Array<{ id: number; name: string; description?: string | null }>>('/rbac/resources'),
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
    resource_name:
      p.resource_name ?? p.resource?.name ?? nameById[p.resource_id] ?? String(p.resource_id),
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

export async function listAdminRoles(params?: {
  search?: string
  status?: string
  category?: string
  page?: number
  pageSize?: number
}): Promise<{ items: AdminRole[]; total: number } | AdminRole[]> {
  if (env.useMockApi) {
    await delay()
    let items = adminRoles.map((r) => {
      const cov = computeCoverage(r.permissions ?? [])
      return {
        ...r,
        coveragePct: cov.pct,
        coverageLabel: cov.label,
      }
    })
    if (params?.search) {
      const q = params.search.toLowerCase()
      items = items.filter(
        (r) => r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q),
      )
    }
    if (params?.status && params.status !== 'All') {
      items = items.filter((r) => r.status === params.status)
    }
    if (params?.category && params.category !== 'All') {
      items = items.filter((r) => r.category === params.category)
    }
    if (params?.page != null || params?.pageSize != null) {
      return paginateItems(items, params.page, params.pageSize)
    }
    return items
  }
  const { data } = await apiClient.get<AdminRole[] | { items: AdminRole[]; total: number }>(
    '/rbac/roles',
    { params },
  )
  if (Array.isArray(data)) {
    return data.map((r) => {
      const cov = computeCoverage(r.permissions ?? [])
      return {
        ...r,
        coveragePct: r.coveragePct ?? cov.pct,
        coverageLabel: r.coverageLabel ?? cov.label,
      }
    })
  }
  return {
    items: (data.items ?? []).map((r) => {
      const cov = computeCoverage(r.permissions ?? [])
      return {
        ...r,
        coveragePct: r.coveragePct ?? cov.pct,
        coverageLabel: r.coverageLabel ?? cov.label,
      }
    }),
    total: data.total,
  }
}

export async function getAdminRole(roleId: string): Promise<AdminRole | null> {
  if (env.useMockApi) {
    await delay()
    const r = adminRoles.find((x) => x.id === roleId)
    if (!r) return null
    const cov = computeCoverage(r.permissions ?? [])
    return { ...r, coveragePct: cov.pct, coverageLabel: cov.label }
  }
  try {
    const { data } = await apiClient.get<AdminRole>(`/rbac/roles/${roleId}`)
    const cov = computeCoverage(data.permissions ?? [])
    return { ...data, coveragePct: data.coveragePct ?? cov.pct, coverageLabel: data.coverageLabel ?? cov.label }
  } catch {
    return null
  }
}

export async function createAdminRole(payload: {
  name: string
  description: string
  status: 'Active' | 'Archived'
  permissions?: string[]
}): Promise<AdminRole> {
  if (env.useMockApi) {
    await delay(300)
    const perms = payload.permissions ?? []
    const cov = computeCoverage(perms)
    const row: AdminRole = {
      id: `R-${Date.now()}`,
      name: payload.name,
      description: payload.description,
      usersCount: 0,
      permissions: perms,
      status: payload.status,
      category: 'Standard',
      coveragePct: cov.pct,
      coverageLabel: cov.label,
      created: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      }),
      updated: 'just now',
    }
    adminRoles.push(row)
    return { ...row }
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
    Object.assign(existing, payload, { updated: 'just now' })
    if (payload.permissions) {
      const cov = computeCoverage(payload.permissions)
      existing.coveragePct = cov.pct
      existing.coverageLabel = cov.label
      existing.permissions = payload.permissions
    } else {
      const cov = computeCoverage(existing.permissions ?? [])
      existing.coveragePct = cov.pct
      existing.coverageLabel = cov.label
    }
    return { ...existing }
  }
  const { data } = await apiClient.patch<AdminRole>(`/rbac/roles/${roleId}`, payload)
  return data
}

export async function deleteAdminRole(roleId: string): Promise<void> {
  if (env.useMockApi) {
    await delay(300)
    const idx = adminRoles.findIndex((r) => r.id === roleId)
    if (idx >= 0) adminRoles.splice(idx, 1)
    return
  }
  await apiClient.delete(`/rbac/roles/${roleId}`)
}
