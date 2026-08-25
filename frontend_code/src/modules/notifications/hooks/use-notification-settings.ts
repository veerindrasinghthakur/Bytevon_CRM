import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listChannelCards, listNotificationTriggers } from '../api/notifications'
import { queryKeys } from '@/shared/lib/query-keys'
import type { ChannelCard, NotificationTrigger } from '../types'

export type BatchFrequency = 'immediate' | 'hourly' | 'daily'

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

  const [channelEnabled, setChannelEnabled] = useState<Record<string, boolean>>({})
  const [triggers, setTriggers] = useState<NotificationTrigger[]>([])
  const [freq, setFreq] = useState<BatchFrequency>('hourly')
  const [quietOn, setQuietOn] = useState(true)
  const [quietStart, setQuietStart] = useState('21:00')
  const [quietEnd, setQuietEnd] = useState('07:00')
  const [hydrated, setHydrated] = useState(false)
  const [baseline, setBaseline] = useState<{
    channels: Record<string, boolean>
    triggers: NotificationTrigger[]
    freq: BatchFrequency
    quietOn: boolean
    quietStart: string
    quietEnd: string
  } | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (hydrated) return
    if (seedChannels.length === 0 || seedTriggers.length === 0) return
    const ch = Object.fromEntries(seedChannels.map((c) => [c.id, c.enabled])) as Record<string, boolean>
    const tr = seedTriggers.map((t) => ({ ...t, channels: [...t.channels] }))
    setChannelEnabled(ch)
    setTriggers(tr)
    setBaseline({
      channels: { ...ch },
      triggers: tr.map((t) => ({ ...t, channels: [...t.channels] })),
      freq: 'hourly',
      quietOn: true,
      quietStart: '21:00',
      quietEnd: '07:00',
    })
    setHydrated(true)
  }, [seedChannels, seedTriggers, hydrated])

  const isDirty = useMemo(() => {
    if (!baseline) return false
    if (freq !== baseline.freq) return true
    if (quietOn !== baseline.quietOn) return true
    if (quietStart !== baseline.quietStart || quietEnd !== baseline.quietEnd) return true
    for (const id of Object.keys(channelEnabled)) {
      if (channelEnabled[id] !== baseline.channels[id]) return true
    }
    if (triggers.length !== baseline.triggers.length) return true
    for (let i = 0; i < triggers.length; i++) {
      if (triggers[i].enabled !== baseline.triggers[i]?.enabled) return true
    }
    return false
  }, [channelEnabled, triggers, freq, quietOn, quietStart, quietEnd, baseline])

  const discard = () => {
    if (!baseline) return
    setChannelEnabled({ ...baseline.channels })
    setTriggers(baseline.triggers.map((t) => ({ ...t, channels: [...t.channels] })))
    setFreq(baseline.freq)
    setQuietOn(baseline.quietOn)
    setQuietStart(baseline.quietStart)
    setQuietEnd(baseline.quietEnd)
    setToast(null)
  }

  const save = () => {
    setBaseline({
      channels: { ...channelEnabled },
      triggers: triggers.map((t) => ({ ...t, channels: [...t.channels] })),
      freq,
      quietOn,
      quietStart,
      quietEnd,
    })
    setToast('Notification settings saved.')
    window.setTimeout(() => setToast(null), 2500)
  }

  const toggleChannel = (id: string) => {
    setChannelEnabled((p) => ({ ...p, [id]: !p[id] }))
  }

  const toggleTrigger = (id: string) => {
    setTriggers((prev) => prev.map((x) => (x.id === id ? { ...x, enabled: !x.enabled } : x)))
  }

  const channelCards: ChannelCard[] = seedChannels

  return {
    isLoading: channelsQuery.isLoading || triggersQuery.isLoading,
    isError: channelsQuery.isError || triggersQuery.isError,
    channelCards,
    channelEnabled,
    toggleChannel,
    triggers,
    toggleTrigger,
    freq,
    setFreq,
    quietOn,
    setQuietOn,
    quietStart,
    setQuietStart,
    quietEnd,
    setQuietEnd,
    isDirty,
    discard,
    save,
    toast,
  }
}
