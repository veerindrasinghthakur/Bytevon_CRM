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
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { toast } from '@/shared/hooks/use-toast'

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
    onMutate: (id: string) => {
      queryClient.setQueriesData({ queryKey: queryKeys.notifications.all }, (old: unknown) => {
        if (Array.isArray(old)) {
          return old.map((n) =>
            typeof n === 'object' && n !== null && 'id' in n && String((n as { id: unknown }).id) === id
              ? { ...n, status: 'Read' }
              : n,
          )
        }
        if (old && typeof old === 'object' && 'items' in old) {
          const rows = (old as { items: unknown }).items
          if (Array.isArray(rows)) {
            return {
              ...old,
              items: (rows as unknown[]).map((n: unknown) =>
                typeof n === 'object' && n !== null && 'id' in n && String((n as { id: unknown }).id) === id
                  ? { ...n, status: 'Read' }
                  : n,
              ),
            }
          }
        }
        return old
      })
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Could not mark as read'))
      void invalidate.notifications(queryClient)
    },
    onSuccess: () => void invalidate.notifications(queryClient),
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Could not mark all as read'))
      void invalidate.notifications(queryClient)
    },
    onSuccess: () => void invalidate.notifications(queryClient),
  })
}
