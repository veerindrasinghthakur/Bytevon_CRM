import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth/context/AuthContext'
import { queryKeys } from '@/shared/lib/query-keys'
import {
  listAllInboxNotifications,
  unreadNotificationsCount,
} from '../../api/center'

/** Header bell: live unread count (45s poll) + latest unread preview. */
export function useNotificationBell() {
  // Never poll without a session — otherwise the header spams 401s
  // (e.g. on the login page or while the session is refreshing).
  const { isAuthenticated } = useAuth()
  const countQuery = useQuery({
    queryKey: [...queryKeys.notifications.all, 'unread-count'] as const,
    queryFn: unreadNotificationsCount,
    refetchInterval: 45_000,
    enabled: isAuthenticated,
  })

  const inboxQuery = useQuery({
    queryKey: queryKeys.notifications.inboxAll(),
    queryFn: listAllInboxNotifications,
    enabled: isAuthenticated,
  })

  const latest =
    (inboxQuery.data ?? [])
      .filter((n) => n.status === 'Unread')
      .slice(0, 6)

  return {
    unread: countQuery.data ?? 0,
    latest,
    isLoading: countQuery.isLoading || inboxQuery.isLoading,
  }
}
