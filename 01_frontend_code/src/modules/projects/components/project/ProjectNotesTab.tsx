import { useState } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { Skeleton } from '@/shared/components/feedback/Skeleton'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { NoteReferenceType } from '@/shared/schema'
import { useCreateNote, useNotes, useUpdateNote } from '../../hooks/note/use-notes'
import type { BackendNote } from '../../api/note'

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

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

/**
 * Project notes tab — synced with the backend notes operations
 * (GET/POST/PATCH /projects/notes). Backend note refs are LEAD | TASK |
 * CLIENT only, so project-level notes ride on a TASK reference carrying the
 * project id (same convention as ProjectNotesPage). Fields mirror the
 * backend schema: title, content, reference_type, reference_id.
 */
export function ProjectNotesTab({ projectId }: { projectId: number }) {
  const notesQuery = useNotes({ referenceType: NoteReferenceType.TASK, referenceId: projectId })
  const createMutation = useCreateNote({
    referenceType: NoteReferenceType.TASK,
    referenceId: projectId,
  })
  const updateMutation = useUpdateNote()

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editBody, setEditBody] = useState('')

  const notes: BackendNote[] = notesQuery.data?.items ?? []

  const submit = async () => {
    setFormError(null)
    if (!body.trim()) {
      setFormError('Write the note content first.')
      return
    }
    try {
      await createMutation.mutateAsync({ title: title.trim(), body: body.trim() })
      setTitle('')
      setBody('')
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Could not save note'))
    }
  }

  const startEdit = (n: BackendNote) => {
    setEditingId(n.id)
    setEditTitle(n.title)
    setEditBody(n.body)
  }

  const saveEdit = async () => {
    if (editingId == null) return
    try {
      await updateMutation.mutateAsync({
        id: editingId,
        patch: { title: editTitle.trim(), body: editBody.trim() },
      })
      setEditingId(null)
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Could not update note'))
    }
  }

  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm flex flex-col max-w-3xl">
      <div className="px-5 py-4 border-b border-outline-variant flex items-center justify-between">
        <h3 className="text-title-md font-semibold text-on-background flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary text-[22px]">sticky_note_2</span>
          Project notes
        </h3>
        <span className="text-label-sm text-on-surface-variant">{notes.length} notes</span>
      </div>

      <div className="p-4 border-b border-outline-variant space-y-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title"
          className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-body-sm focus:outline-none focus:border-secondary"
        />
        <textarea
          className="w-full min-h-[88px] rounded-lg border border-outline-variant bg-surface px-3 py-2 text-body-sm focus:outline-none focus:border-secondary resize-y"
          placeholder="Add a note…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        {formError && (
          <p className="text-body-sm text-error" role="alert">
            {formError}
          </p>
        )}
        <div className="flex justify-end">
          <Button
            variant="primary"
            size="sm"
            disabled={!body.trim() || createMutation.isPending}
            onClick={() => void submit()}
          >
            {createMutation.isPending ? 'Saving…' : 'Add note'}
          </Button>
        </div>
      </div>

      <ul className="flex-1 overflow-y-auto max-h-[420px] divide-y divide-outline-variant">
        {notesQuery.isLoading && (
          <li className="p-4">
            <Skeleton className="h-16 w-full" />
          </li>
        )}
        {!notesQuery.isLoading && notesQuery.isError && (
          <li className="p-8 text-center text-body-sm text-error">
            Could not load notes.{' '}
            <button type="button" className="underline" onClick={() => void notesQuery.refetch()}>
              Retry
            </button>
          </li>
        )}
        {!notesQuery.isLoading && !notesQuery.isError && notes.length === 0 && (
          <li className="p-8 text-center text-body-sm text-on-surface-variant">No notes yet.</li>
        )}
        {notes.map((n) => (
          <li key={n.id} className="p-4 bv-row-hover">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-secondary/15 text-secondary flex items-center justify-center text-label-sm font-bold shrink-0">
                {initials(n.author)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-body-sm font-semibold text-on-background">{n.author}</span>
                  <span className="text-label-sm text-on-surface-variant">{formatWhen(n.createdAt)}</span>
                  {n.updatedAt && n.updatedAt !== n.createdAt && (
                    <span className="text-label-sm text-on-surface-variant">
                      · edited {formatWhen(n.updatedAt)}
                    </span>
                  )}
                </div>
                {editingId === n.id ? (
                  <div className="space-y-2 mt-1">
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-1.5 text-body-sm focus:outline-none focus:border-secondary"
                    />
                    <textarea
                      rows={3}
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-1.5 text-body-sm focus:outline-none focus:border-secondary resize-y"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={updateMutation.isPending}
                        onClick={() => void saveEdit()}
                      >
                        {updateMutation.isPending ? 'Saving…' : 'Save'}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {n.title && (
                      <p className="text-body-sm font-semibold text-on-surface">{n.title}</p>
                    )}
                    <p className="text-body-sm text-on-surface whitespace-pre-wrap">{n.body}</p>
                    <button
                      type="button"
                      className="mt-1 text-label-sm text-secondary hover:underline"
                      onClick={() => startEdit(n)}
                    >
                      Edit
                    </button>
                  </>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
