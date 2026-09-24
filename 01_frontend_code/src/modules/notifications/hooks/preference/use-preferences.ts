import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/query-keys'
import {
  listPreferences,
  setPreference,
  type PreferenceChannel,
} from '../../api/preference'

export const PREFERENCES_KEY = [...queryKeys.notifications.all, 'preferences'] as const

/** Single coherent preferences hook: list + per-channel toggle. */
export function usePreferences() {
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: PREFERENCES_KEY,
    queryFn: listPreferences,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })

  const toggleMut = useMutation({
    mutationFn: ({ channel, is_enabled }: { channel: PreferenceChannel; is_enabled: boolean }) =>
      setPreference({ channel, is_enabled }),
    onMutate: async ({ channel, is_enabled }) => {
      await qc.cancelQueries({ queryKey: PREFERENCES_KEY })
      const prev = qc.getQueryData<Awaited<ReturnType<typeof listPreferences>>>(PREFERENCES_KEY)
      qc.setQueryData(PREFERENCES_KEY, (old: Awaited<ReturnType<typeof listPreferences>> | undefined) =>
        (old ?? []).map((p) => (p.channel === channel ? { ...p, is_enabled } : p)),
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(PREFERENCES_KEY, ctx.prev)
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: PREFERENCES_KEY })
    },
  })

  const prefs = query.data ?? []
  const byChannel = (c: PreferenceChannel) => prefs.find((p) => p.channel === c)?.is_enabled ?? true

  return {
    prefs,
    isInAppEnabled: byChannel('IN_APP'),
    isEmailEnabled: byChannel('EMAIL'),
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    setChannel: toggleMut.mutateAsync,
    isMutating: toggleMut.isPending,
  }
}
