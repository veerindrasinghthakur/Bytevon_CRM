import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { listChannelCards, listNotificationTriggers } from '../../api/settings'
import { queryKeys } from '@/shared/lib/query-keys'
import {
  emptyNotificationSettingsForm,
  notificationSettingsFormSchema,
  type BatchFrequency,
  type NotificationSettingsForm,
} from '../../schemas/settings-form'
import type { ChannelCard, NotificationTrigger } from '../../types'

export type { BatchFrequency }

export function useNotificationSettings() {
  const channelsQuery = useQuery({
    queryKey: queryKeys.notifications.channels(),
    queryFn: listChannelCards,
  })
  const triggersQuery = useQuery({
    queryKey: queryKeys.notifications.triggers(),
    queryFn: listNotificationTriggers,
  })

  const seedChannels = channelsQuery.data ?? []
  const seedTriggers = triggersQuery.data ?? []

  const form = useForm<NotificationSettingsForm>({
    resolver: zodResolver(notificationSettingsFormSchema),
    defaultValues: emptyNotificationSettingsForm(),
  })

  const [baseline, setBaseline] = useState<NotificationSettingsForm | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (hydrated) return
    if (seedChannels.length === 0 || seedTriggers.length === 0) return
    const next: NotificationSettingsForm = {
      channelEnabled: Object.fromEntries(seedChannels.map((c) => [c.id, c.enabled])),
      triggerEnabled: Object.fromEntries(seedTriggers.map((t) => [t.id, t.enabled])),
      freq: 'hourly',
      quietOn: true,
      quietStart: '21:00',
      quietEnd: '07:00',
    }
    form.reset(next)
    setBaseline({
      ...next,
      channelEnabled: { ...next.channelEnabled },
      triggerEnabled: { ...next.triggerEnabled },
    })
    setHydrated(true)
  }, [seedChannels, seedTriggers, hydrated, form])

  const values = form.watch()

  const isDirty = useMemo(() => {
    if (!baseline) return false
    if (values.freq !== baseline.freq) return true
    if (values.quietOn !== baseline.quietOn) return true
    if (values.quietStart !== baseline.quietStart || values.quietEnd !== baseline.quietEnd) return true
    for (const id of Object.keys(values.channelEnabled ?? {})) {
      if (values.channelEnabled[id] !== baseline.channelEnabled[id]) return true
    }
    for (const id of Object.keys(values.triggerEnabled ?? {})) {
      if (values.triggerEnabled[id] !== baseline.triggerEnabled[id]) return true
    }
    return false
  }, [values, baseline])

  const discard = () => {
    if (!baseline) return
    form.reset({
      ...baseline,
      channelEnabled: { ...baseline.channelEnabled },
      triggerEnabled: { ...baseline.triggerEnabled },
    })
    setToast(null)
  }

  const save = form.handleSubmit((data) => {
    setBaseline({
      ...data,
      channelEnabled: { ...data.channelEnabled },
      triggerEnabled: { ...data.triggerEnabled },
    })
    setToast('Notification settings saved.')
    window.setTimeout(() => setToast(null), 2500)
  })

  const toggleChannel = (id: string) => {
    const cur = form.getValues('channelEnabled')
    form.setValue('channelEnabled', { ...cur, [id]: !cur[id] }, { shouldDirty: true })
  }

  const toggleTrigger = (id: string) => {
    const cur = form.getValues('triggerEnabled')
    form.setValue('triggerEnabled', { ...cur, [id]: !cur[id] }, { shouldDirty: true })
  }

  const channelCards: ChannelCard[] = seedChannels
  const triggers: NotificationTrigger[] = seedTriggers.map((t) => ({
    ...t,
    channels: [...t.channels],
    enabled: values.triggerEnabled?.[t.id] ?? t.enabled,
  }))

  return {
    isLoading: channelsQuery.isLoading || triggersQuery.isLoading,
    isError: channelsQuery.isError || triggersQuery.isError,
    form,
    channelCards,
    channelEnabled: values.channelEnabled ?? {},
    toggleChannel,
    triggers,
    toggleTrigger,
    freq: values.freq as BatchFrequency,
    setFreq: (v: BatchFrequency) => form.setValue('freq', v, { shouldDirty: true }),
    quietOn: values.quietOn,
    setQuietOn: (v: boolean) => form.setValue('quietOn', v, { shouldDirty: true }),
    quietStart: values.quietStart,
    setQuietStart: (v: string) => form.setValue('quietStart', v, { shouldDirty: true }),
    quietEnd: values.quietEnd,
    setQuietEnd: (v: string) => form.setValue('quietEnd', v, { shouldDirty: true }),
    isDirty,
    discard,
    save,
    toast,
  }
}
