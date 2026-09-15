/**
 * Detail + mark-read helpers for notification detail page / shared consumers.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getNotification,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../api/center'
import { queryKeys, invalidate } from '@/shared/lib/query-keys'

export function useNotificationDetail(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.notifications.detail(id ?? ''),
    queryFn: () => getNotification(id),
    enabled: Boolean(id),
  })
}

/** @deprecated Prefer useNotificationDetail */
export function useNotifications(id?: string) {
  return useNotificationDetail(id)
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => void invalidate.notifications(queryClient),
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => void invalidate.notifications(queryClient),
  })
}
