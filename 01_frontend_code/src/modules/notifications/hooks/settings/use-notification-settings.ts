import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys, invalidate } from '@/shared/lib/query-keys'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { getGlobalSettings, updateGlobalSettings } from '../../api/settings-global'
import {
  emptyNotificationSettingsForm,
  notificationSettingsFormSchema,
  type BatchFrequency,
  type NotificationSettingsForm,
} from '../../schemas/settings-form'
import type { ChannelCard, NotificationTrigger } from '../../types'

export type { BatchFrequency }

const CHANNEL_ICONS: Record<string, string> = {
  in_app: 'dashboard',
  email: 'mail',
}

export function useNotificationSettings() {
  const qc = useQueryClient()
  const settingsQuery = useQuery({
    queryKey: [...queryKeys.notifications.all, 'global-settings'] as const,
    queryFn: getGlobalSettings,
    staleTime: 60_000,
  })

  const server = settingsQuery.data

  const form = useForm<NotificationSettingsForm>({
    resolver: zodResolver(notificationSettingsFormSchema),
    defaultValues: emptyNotificationSettingsForm(),
  })

  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (!server) return
    form.reset({
      channelEnabled: Object.fromEntries(server.channels.map((c) => [c.id, c.enabled])),
      triggerEnabled: Object.fromEntries(server.triggers.map((t) => [t.id, t.enabled])),
      freq: (server.batch.frequency as BatchFrequency) ?? 'hourly',
      quietOn: server.quiet.enabled,
      quietStart: server.quiet.start,
      quietEnd: server.quiet.end,
    })
  }, [server, form])

  const saveMut = useMutation({
    mutationFn: updateGlobalSettings,
    onSuccess: () => {
      void invalidate.notifications(qc)
      setToast('Notification settings saved.')
      window.setTimeout(() => setToast(null), 2500)
    },
    onError: (err: unknown) => {
      setToast(getApiErrorMessage(err, 'Could not save settings.'))
      window.setTimeout(() => setToast(null), 3000)
    },
  })

  const values = form.watch()

  const save = form.handleSubmit((data) => {
    const triggers =
      server?.triggers.map((t) => ({
        ...t,
        enabled: data.triggerEnabled?.[t.id] ?? t.enabled,
      })) ?? []
    const channels =
      server?.channels.map((c) => ({
        ...c,
        enabled: data.channelEnabled?.[c.id] ?? c.enabled,
      })) ?? []
    saveMut.mutate({
      triggers,
      channels,
      batch: { frequency: data.freq },
      quiet: { enabled: data.quietOn, start: data.quietStart, end: data.quietEnd },
    })
  })

  const discard = () => {
    if (!server) return
    form.reset({
      channelEnabled: Object.fromEntries(server.channels.map((c) => [c.id, c.enabled])),
      triggerEnabled: Object.fromEntries(server.triggers.map((t) => [t.id, t.enabled])),
      freq: (server.batch.frequency as BatchFrequency) ?? 'hourly',
      quietOn: server.quiet.enabled,
      quietStart: server.quiet.start,
      quietEnd: server.quiet.end,
    })
    setToast(null)
  }

  const toggleChannel = (id: string) => {
    const cur = form.getValues('channelEnabled')
    form.setValue('channelEnabled', { ...cur, [id]: !cur[id] }, { shouldDirty: true })
  }

  const toggleTrigger = (id: string) => {
    const cur = form.getValues('triggerEnabled')
    form.setValue('triggerEnabled', { ...cur, [id]: !cur[id] }, { shouldDirty: true })
  }

  const channelCards: ChannelCard[] = (server?.channels ?? []).map((c) => ({
    id: c.id,
    title: c.name,
    description: c.id === 'email' ? 'Official email delivery' : 'In-app dashboard delivery',
    icon: CHANNEL_ICONS[c.id] ?? 'notifications',
    enabled: values.channelEnabled?.[c.id] ?? c.enabled,
  }))

  const triggers: NotificationTrigger[] = (server?.triggers ?? []).map((t) => ({
    id: t.id,
    event: t.event,
    description: t.description,
    channels: [
      ...(t.in_app ? (['In-App'] as const) : []),
      ...(t.email ? (['Email'] as const) : []),
    ],
    recipients: 'All staff',
    lastTriggered: '—',
    enabled: values.triggerEnabled?.[t.id] ?? t.enabled,
  }))

  return {
    isLoading: settingsQuery.isLoading,
    isError: settingsQuery.isError,
    form,
    channelCards,
    channelEnabled: values.channelEnabled ?? {},
    toggleChannel,
    triggers,
    triggerEnabled: values.triggerEnabled ?? {},
    toggleTrigger,
    freq: values.freq as BatchFrequency,
    setFreq: (v: BatchFrequency) => form.setValue('freq', v, { shouldDirty: true }),
    quietOn: values.quietOn,
    setQuietOn: (v: boolean) => form.setValue('quietOn', v, { shouldDirty: true }),
    quietStart: values.quietStart,
    setQuietStart: (v: string) => form.setValue('quietStart', v, { shouldDirty: true }),
    quietEnd: values.quietEnd,
    setQuietEnd: (v: string) => form.setValue('quietEnd', v, { shouldDirty: true }),
    exemptions: server?.exemptions ?? [],
    isDirty: form.formState.isDirty,
    isSaving: saveMut.isPending,
    discard,
    save,
    toast,
  }
}
