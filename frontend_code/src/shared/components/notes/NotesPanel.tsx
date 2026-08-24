import { useState } from 'react'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/components/ui/Button'
import { NoteItem, NotesPanelProps } from '@/shared/types'

export type NoteReferenceType = 'PROJECT' | 'LEAD' | 'TASK' 



function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}


export function NotesPanel({
  title = 'Notes',
  className,
  initialNotes = [],
  referenceType = 'PROJECT',
  referenceId = 0,
  onAdd,
}: NotesPanelProps) {
  const [notes, setNotes] = useState<NoteItem[]>(initialNotes)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)

  const add = async () => {
    const body = draft.trim()
    if (!body) return
    setSaving(true)
    try {
      if (onAdd) {
        const created = await onAdd(body)
        if (created) setNotes((list) => [created, ...list])
        else {
          setNotes((list) => [
            {
              id: Math.max(0, ...list.map((n) => n.id)) + 1,
              body,
              author_name: 'You',
              author_initials: 'YO',
              created_at: new Date().toISOString(),
              reference_type: referenceType,
              reference_id: referenceId,
            },
            ...list,
          ])
        }
      } else {
        await new Promise((r) => setTimeout(r, 200))
        setNotes((list) => [
          {
            id: Math.max(0, ...list.map((n) => n.id)) + 1,
            body,
            author_name: 'You',
            author_initials: 'YO',
            created_at: new Date().toISOString(),
            reference_type: referenceType,
            reference_id: referenceId,
          },
          ...list,
        ])
      }
      setDraft('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className={cn(
        'bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm flex flex-col',
        className,
      )}
    >
      <div className="px-5 py-4 border-b border-outline-variant flex items-center justify-between">
        <h3 className="text-title-md font-semibold text-on-background flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary text-[22px]">sticky_note_2</span>
          {title}
        </h3>
        <span className="text-label-sm text-on-surface-variant">{notes.length} notes</span>
      </div>

      <div className="p-4 border-b border-outline-variant space-y-3">
        <textarea
          className="w-full min-h-[88px] rounded-lg border border-outline-variant bg-surface px-3 py-2 text-body-sm focus:outline-none focus:border-secondary resize-y"
          placeholder="Add a note…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <div className="flex justify-end">
          <Button variant="primary" size="sm" disabled={!draft.trim() || saving} onClick={() => void add()}>
            {saving ? 'Saving…' : 'Add note'}
          </Button>
        </div>
      </div>

      <ul className="flex-1 overflow-y-auto max-h-[420px] divide-y divide-outline-variant">
        {notes.length === 0 ? (
          <li className="p-8 text-center text-body-sm text-on-surface-variant">No notes yet.</li>
        ) : (
          notes.map((n) => (
            <li key={n.id} className="p-4 bv-row-hover">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-secondary/15 text-secondary flex items-center justify-center text-label-sm font-bold shrink-0">
                  {n.author_initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-body-sm font-semibold text-on-background">{n.author_name}</span>
                    <span className="text-label-sm text-on-surface-variant">{formatWhen(n.created_at)}</span>
                  </div>
                  <p className="text-body-sm text-on-surface whitespace-pre-wrap">{n.body}</p>
                </div>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  )
}
