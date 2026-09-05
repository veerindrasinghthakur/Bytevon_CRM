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
 * Rebuild a matrix from stored permission strings.
 *
 * A permission string matches a module when it is the module name
 * lowercased followed by a dot (e.g. "users.view" matches module "Users").
 * This avoids the prefix-heuristic corruption and the "manage"/"security"
 * catch-all that previously granted ALL actions on ALL modules.
 */
export function seedMatrix(
  permissions: string[],
  modules: string[],
  actions: string[],
): RolePermissionMatrix {
  const init = emptyMatrix(modules, actions)
  modules.forEach((m) => {
    const modLower = m.toLowerCase()
    const hasAny = permissions.some((p) =>
      p.toLowerCase().startsWith(modLower + '.')
    )
    init[m] = Object.fromEntries(
      actions.map((a) => [a, hasAny && (a === 'VIEW' || a === 'CREATE' || a === 'UPDATE')]),
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
