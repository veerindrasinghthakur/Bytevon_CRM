/** Admin API barrel — single entry for module consumers.
 * Until restructure-admin-module.sh is run, keep dual names:
 * users/roles/metrics still exist; user/role/attendance after rename.
 */
export * from './users'
export * from './roles'
export * from './audit'
export * from './leave'
export * from './settings'
export * from './security'
export * from './metrics'
export * from './offices'
export * from './organization'
export * from './location'
export * from './shift'
export * from './working-week'
export * from './holiday-calendar'
export * from './position'
export * from './department'
