/**
 * Pure helpers for the RBAC permission matrix used by the role form.
 * Kept free of React/API deps so it is directly unit-testable.
 */
import type { RolePermissionAction, RolePermissionMatrix } from '../types'

export function emptyMatrix(modules: string[], actions: string[]): RolePermissionMatrix {
  const init: RolePermissionMatrix = {}
  modules.forEach((m) => {
    init[m] = Object.fromEntries(actions.map((a) => [a, false]))
  })
  return init
}

/**
 * Rebuild a matrix from stored permission keys.
 * Expected key shape: `{resource}.{action}` (case-insensitive),
 * e.g. `users.view` matches module "Users" + action "VIEW".
 */
export function seedMatrix(
  permissions: string[],
  modules: string[],
  actions: string[],
): RolePermissionMatrix {
  const init = emptyMatrix(modules, actions)
  const keySet = new Set(permissions.map((p) => p.toLowerCase()))

  modules.forEach((m) => {
    const modLower = m.toLowerCase()
    init[m] = Object.fromEntries(
      actions.map((a) => {
        const key = `${modLower}.${String(a).toLowerCase()}`
        return [a, keySet.has(key)]
      }),
    )
  })
  return init
}

/** Flatten matrix → permission strings for storage / coverage. */
export function matrixToPermissions(matrix: RolePermissionMatrix): string[] {
  const out: string[] = []
  for (const [mod, row] of Object.entries(matrix)) {
    for (const [action, on] of Object.entries(row ?? {})) {
      if (on) out.push(`${mod.toLowerCase()}.${action.toLowerCase()}`)
    }
  }
  return out
}

export type RoleFormAction = RolePermissionAction | string
