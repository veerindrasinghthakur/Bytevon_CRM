import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { paginateItems } from '@/shared/lib/list-params'
import { permissionCatalogSeed } from '../data/rbac-catalog'
import { adminRoles } from '../data/mock'
import type { AdminRole, PermissionCatalog, RolePermissionAction } from '../types'

import { delay } from '@/shared/mock/db'

const TOTAL_MODULES = 18

function extractPermissionKeys(role: Record<string, any>): string[] {
  if (Array.isArray(role.permission_keys) && role.permission_keys.length) {
    return role.permission_keys.map(String)
  }
  if (Array.isArray(role.permission_details) && role.permission_details.length) {
    return role.permission_details
      .map((d: { key?: string; resource_name?: string; action?: string }) => {
        if (d.key) return String(d.key)
        if (d.resource_name && d.action) {
          return `${String(d.resource_name).toLowerCase()}.${String(d.action).toLowerCase()}`
        }
        return null
      })
      .filter(Boolean) as string[]
  }
  if (Array.isArray(role.permissions) && role.permissions.every((p: unknown) => typeof p === 'string')) {
    return role.permissions as string[]
  }
  return []
}

function formatDate(value: unknown): string {
  if (!value) return '—'
  try {
    return new Date(String(value)).toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    })
  } catch {
    return String(value)
  }
}

/** Map backend RoleListItemResponse / RoleDetailResponse → AdminRole card DTO. */
function normalizeRole(role: Record<string, any>): AdminRole {
  const permissions = extractPermissionKeys(role)
  const coverage = computeCoverage(permissions)
  const created = formatDate(role.created ?? role.created_at)
  const isSystem = Boolean(role.is_system_role)
  const usersCount = Number(role.usersCount ?? role.users_count ?? 0)

  let status: AdminRole['status'] = 'Active'
  if (role.status === 'Archived' || role.is_archived) status = 'Archived'

  let category: AdminRole['category'] = 'Standard'
  if (role.category && typeof role.category === 'string') {
    category = role.category as AdminRole['category']
  } else if (isSystem) {
    category = 'Core Role'
  }

  return {
    id: String(role.id),
    name: role.name ?? 'Unnamed role',
    description: role.description ?? '',
    usersCount,
    permissions,
    status,
    category,
    coveragePct: typeof role.coveragePct === 'number' ? role.coveragePct : coverage.pct,
    coverageLabel: role.coverageLabel ?? coverage.label,
    created,
    updated: formatDate(role.updated ?? role.updated_at ?? role.created_at) || created,
  }
}

export function computeCoverage(permissions: string[]): { pct: number; label: string } {
  if (!permissions?.length) return { pct: 0, label: '0 permissions' }
  const modules = new Set<string>()
  for (const p of permissions) {
    const part = p.split(/[./_]/)[0]?.toLowerCase()
    if (part) modules.add(part)
  }
  if (permissions.some((p) => p.includes('manage') || p.includes('security') || p === '*')) {
    return { pct: 100, label: 'Full Access' }
  }
  const count = Math.min(modules.size, TOTAL_MODULES)
  const pct = Math.round((count / TOTAL_MODULES) * 100)
  return {
    pct,
    label: `${permissions.length} grants · ${count} modules`,
  }
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

export async function permissionKeysToIds(keys: string[]): Promise<number[]> {
  if (!keys.length) return []
  const catalog = await listPermissionCatalog()
  const byKey = new Map<string, number>()
  for (const p of catalog.permissions) {
    const k = `${String(p.resource_name).toLowerCase()}.${String(p.action).toLowerCase()}`
    byKey.set(k, p.id)
  }
  const ids: number[] = []
  for (const key of keys) {
    const id = byKey.get(key.toLowerCase())
    if (id != null) ids.push(id)
  }
  return ids
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

  const query: Record<string, string | number> = {}
  if (params?.search) query.search = params.search
  if (params?.category && params.category !== 'All') query.category = params.category
  if (params?.page != null) query.page = params.page
  if (params?.pageSize != null) query.pageSize = params.pageSize

  const { data } = await apiClient.get<
    | Array<Record<string, unknown>>
    | { items: Array<Record<string, unknown>>; total: number; page?: number; pageSize?: number }
  >('/rbac/roles', { params: query })

  let raw: Array<Record<string, any>>
  let total: number
  if (Array.isArray(data)) {
    raw = data
    total = data.length
  } else {
    raw = data.items ?? []
    total = data.total ?? raw.length
  }

  let items = raw.map((r) => normalizeRole(r))

  if (params?.status && params.status !== 'All') {
    items = items.filter((r) => r.status === params.status)
  }

  return { items, total }
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
    const { data } = await apiClient.get<Record<string, any>>(`/rbac/roles/${roleId}`)
    return normalizeRole(data)
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
  const permission_ids = await permissionKeysToIds(payload.permissions ?? [])
  const { data } = await apiClient.post<Record<string, any>>('/rbac/roles', {
    name: payload.name,
    description: payload.description,
    is_system_role: false,
    permission_ids,
  })
  const detail = await getAdminRole(String(data.id))
  if (detail) return detail
  return normalizeRole({ ...data, permission_keys: payload.permissions ?? [] })
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
  const body: Record<string, unknown> = {}
  if (payload.name != null) body.name = payload.name
  if (payload.description != null) body.description = payload.description
  if (payload.permissions != null) {
    body.permission_ids = await permissionKeysToIds(payload.permissions)
  }
  await apiClient.patch(`/rbac/roles/${roleId}`, body)
  const detail = await getAdminRole(roleId)
  if (detail) return detail
  return normalizeRole({ id: roleId, ...payload })
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
