import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getNotification,
  markNotificationRead,
  markAllNotificationsRead,
  type NotificationItem,
} from '../api/notifications'

type NotifCache = { items: NotificationItem[]; total: number; unreadCount: number }

const LIST_KEY = ['notifications', 'list'] as const

export function useNotifications() {
  return useQuery({
    queryKey: LIST_KEY,
    queryFn: () => getNotification(),
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => markNotificationRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: LIST_KEY })
      const previous = queryClient.getQueryData<NotifCache>(LIST_KEY)

      queryClient.setQueryData<NotifCache>(LIST_KEY, (old) => {
        if (!old) return old
        const items = old.items.map((n) => (n.id === id ? { ...n, read: true } : n))
        return {
          items,
          total: items.length,
          unreadCount: items.filter((n) => !n.read).length,
        }
      })

      return { previous }
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(LIST_KEY, ctx.previous)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: LIST_KEY })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: LIST_KEY })
      const previous = queryClient.getQueryData<NotifCache>(LIST_KEY)

      queryClient.setQueryData<NotifCache>(LIST_KEY, (old) => {
        if (!old) return old
        const items = old.items.map((n) => ({ ...n, read: true }))
        return { items, total: items.length, unreadCount: 0 }
      })

      return { previous }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(LIST_KEY, ctx.previous)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: LIST_KEY })
    },
  })
}
