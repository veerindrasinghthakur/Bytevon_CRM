import { Button } from '@/shared/components/ui/Button'
import { useNotificationSettings } from '../../hooks/settings/use-notification-settings'
import { cn } from '@/shared/lib/cn'
import { Can } from '@/shared/rbac'
import { Action } from '@/shared/schema'

export function NotificationSettingsPage() {
  const s = useNotificationSettings()
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = s.form
  const {
    channelEnabled,
    triggerEnabled,
    freq,
    quietOn,
    isDirty,
    isSaving,
    exemptions,
  } = s

  if (s.isLoading) {
    return <div className="py-16 text-center text-on-surface-variant">Loading settings…</div>
  }

  const onDiscard = () => {
    s.discard()
  }

  return (
    <form onSubmit={(e) => void s.save(e)}>
      <div className="space-y-10 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-headline-lg font-semibold text-deep-navy mb-2">Notification Settings</h1>
            <p className="text-body-md text-on-surface-variant max-w-2xl">
              Configure system-wide notification protocols, delivery channels, and trigger-based alerts.
            </p>
          </div>
          {isDirty && (
            <div className="flex gap-3">
              <Button variant="outline" size="md" type="button" onClick={onDiscard}>
                Discard Changes
              </Button>
              <Can action={Action.UPDATE} resource="notification">
                <Button variant="primary" size="md" type="submit" isLoading={isSubmitting || isSaving}>
                  Save Settings
                </Button>
              </Can>
            </div>
          )}
        </div>

        {s.toast && (
          <div className="rounded-lg border border-success-emerald/30 bg-success-emerald/10 px-4 py-3 text-label-md text-success-emerald">
            {s.toast}
          </div>
        )}

        <section>
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-secondary">broadcast_on_home</span>
            <h3 className="text-title-lg font-semibold text-deep-navy">Delivery Channels</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {s.channelCards.map((c) => (
              <div key={c.id} className="bv-surface card-hover p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-primary-container/10 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-deep-navy">{c.icon}</span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={channelEnabled[c.id] ?? false}
                    onClick={() => s.toggleChannel(c.id)}
                    className={cn(
                      'w-10 h-5 rounded-full relative transition-colors shrink-0',
                      (channelEnabled[c.id] ?? false) ? 'bg-secondary' : 'bg-outline-variant',
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow',
                        (channelEnabled[c.id] ?? false) && 'translate-x-5',
                      )}
                    />
                  </button>
                </div>
                <h4 className="text-title-lg font-semibold text-deep-navy mb-1">{c.title}</h4>
                <p className="text-body-sm text-on-surface-variant mb-4">{c.description}</p>
                <button type="button" className="text-secondary text-label-md flex items-center gap-1 hover:underline">
                  Configure <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">bolt</span>
              <h3 className="text-title-lg font-semibold text-deep-navy">Global Triggers</h3>
            </div>
            <button type="button" className="text-secondary text-label-md flex items-center gap-1 font-medium">
              <span className="material-symbols-outlined">add</span> Create New Trigger
            </button>
          </div>
          <div className="bv-surface overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  {['Notification Event', 'Channels', 'Recipients', 'Last Triggered', 'Status', ''].map((h) => (
                    <th key={h || 'actions'} className="py-4 px-6 text-label-md text-on-surface-variant">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {s.triggers.map((t) => (
                  <tr key={t.id} className="zebra-row">
                    <td className="py-4 px-6">
                      <p className="text-body-md font-medium text-deep-navy">{t.event}</p>
                      <p className="text-[12px] text-on-surface-variant">{t.description}</p>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2 text-on-surface-variant">
                        {t.channels.map((ch) => (
                          <span key={ch} className="material-symbols-outlined text-[20px]" title={ch}>
                            {ch === 'Email'
                              ? 'mail'
                              : ch === 'SMS'
                                ? 'sms'
                                : ch === 'Push'
                                  ? 'ad_units'
                                  : 'notification_important'}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-1 bg-surface-container text-deep-navy text-[12px] font-semibold rounded">
                        {t.recipients}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-on-surface-variant text-body-sm">{t.lastTriggered}</td>
                    <td className="py-4 px-6">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={triggerEnabled[t.id] ?? false}
                        onClick={() => s.toggleTrigger(t.id)}
                        className={cn(
                          'w-10 h-5 rounded-full relative transition-colors shrink-0',
                          (triggerEnabled[t.id] ?? false) ? 'bg-secondary' : 'bg-outline-variant',
                        )}
                      >
                        <span
                          className={cn(
                            'absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow',
                            (triggerEnabled[t.id] ?? false) && 'translate-x-5',
                          )}
                        />
                      </button>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button type="button" className="text-on-surface-variant hover:text-deep-navy transition-colors">
                        <span className="material-symbols-outlined">more_vert</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-secondary">tune</span>
            <h3 className="text-title-lg font-semibold text-deep-navy">Advanced Preferences</h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bv-surface p-6">
              <h4 className="text-title-lg font-semibold text-deep-navy mb-2">Batch Frequency</h4>
              <p className="text-body-sm text-on-surface-variant mb-6">
                Controls how often system updates are delivered to prevent inbox fatigue.
              </p>
              <div className="space-y-3">
                {(
                  [
                    {
                      id: 'immediate' as const,
                      title: 'Immediate Delivery',
                      desc: 'Send triggers the moment they occur.',
                    },
                    {
                      id: 'hourly' as const,
                      title: 'Hourly Digest',
                      desc: 'Collect notifications and send once per hour.',
                    },
                    {
                      id: 'daily' as const,
                      title: 'Daily Summary',
                      desc: 'One consolidated report at end of day (18:00).',
                    },
                  ] as const
                ).map((o) => (
                  <label
                    key={o.id}
                    className={cn(
                      'flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all',
                      freq === o.id
                        ? 'border-secondary bg-surface-container-high'
                        : 'border-outline-variant hover:border-secondary bg-surface-container-lowest',
                    )}
                  >
                    <input
                      type="radio"
                      {...register('freq')}
                      value={o.id}
                      className="text-secondary focus:ring-secondary"
                    />
                    <div>
                      <p className={cn('text-body-md font-medium', freq === o.id && 'text-secondary')}>
                        {o.title}
                      </p>
                      <p className="text-[12px] text-on-surface-variant">{o.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="bv-surface p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h4 className="text-title-lg font-semibold text-deep-navy mb-2">Quiet Hours</h4>
                  <p className="text-body-sm text-on-surface-variant">
                    Suppress non-critical alerts during specified periods.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={quietOn}
                  onClick={() => s.setQuietOn(!quietOn)}
                  className={cn(
                    'w-10 h-5 rounded-full relative transition-colors shrink-0',
                    quietOn ? 'bg-secondary' : 'bg-outline-variant',
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow',
                      quietOn && 'translate-x-5',
                    )}
                  />
                </button>
              </div>
              <div className={cn('grid grid-cols-2 gap-4', !quietOn && 'opacity-50 pointer-events-none')}>
                <div>
                  <label className="block text-label-md text-deep-navy mb-2">Start Time</label>
                  <input
                    type="time"
                    {...register('quietStart')}
                    className="w-full p-3 bg-surface-container-low border border-outline-variant rounded-lg outline-none focus:ring-2 focus:ring-secondary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-label-md text-deep-navy mb-2">End Time</label>
                  <input
                    type="time"
                    {...register('quietEnd')}
                    className="w-full p-3 bg-surface-container-low border border-outline-variant rounded-lg outline-none focus:ring-2 focus:ring-secondary transition-colors"
                  />
                </div>
              </div>
              <div className="mt-6">
                <label className="block text-label-md text-deep-navy mb-3">Exemptions</label>
                <div className="flex flex-wrap gap-2">
                  {exemptions.map((name) => (
                    <span key={name} className="px-4 py-2 bg-surface-container text-deep-navy rounded-full flex items-center gap-2 text-sm border border-outline-variant">
                      <span className="material-symbols-outlined text-[18px]">verified_user</span> {name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </form>
  )
}
