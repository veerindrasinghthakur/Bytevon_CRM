import type { NoteItem } from '@/shared/components/notes/NotesPanel'

export type { NoteItem }

export const defaultProjectNotes: NoteItem[] = [
  {
    id: 1,
    body: 'Kickoff complete. Stakeholders aligned on cloud-native migration phases and success metrics.',
    author_name: 'Marcus Sterling',
    author_initials: 'MS',
    created_at: '2026-08-12T10:24:00Z',
    reference_type: 'PROJECT',
    reference_id: 1042,
  },
  {
    id: 2,
    body: 'API gateway latency improved 22% after connection pooling change. Monitor for 48h before next deploy.',
    author_name: 'Sarah Jenkins',
    author_initials: 'SJ',
    created_at: '2026-08-15T14:02:00Z',
    reference_type: 'PROJECT',
    reference_id: 1042,
  },
  {
    id: 3,
    body: 'Risk: vendor SSL cert expires next month — ticket raised with infra.',
    author_name: 'Marcus Sterling',
    author_initials: 'MS',
    created_at: '2026-08-17T09:11:00Z',
    reference_type: 'PROJECT',
    reference_id: 1042,
  },
]

export function notesFor(referenceType: NoteItem['reference_type'], referenceId: number): NoteItem[] {
  return defaultProjectNotes.filter(
    (n) => n.reference_type === referenceType && (referenceId === 0 || n.reference_id === referenceId),
  )
}
