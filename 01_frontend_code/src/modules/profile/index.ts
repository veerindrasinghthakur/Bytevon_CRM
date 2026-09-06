/**
 * @deprecated Profile is part of my-work. Prefer `@/modules/my-work`.
 * Thin re-exports kept so existing imports keep working.
 */
export {
  createProfileRoutes,
  profileRoutes,
} from '@/modules/my-work/routes'

export { ProfilePage } from '@/modules/my-work/pages/ProfilePage'
export { ActiveSessionsPage } from '@/modules/my-work/pages/ActiveSessionsPage'
export { ChangePasswordPage } from '@/modules/my-work/pages/ChangePasswordPage'

export * from '@/modules/my-work/schemas/profile'
export * from '@/modules/my-work/schemas/profile-form'
export * from '@/modules/my-work/schemas/profile-enums'
