import { PageHeader } from '@/shared/components/layout/PageHeader'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { usePreferences } from '../../hooks/preference/use-preferences'

const CHANNELS = [
  {
    channel: 'IN_APP' as const,
    title: 'In-app notifications',
    description: 'Show notifications inside the notification center.',
    icon: 'notifications',
  },
  {
    channel: 'EMAIL' as const,
    title: 'Email notifications',
    description: 'Send a copy of important notifications by email.',
    icon: 'mail',
  },
]

export function NotificationPreferencesPage() {
  const {
    isInAppEnabled,
    isEmailEnabled,
    isLoading,
    isError,
    error,
    refetch,
    setChannel,
    isMutating,
  } = usePreferences()

  const enabledFor = (c: 'IN_APP' | 'EMAIL') => (c === 'IN_APP' ? isInAppEnabled : isEmailEnabled)

  if (isError) {
    return (
      <ErrorState
        title="Failed to load preferences"
        description={getApiErrorMessage(error, 'Could not load notification preferences.')}
        onRetry={() => void refetch()}
      />
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Notification preferences"
        description="Choose which channels deliver your notifications."
      />

      <section className="bv-surface divide-y divide-outline-variant overflow-hidden">
        {CHANNELS.map((c) => {
          const on = enabledFor(c.channel)
          return (
            <div key={c.channel} className="flex items-center gap-4 p-5">
              <span className="material-symbols-outlined text-secondary text-2xl">{c.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-on-surface">{c.title}</p>
                <p className="text-body-sm text-on-surface-variant">{c.description}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-label={`Toggle ${c.title}`}
                disabled={isLoading || isMutating}
                onClick={() => void setChannel({ channel: c.channel, is_enabled: !on })}
                className="relative inline-flex h-6 w-11 items-center rounded-full bg-surface-container-high transition-colors data-[on=true]:bg-secondary disabled:opacity-50"
                data-on={on}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>
          )
        })}
      </section>
    </div>
  )
}
