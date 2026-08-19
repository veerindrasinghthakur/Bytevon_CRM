import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/cn'

const PRIORITIES = [
  { id: 'Low', color: 'bg-green-500' },
  { id: 'Normal', color: 'bg-blue-500' },
  { id: 'High', color: 'bg-orange-500' },
  { id: 'Critical', color: 'bg-red-600' },
] as const

export function ComposeNotificationPage() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [priority, setPriority] = useState<(typeof PRIORITIES)[number]['id']>('Normal')
  const [broadcastAll, setBroadcastAll] = useState(false)
  const [roles, setRoles] = useState(['Management', 'IT Support'])
  const [channels, setChannels] = useState({ inApp: true, email: true, sms: false, push: false })
  const [scheduleMode, setScheduleMode] = useState<'now' | 'later'>('now')
  const [moduleCtx, setModuleCtx] = useState('General / System')
  const [toast, setToast] = useState<string | null>(null)

  const send = () => {
    if (!title.trim() || !body.trim()) {
      setToast('Title and message body are required.')
      return
    }
    setToast('Notification queued for delivery.')
    window.setTimeout(() => {
      setToast(null)
      navigate({ to: '/notifications/sent' })
    }, 900)
  }

  const removeRole = (r: string) => setRoles((prev) => prev.filter((x) => x !== r))

  return (
    <div className="space-y-6 animate-fade-in">
      <nav className="flex items-center gap-2 text-label-md text-on-surface-variant">
        <button type="button" className="hover:text-secondary" onClick={() => navigate({ to: '/notifications' })}>
          Notification Center
        </button>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <span className="text-deep-navy font-bold">Compose</span>
      </nav>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-headline-lg font-semibold text-deep-navy tracking-tight">Compose Notification</h1>
          <p className="text-body-md text-on-surface-variant mt-1">Design and broadcast system-wide or targeted alerts.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="md" onClick={() => navigate({ to: '/notifications' })}>
            Discard Draft
          </Button>
          <Button
            variant="primary"
            size="md"
            leftIcon={<span className="material-symbols-outlined text-[20px]">send</span>}
            onClick={send}
          >
            Send Notification
          </Button>
        </div>
      </div>

      {toast && (
        <div className="rounded-lg border border-secondary/30 bg-secondary/10 px-4 py-3 text-label-md text-secondary">
          {toast}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-6">
          <section className="bv-surface p-6">
            <h3 className="text-title-lg font-semibold text-deep-navy mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">mail</span>
              Notification Content
            </h3>
            <div className="space-y-6">
              <div>
                <label className="block text-label-md text-on-surface-variant mb-2">Notification Title</label>
                <input
                  className="w-full h-12 bg-surface-container-lowest px-4 rounded-lg border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary outline-none text-body-md transition-colors"
                  placeholder="e.g., Scheduled Maintenance Downtime"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-label-md text-on-surface-variant mb-2">Priority Level</label>
                <div className="flex gap-3 flex-wrap">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPriority(p.id)}
                      className={cn(
                        'flex-1 min-w-[100px] py-3 px-4 rounded-lg border flex items-center justify-center gap-2 transition-all',
                        priority === p.id
                          ? 'border-2 border-secondary bg-secondary/5'
                          : 'border-outline-variant hover:border-outline'
                      )}
                    >
                      <div className={cn('w-2.5 h-2.5 rounded-full', p.color)} />
                      <span
                        className={cn(
                          'text-label-md',
                          priority === p.id ? 'text-deep-navy font-semibold' : 'text-on-surface-variant'
                        )}
                      >
                        {p.id}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-label-md text-on-surface-variant mb-2">Message Body</label>
                <div className="border border-outline-variant rounded-lg overflow-hidden focus-within:border-secondary">
                  <div className="bg-surface-container-low border-b border-outline-variant p-2 flex items-center gap-1">
                    {['format_bold', 'format_italic', 'format_list_bulleted', 'link', 'image'].map((ic) => (
                      <button key={ic} type="button" className="p-1.5 rounded hover:bg-surface-container transition-colors">
                        <span className="material-symbols-outlined text-[20px]">{ic}</span>
                      </button>
                    ))}
                  </div>
                  <textarea
                    className="w-full p-4 border-none focus:ring-0 outline-none text-body-md resize-none bg-surface-container-lowest"
                    placeholder="Enter your notification message here..."
                    rows={8}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-label-md text-on-surface-variant mb-2">Attachments (Optional)</label>
                <div className="border-2 border-dashed border-outline-variant rounded-xl p-8 flex flex-col items-center justify-center hover:bg-surface-container-low transition-all cursor-pointer">
                  <span className="material-symbols-outlined text-4xl text-outline-variant mb-3">cloud_upload</span>
                  <p className="text-label-md text-deep-navy font-semibold">Drop files here or click to upload</p>
                  <p className="text-body-sm text-on-surface-variant mt-1">PDF, JPG, PNG or DOCX (Max 10MB)</p>
                </div>
              </div>
              <div>
                <label className="block text-label-md text-on-surface-variant mb-2">Related Module Context</label>
                <select
                  className="w-full h-12 bg-surface-container-lowest px-4 rounded-lg border border-outline-variant focus:border-secondary outline-none text-body-md transition-colors"
                  value={moduleCtx}
                  onChange={(e) => setModuleCtx(e.target.value)}
                >
                  <option>General / System</option>
                  <option>Human Resources</option>
                  <option>Finance & Payroll</option>
                  <option>Security & Compliance</option>
                  <option>Facility Management</option>
                </select>
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <section className="bv-surface p-6">
            <h3 className="text-title-lg font-semibold text-deep-navy mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">group_add</span>
              Recipients
            </h3>
            <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg border border-outline-variant mb-4">
              <div>
                <span className="text-label-md text-deep-navy font-medium block">All Employees</span>
                <span className="text-[11px] text-on-surface-variant">Broadcast to 1,240 users</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={broadcastAll}
                onClick={() => setBroadcastAll((v) => !v)}
                className={cn(
                  'w-11 h-6 rounded-full relative transition-colors',
                  broadcastAll ? 'bg-secondary' : 'bg-outline-variant'
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform',
                    broadcastAll && 'translate-x-5'
                  )}
                />
              </button>
            </div>
            <label className="block text-label-sm text-on-surface-variant mb-2">Target Roles/Teams</label>
            <div className="relative mb-3">
              <input
                className="w-full h-10 bg-surface-container-lowest px-4 pl-10 rounded-lg border border-outline-variant text-body-sm outline-none focus:ring-1 focus:ring-secondary transition-colors"
                placeholder="Search roles or teams..."
              />
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                search
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {roles.map((r) => (
                <span
                  key={r}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-secondary-container text-on-secondary-container rounded-full text-[11px] font-bold"
                >
                  {r}
                  <button type="button" onClick={() => removeRole(r)} className="hover:opacity-80">
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </span>
              ))}
            </div>
          </section>

          <section className="bv-surface p-6">
            <h3 className="text-title-lg font-semibold text-deep-navy mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">hub</span>
              Channels
            </h3>
            <div className="space-y-2">
              {(
                [
                  { key: 'inApp' as const, icon: 'dashboard', label: 'In-App Dashboard' },
                  { key: 'email' as const, icon: 'mail', label: 'Official Email' },
                  { key: 'sms' as const, icon: 'sms', label: 'SMS Alert' },
                  { key: 'push' as const, icon: 'push', label: 'Mobile Push' },
                ] as const
              ).map((c) => (
                <label
                  key={c.key}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-container-low border border-transparent hover:border-outline-variant transition-all cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-outline-variant text-secondary focus:ring-secondary"
                    checked={channels[c.key]}
                    onChange={() => setChannels((prev) => ({ ...prev, [c.key]: !prev[c.key] }))}
                  />
                  <span className="material-symbols-outlined text-on-surface-variant">{c.icon}</span>
                  <span className="text-label-md text-on-surface">{c.label}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="bv-surface p-6">
            <h3 className="text-title-lg font-semibold text-deep-navy mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">schedule</span>
              Scheduling
            </h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="schedule"
                  checked={scheduleMode === 'now'}
                  onChange={() => setScheduleMode('now')}
                  className="text-secondary focus:ring-secondary"
                />
                <span className="text-label-md text-deep-navy font-medium">Send Immediately</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="schedule"
                  checked={scheduleMode === 'later'}
                  onChange={() => setScheduleMode('later')}
                  className="text-secondary focus:ring-secondary"
                />
                <span className="text-label-md text-on-surface-variant">Schedule for later</span>
              </label>
              <div className={cn('space-y-3 pt-2', scheduleMode === 'now' && 'opacity-50 pointer-events-none')}>
                <div>
                  <label className="block text-[11px] font-bold text-on-surface-variant uppercase mb-1">Select Date</label>
                  <input type="date" className="w-full h-10 px-4 rounded-lg border border-outline-variant text-label-md outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-on-surface-variant uppercase mb-1">Select Time</label>
                  <input type="time" className="w-full h-10 px-4 rounded-lg border border-outline-variant text-label-md outline-none" />
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
