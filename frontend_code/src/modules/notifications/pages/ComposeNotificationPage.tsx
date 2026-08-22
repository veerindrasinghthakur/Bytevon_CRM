import { useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/shared/components/ui/Button'
import { Select } from '@/shared/components/ui/Select'
import { SaveDraftButton } from '@/shared/components/ui/SaveDraftButton'
import { cn } from '@/shared/lib/cn'
import { saveNotificationDraft, sendNotification } from '../api/notifications'
import type { NotificationPriority } from '../types'

const PRIORITIES: { id: NotificationPriority; color: string }[] = [
  { id: 'Low', color: 'bg-green-500' },
  { id: 'Normal', color: 'bg-blue-500' },
  { id: 'High', color: 'bg-orange-500' },
  { id: 'Critical', color: 'bg-red-600' },
]

const ROLE_SUGGESTIONS = ['Management', 'IT Support', 'HR Admin', 'Finance', 'Engineering', 'All Managers', 'Super Admin']

function wrapSelection(textarea: HTMLTextAreaElement, before: string, after: string, setBody: (v: string) => void) {
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const val = textarea.value
  const selected = val.slice(start, end) || 'text'
  const next = val.slice(0, start) + before + selected + after + val.slice(end)
  setBody(next)
  requestAnimationFrame(() => {
    textarea.focus()
    const pos = start + before.length + selected.length + after.length
    textarea.setSelectionRange(pos, pos)
  })
}

export function ComposeNotificationPage() {
  const navigate = useNavigate()
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [priority, setPriority] = useState<NotificationPriority>('Normal')
  const [broadcastAll, setBroadcastAll] = useState(false)
  const [roles, setRoles] = useState(['Management', 'IT Support'])
  const [roleQuery, setRoleQuery] = useState('')
  const [channels, setChannels] = useState({ inApp: true, email: true, sms: false, push: false })
  const [scheduleMode, setScheduleMode] = useState<'now' | 'later'>('now')
  const [moduleCtx, setModuleCtx] = useState('General / System')
  const [files, setFiles] = useState<File[]>([])
  const [toast, setToast] = useState<string | null>(null)

  const roleMatches = ROLE_SUGGESTIONS.filter((r) => roleQuery && r.toLowerCase().includes(roleQuery.toLowerCase()) && !roles.includes(r))

  const sendMut = useMutation({
    mutationFn: sendNotification,
    onSuccess: (res) => {
      setToast(`Queued to ${res.queued} recipient(s).`)
      window.setTimeout(() => navigate({ to: '/notifications/sent' }), 800)
    },
  })

  const draftMut = useMutation({
    mutationFn: saveNotificationDraft,
    onSuccess: () => {
      setToast('Draft saved.')
      window.setTimeout(() => setToast(null), 2000)
    },
  })

  const payload = () => ({
    title: title.trim(),
    body: body.trim(),
    priority,
    moduleCtx,
    broadcastAll,
    roles,
    channels: { ...channels, sms: false },
    scheduleMode,
    attachmentNames: files.map((f) => f.name),
  })

  const send = () => {
    if (!title.trim() || !body.trim()) {
      setToast('Title and message body are required.')
      return
    }
    sendMut.mutate(payload())
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <nav className="flex items-center gap-2 text-label-md text-on-surface-variant">
        <button type="button" className="hover:text-secondary" onClick={() => navigate({ to: '/notifications' })}>Notification Center</button>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <span className="text-deep-navy font-bold">Compose</span>
      </nav>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-headline-lg font-semibold text-deep-navy tracking-tight">Compose Notification</h1>
          <p className="text-body-md text-on-surface-variant mt-1">Design and broadcast system-wide or targeted alerts.</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Button variant="outline" size="md" onClick={() => navigate({ to: '/notifications' })}>Discard</Button>
          <SaveDraftButton isLoading={draftMut.isPending} onClick={() => draftMut.mutate(payload())} />
          <Button variant="primary" size="md" leftIcon={<span className="material-symbols-outlined text-[20px]">send</span>} isLoading={sendMut.isPending} onClick={send}>
            Send Notification
          </Button>
        </div>
      </div>

      {toast && <div className="rounded-lg border border-secondary/30 bg-secondary/10 px-4 py-3 text-label-md text-secondary">{toast}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-6">
          <section className="bv-surface p-6 space-y-6">
            <h3 className="text-title-lg font-semibold text-deep-navy flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">mail</span> Notification Content
            </h3>
            <div>
              <label className="block text-label-md text-on-surface-variant mb-2">Notification Title</label>
              <input className="w-full h-12 bg-surface-container-lowest px-4 rounded-lg border border-outline-variant focus:border-secondary outline-none text-body-md" placeholder="e.g., Scheduled Maintenance Downtime" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <label className="block text-label-md text-on-surface-variant mb-2">Priority Level</label>
              <div className="flex gap-3 flex-wrap">
                {PRIORITIES.map((p) => (
                  <button key={p.id} type="button" onClick={() => setPriority(p.id)} className={cn('flex-1 min-w-[100px] py-3 px-4 rounded-lg border flex items-center justify-center gap-2', priority === p.id ? 'border-2 border-secondary bg-secondary/5' : 'border-outline-variant')}>
                    <div className={cn('w-2.5 h-2.5 rounded-full', p.color)} />
                    <span className={cn('text-label-md', priority === p.id ? 'text-deep-navy font-semibold' : 'text-on-surface-variant')}>{p.id}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-label-md text-on-surface-variant mb-2">Message Body</label>
              <div className="border border-outline-variant rounded-lg overflow-hidden focus-within:border-secondary">
                <div className="bg-surface-container-low border-b border-outline-variant p-2 flex items-center gap-1">
                  <button type="button" className="p-1.5 rounded hover:bg-surface-container" title="Bold" onClick={() => bodyRef.current && wrapSelection(bodyRef.current, '**', '**', setBody)}>
                    <span className="material-symbols-outlined text-[20px]">format_bold</span>
                  </button>
                  <button type="button" className="p-1.5 rounded hover:bg-surface-container" title="Italic" onClick={() => bodyRef.current && wrapSelection(bodyRef.current, '_', '_', setBody)}>
                    <span className="material-symbols-outlined text-[20px]">format_italic</span>
                  </button>
                  <button type="button" className="p-1.5 rounded hover:bg-surface-container" title="List" onClick={() => bodyRef.current && wrapSelection(bodyRef.current, '\n- ', '', setBody)}>
                    <span className="material-symbols-outlined text-[20px]">format_list_bulleted</span>
                  </button>
                  <button type="button" className="p-1.5 rounded hover:bg-surface-container" title="Link" onClick={() => bodyRef.current && wrapSelection(bodyRef.current, '[', '](https://)', setBody)}>
                    <span className="material-symbols-outlined text-[20px]">link</span>
                  </button>
                  <button type="button" className="p-1.5 rounded hover:bg-surface-container" title="Image" onClick={() => bodyRef.current && wrapSelection(bodyRef.current, '![', '](https://)', setBody)}>
                    <span className="material-symbols-outlined text-[20px]">image</span>
                  </button>
                </div>
                <textarea ref={bodyRef} className="w-full p-4 border-none outline-none text-body-md resize-none bg-surface-container-lowest" placeholder="Enter your notification message here..." rows={8} value={body} onChange={(e) => setBody(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-label-md text-on-surface-variant mb-2">Attachments (Optional)</label>
              <input ref={fileRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.docx" className="hidden" onChange={(e) => setFiles(Array.from(e.target.files ?? []))} />
              <button type="button" className="w-full border-2 border-dashed border-outline-variant rounded-xl p-8 flex flex-col items-center hover:bg-surface-container-low transition-all" onClick={() => fileRef.current?.click()}>
                <span className="material-symbols-outlined text-4xl text-outline-variant mb-3">cloud_upload</span>
                <p className="text-label-md text-deep-navy font-semibold">Drop files here or click to upload</p>
                <p className="text-body-sm text-on-surface-variant mt-1">PDF, JPG, PNG or DOCX (Max 10MB)</p>
                {files.length > 0 && <p className="text-label-sm text-secondary mt-2">{files.map((f) => f.name).join(', ')}</p>}
              </button>
            </div>
            <div>
              <label className="block text-label-md text-on-surface-variant mb-2">Related Module Context</label>
              <Select value={moduleCtx} onChange={setModuleCtx} options={[
                { value: 'General / System', label: 'General / System' },
                { value: 'Human Resources', label: 'Human Resources' },
                { value: 'Finance & Payroll', label: 'Finance & Payroll' },
                { value: 'Security & Compliance', label: 'Security & Compliance' },
                { value: 'Facility Management', label: 'Facility Management' },
              ]} />
            </div>
          </section>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <section className="bv-surface p-6">
            <h3 className="text-title-lg font-semibold text-deep-navy mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">group_add</span> Recipients
            </h3>
            <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg border border-outline-variant mb-4">
              <div>
                <span className="text-label-md text-deep-navy font-medium block">All Employees</span>
                <span className="text-[11px] text-on-surface-variant">Broadcast to all users</span>
              </div>
              <button type="button" role="switch" aria-checked={broadcastAll} onClick={() => setBroadcastAll((v) => !v)} className={cn('w-11 h-6 rounded-full relative transition-colors', broadcastAll ? 'bg-secondary' : 'bg-outline-variant')}>
                <span className={cn('absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform', broadcastAll && 'translate-x-5')} />
              </button>
            </div>
            {!broadcastAll && (
              <>
                <label className="block text-label-sm text-on-surface-variant mb-2">Target Roles/Teams</label>
                <div className="relative mb-2">
                  <input className="w-full h-10 bg-surface-container-lowest px-4 pl-10 rounded-lg border border-outline-variant text-body-sm outline-none" placeholder="Search roles..." value={roleQuery} onChange={(e) => setRoleQuery(e.target.value)} />
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
                  {roleMatches.length > 0 && (
                    <ul className="absolute z-10 left-0 right-0 mt-1 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg max-h-40 overflow-y-auto">
                      {roleMatches.map((r) => (
                        <li key={r}><button type="button" className="w-full text-left px-3 py-2 text-body-sm hover:bg-surface-container" onClick={() => { setRoles((p) => [...p, r]); setRoleQuery('') }}>{r}</button></li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {roles.map((r) => (
                    <span key={r} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-secondary-container text-on-secondary-container rounded-full text-[11px] font-bold">
                      {r}
                      <button type="button" onClick={() => setRoles((p) => p.filter((x) => x !== r))}><span className="material-symbols-outlined text-[14px]">close</span></button>
                    </span>
                  ))}
                </div>
              </>
            )}
          </section>

          <section className="bv-surface p-6">
            <h3 className="text-title-lg font-semibold text-deep-navy mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">hub</span> Channels
            </h3>
            <p className="text-[11px] text-on-surface-variant mb-3">V1: In-App + Email. SMS disabled.</p>
            <div className="space-y-2">
              {([
                { key: 'inApp' as const, icon: 'dashboard', label: 'In-App Dashboard', disabled: false },
                { key: 'email' as const, icon: 'mail', label: 'Official Email', disabled: false },
                { key: 'sms' as const, icon: 'sms', label: 'SMS Alert (disabled)', disabled: true },
                { key: 'push' as const, icon: 'notifications_active', label: 'Mobile Push', disabled: false },
              ]).map((c) => (
                <label key={c.key} className={cn('flex items-center gap-3 p-3 rounded-lg border border-transparent', c.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-surface-container-low cursor-pointer')}>
                  <input type="checkbox" className="w-4 h-4 rounded border-outline-variant text-secondary" checked={channels[c.key]} disabled={c.disabled} onChange={() => { if (!c.disabled) setChannels((prev) => ({ ...prev, [c.key]: !prev[c.key] })) }} />
                  <span className="material-symbols-outlined text-on-surface-variant">{c.icon}</span>
                  <span className="text-label-md text-on-surface">{c.label}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="bv-surface p-6">
            <h3 className="text-title-lg font-semibold text-deep-navy mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">schedule</span> Scheduling
            </h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="radio" name="schedule" checked={scheduleMode === 'now'} onChange={() => setScheduleMode('now')} className="text-secondary" />
                <span className="text-label-md text-deep-navy font-medium">Send Immediately</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="radio" name="schedule" checked={scheduleMode === 'later'} onChange={() => setScheduleMode('later')} className="text-secondary" />
                <span className="text-label-md text-on-surface-variant">Schedule for later</span>
              </label>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
