import { useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/shared/components/ui/Button'
import { Select } from '@/shared/components/ui/Select'
import { SaveDraftButton } from '@/shared/components/ui/SaveDraftButton'
import { DocumentUpload } from '@/shared/components/forms/DocumentUpload'
import { BackButton } from '@/shared/components/layout/BackButton'
import { cn } from '@/shared/lib/cn'
import { invalidate } from '@/shared/lib/query-keys'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { sendNotification } from '../../api/compose'
import { createDraft, deleteDraft, listDrafts, type DraftInput } from '../../api/drafts'
import { uploadAttachment } from '../../api/attachments'
import {
  composeNotificationFormSchema,
  emptyComposeForm,
  type ComposeNotificationForm,
} from '../../schemas/notification-form'
import {
  priorityDotClass,
  COMPOSE_ROLE_SUGGESTIONS,
  COMPOSE_MODULE_OPTIONS,
  PRIORITY_OPTIONS,
} from '../../schemas/enums'
import { notificationRoutes } from '../../routes'
import type { NotificationPriority } from '../../types'
import { Can } from '@/shared/rbac'
import { Action } from '@/shared/schema'

function wrapSelection(
  textarea: HTMLTextAreaElement,
  before: string,
  after: string,
  setValue: (name: 'body', value: string, opts?: { shouldDirty?: boolean }) => void,
  getValue: () => string,
) {
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const val = getValue()
  const selected = val.slice(start, end) || 'text'
  const next = val.slice(0, start) + before + selected + after + val.slice(end)
  setValue('body', next, { shouldDirty: true })
  requestAnimationFrame(() => {
    textarea.focus()
    const pos = start + before.length + selected.length + after.length
    textarea.setSelectionRange(pos, pos)
  })
}

function defaultScheduleDate() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

export function ComposeNotificationPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const bodyRef = useRef<HTMLTextAreaElement | null>(null)

  const empty = emptyComposeForm()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ComposeNotificationForm>({
    resolver: zodResolver(composeNotificationFormSchema),
    defaultValues: {
      title: empty.title,
      body: empty.body,
      priority: empty.priority,
      moduleCtx: empty.moduleCtx,
      broadcastAll: empty.broadcastAll,
      roles: empty.roles,
      channels: empty.channels,
      scheduleMode: empty.scheduleMode,
      scheduleAt: empty.scheduleAt,
      attachmentNames: empty.attachmentNames,
    },
  })

  const priority = watch('priority')
  const broadcastAll = watch('broadcastAll')
  const scheduleMode = watch('scheduleMode')
  const moduleCtx = watch('moduleCtx')

  const [files, setFiles] = useState<File[]>([])
  const [toast, setToast] = useState<string | null>(null)
  const [roleQuery, setRoleQuery] = useState('')

  const draftsQuery = useQuery({
    queryKey: ['notifications', 'drafts'] as const,
    queryFn: listDrafts,
  })

  const toDraftInput = (data: ComposeNotificationForm): DraftInput => ({
    title: data.title,
    body: data.body,
    priority: data.priority,
    module_ctx: data.moduleCtx ?? '',
    broadcast_all: data.broadcastAll,
    roles: data.roles,
    channels: data.channels as Record<string, unknown>,
    schedule_mode: data.scheduleMode,
    schedule_at: data.scheduleAt ?? null,
  })

  const sendMut = useMutation({
    mutationFn: async (data: ComposeNotificationForm) => {
      // Upload attachments for real first, then send with their ids.
      const attachmentIds: number[] = []
      for (const f of files) {
        const uploaded = await uploadAttachment(f)
        attachmentIds.push(uploaded.id)
      }
      return sendNotification({ ...data, attachment_ids: attachmentIds } as ComposeNotificationForm)
    },
    onSuccess: (res) => {
      void invalidate.notifications(qc)
      setToast(
        scheduleMode === 'later'
          ? `Scheduled for ${watch('scheduleAt')?.slice(0, 16).replace('T', ' ')} · ${res.queued} recipient(s).`
          : `Queued to ${res.queued} recipient(s).`,
      )
      window.setTimeout(() => safeNavigate(navigate, { to: notificationRoutes.sent }), 900)
    },
    onError: () => {
      setToast('Could not send — attachments or delivery failed.')
      window.setTimeout(() => setToast(null), 3000)
    },
  })

  const draftMut = useMutation({
    mutationFn: (data: ComposeNotificationForm) => createDraft(toDraftInput(data)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['notifications', 'drafts'] })
      setToast('Draft saved.')
      window.setTimeout(() => setToast(null), 2000)
    },
  })

  const deleteDraftMut = useMutation({
    mutationFn: deleteDraft,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['notifications', 'drafts'] }),
  })

  const onSubmit = (data: ComposeNotificationForm) => {
    sendMut.mutate(data)
  }

  const onSaveDraft = (data: ComposeNotificationForm) => {
    draftMut.mutate(data)
  }

  const loadDraft = (id: number) => {
    const d = draftsQuery.data?.find((x) => x.id === id)
    if (!d) return
    setValue('title', d.title)
    setValue('body', d.body)
    setValue('priority', d.priority as ComposeNotificationForm['priority'])
    setValue('moduleCtx', d.module_ctx)
    setValue('broadcastAll', d.broadcast_all)
    setValue('roles', d.roles)
    setValue('scheduleMode', (d.schedule_mode === 'later' ? 'later' : 'now') as 'now' | 'later')
    setValue('scheduleAt', d.schedule_at ?? undefined)
    setToast('Draft loaded.')
    window.setTimeout(() => setToast(null), 2000)
  }

  const roleMatches = COMPOSE_ROLE_SUGGESTIONS.filter(
    (r) => roleQuery && r.toLowerCase().includes(roleQuery.toLowerCase()) && !watch('roles').includes(r),
  )

  const { ref: bodyRegisterRef, ...bodyField } = register('body')

  return (
    <div className="space-y-6 animate-fade-in">
      <BackButton to={notificationRoutes.center} label="Back to Notification Center" />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-headline-lg font-semibold text-on-background tracking-tight">Compose Notification</h1>
          <p className="text-body-md text-on-surface-variant mt-1">
            Design and broadcast system-wide or targeted alerts.
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Button
            variant="outline"
            size="md"
            onClick={() => safeNavigate(navigate, { to: notificationRoutes.center })}
          >
            Discard
          </Button>
          <Can action={Action.CREATE} resource="notification">
            <SaveDraftButton isLoading={draftMut.isPending} onClick={() => handleSubmit(onSaveDraft)()} />
          </Can>
          <Can action={Action.CREATE} resource="notification">
            <Button
              variant="primary"
              size="md"
              leftIcon={<span className="material-symbols-outlined text-[20px]">send</span>}
              isLoading={sendMut.isPending || isSubmitting}
              onClick={() => handleSubmit(onSubmit)()}
            >
              {scheduleMode === 'later' ? 'Schedule Send' : 'Send Notification'}
            </Button>
          </Can>
        </div>
      </div>

      {toast && (
        <div className="rounded-lg border border-secondary/30 bg-secondary/10 px-4 py-3 text-label-md text-secondary">
          {toast}
        </div>
      )}

      {(draftsQuery.data?.length ?? 0) > 0 && (
        <section className="bv-surface p-4">
          <h3 className="text-label-md font-semibold text-on-surface-variant uppercase tracking-wider mb-3">
            Saved drafts ({draftsQuery.data?.length})
          </h3>
          <ul className="divide-y divide-outline-variant/40">
            {draftsQuery.data?.map((d) => (
              <li key={d.id} className="py-2 flex items-center gap-3 justify-between">
                <div className="min-w-0">
                  <p className="text-body-md font-medium text-on-background truncate">
                    {d.title || '(untitled draft)'}
                  </p>
                  <p className="text-label-sm text-on-surface-variant">
                    {d.priority} · {new Date(d.updated_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => loadDraft(d.id)}>
                    Load
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={deleteDraftMut.isPending}
                    onClick={() => deleteDraftMut.mutate(d.id)}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-6">
            <section className="bv-surface p-6 space-y-6">
              <h3 className="text-title-lg font-semibold text-on-background flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">mail</span> Notification Content
              </h3>
              <div>
                <label className="block text-label-md text-on-surface-variant mb-2">Notification Title</label>
                <input
                  {...register('title')}
                  className={cn(
                    'w-full h-12 bg-surface-container-lowest px-4 rounded-lg border outline-none text-body-md',
                    errors.title ? 'border-error' : 'border-outline-variant focus:border-secondary',
                  )}
                  placeholder="e.g., Scheduled Maintenance Downtime"
                />
                {errors.title && <p className="text-label-sm text-error mt-1">{errors.title.message}</p>}
              </div>
              <div>
                <label className="block text-label-md text-on-surface-variant mb-2">Priority Level</label>
                <div className="flex gap-3 flex-wrap">
                  {PRIORITY_OPTIONS.map((id: NotificationPriority) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setValue('priority', id, { shouldValidate: true })}
                      className={cn(
                        'flex-1 min-w-[100px] py-3 px-4 rounded-lg border flex items-center justify-center gap-2',
                        priority === id
                          ? 'border-2 border-secondary bg-secondary/5'
                          : 'border-outline-variant',
                      )}
                    >
                      <div className={cn('w-2.5 h-2.5 rounded-full', priorityDotClass[id])} />
                      <span
                        className={cn(
                          'text-label-md',
                          priority === id ? 'text-on-background font-semibold' : 'text-on-surface-variant',
                        )}
                      >
                        {id}
                      </span>
                    </button>
                  ))}
                </div>
                <input type="hidden" {...register('priority')} />
              </div>
              <div>
                <label className="block text-label-md text-on-surface-variant mb-2">Message Body</label>
                <div
                  className={cn(
                    'border rounded-lg overflow-hidden focus-within:border-secondary',
                    errors.body ? 'border-error' : 'border-outline-variant',
                  )}
                >
                  <div className="bg-surface-container-low border-b border-outline-variant p-2 flex items-center gap-1">
                    <button
                      type="button"
                      className="p-1.5 rounded hover:bg-surface-container"
                      title="Bold"
                      onClick={() =>
                        bodyRef.current &&
                        wrapSelection(bodyRef.current, '**', '**', setValue, () => watch('body'))
                      }
                    >
                      <span className="material-symbols-outlined text-[20px]">format_bold</span>
                    </button>
                    <button
                      type="button"
                      className="p-1.5 rounded hover:bg-surface-container"
                      title="Italic"
                      onClick={() =>
                        bodyRef.current &&
                        wrapSelection(bodyRef.current, '_', '_', setValue, () => watch('body'))
                      }
                    >
                      <span className="material-symbols-outlined text-[20px]">format_italic</span>
                    </button>
                    <button
                      type="button"
                      className="p-1.5 rounded hover:bg-surface-container"
                      title="List"
                      onClick={() =>
                        bodyRef.current &&
                        wrapSelection(bodyRef.current, '\n- ', '', setValue, () => watch('body'))
                      }
                    >
                      <span className="material-symbols-outlined text-[20px]">format_list_bulleted</span>
                    </button>
                    <button
                      type="button"
                      className="p-1.5 rounded hover:bg-surface-container"
                      title="Link"
                      onClick={() =>
                        bodyRef.current &&
                        wrapSelection(bodyRef.current, '[', '](https://)', setValue, () => watch('body'))
                      }
                    >
                      <span className="material-symbols-outlined text-[20px]">link</span>
                    </button>
                  </div>
                  <textarea
                    {...bodyField}
                    ref={(el) => {
                      bodyRef.current = el
                      bodyRegisterRef(el)
                    }}
                    className="w-full p-4 border-none outline-none text-body-md resize-none bg-surface-container-lowest"
                    placeholder="Enter your notification message here..."
                    rows={8}
                  />
                </div>
                {errors.body && <p className="text-label-sm text-error mt-1">{errors.body.message}</p>}
              </div>
              <div>
                <label className="block text-label-md text-on-surface-variant mb-2">Attachments (Optional)</label>
                <DocumentUpload files={files} onChange={setFiles} />
              </div>
              <div>
                <label className="block text-label-md text-on-surface-variant mb-2">Related Module Context</label>
                <Select
                  value={moduleCtx ?? ''}
                  onChange={(v) => setValue('moduleCtx', v, { shouldValidate: true })}
                  options={[...COMPOSE_MODULE_OPTIONS]}
                />
              </div>
            </section>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <section className="bv-surface p-6">
              <h3 className="text-title-lg font-semibold text-on-background mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">group_add</span> Recipients
              </h3>
              <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg border border-outline-variant mb-4">
                <div>
                  <span className="text-label-md text-on-background font-medium block">All Employees</span>
                  <span className="text-[11px] text-on-surface-variant">Broadcast to all users</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={broadcastAll}
                  onClick={() => setValue('broadcastAll', !broadcastAll, { shouldValidate: true })}
                  className={cn(
                    'w-11 h-6 rounded-full relative transition-colors',
                    broadcastAll ? 'bg-secondary' : 'bg-outline-variant',
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 left-0.5 w-5 h-5 bg-surface-container-lowest rounded-full transition-transform',
                      broadcastAll && 'translate-x-5',
                    )}
                  />
                </button>
              </div>
              {!broadcastAll && (
                <>
                  <label className="block text-label-sm text-on-surface-variant mb-2">Target Roles/Teams</label>
                  <div className="relative mb-2">
                    <input
                      className="w-full h-10 bg-surface-container-lowest px-4 pl-10 rounded-lg border border-outline-variant text-body-sm outline-none"
                      placeholder="Search roles..."
                      value={roleQuery}
                      onChange={(e) => setRoleQuery(e.target.value)}
                    />
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                      search
                    </span>
                    {roleMatches.length > 0 && (
                      <ul className="absolute z-10 left-0 right-0 mt-1 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg max-h-40 overflow-y-auto">
                        {roleMatches.map((r) => (
                          <li key={r}>
                            <button
                              type="button"
                              className="w-full text-left px-3 py-2 text-body-sm hover:bg-surface-container"
                              onClick={() => {
                                setValue('roles', [...watch('roles'), r], { shouldDirty: true })
                                setRoleQuery('')
                              }}
                            >
                              {r}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {watch('roles').map((r) => (
                      <span
                        key={r}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-secondary-container text-on-secondary-container rounded-full text-[11px] font-bold"
                      >
                        {r}
                        <button
                          type="button"
                          onClick={() =>
                            setValue(
                              'roles',
                              watch('roles').filter((x) => x !== r),
                              { shouldDirty: true },
                            )
                          }
                        >
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      </span>
                    ))}
                  </div>
                </>
              )}
            </section>

            <section className="bv-surface p-6">
              <h3 className="text-title-lg font-semibold text-on-background mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">hub</span> Channels
              </h3>
              <p className="text-[11px] text-on-surface-variant mb-3">V1: In-App + Email.</p>
              <div className="space-y-2">
                {(
                  [
                    { key: 'inApp' as const, icon: 'dashboard', label: 'In-App Dashboard', disabled: false },
                    { key: 'email' as const, icon: 'mail', label: 'Official Email', disabled: false },
                    { key: 'push' as const, icon: 'notifications_active', label: 'Mobile Push', disabled: false },
                  ] as const
                ).map((c) => (
                  <label
                    key={c.key}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border border-transparent',
                      c.disabled
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-surface-container-low cursor-pointer',
                    )}
                  >
                    <input
                      type="checkbox"
                      {...register(`channels.${c.key}` as const)}
                      disabled={c.disabled}
                      className="w-4 h-4 rounded border-outline-variant text-secondary"
                    />
                    <span className="material-symbols-outlined text-on-surface-variant">{c.icon}</span>
                    <span className="text-label-md text-on-surface">{c.label}</span>
                  </label>
                ))}
              </div>
            </section>

            <section className="bv-surface p-6">
              <h3 className="text-title-lg font-semibold text-on-background mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">schedule</span> Scheduling
              </h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" {...register('scheduleMode')} value="now" className="text-secondary" />
                  <span className="text-label-md text-on-background font-medium">Send Immediately</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" {...register('scheduleMode')} value="later" className="text-secondary" />
                  <span className="text-label-md text-on-surface-variant">Schedule for later</span>
                </label>
                {scheduleMode === 'later' && (
                  <div className="pl-7 pt-1">
                    <label className="block text-label-sm text-on-surface-variant mb-1">Send at</label>
                    <input
                      type="datetime-local"
                      {...register('scheduleAt')}
                      defaultValue={`${defaultScheduleDate()}T09:00`}
                      className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-body-sm outline-none focus:border-secondary"
                    />
                    {errors.scheduleAt && (
                      <p className="text-label-sm text-error mt-1">{errors.scheduleAt.message}</p>
                    )}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </form>
    </div>
  )
}
