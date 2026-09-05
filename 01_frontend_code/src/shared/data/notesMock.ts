import type { NoteItem } from '@/shared/types'
import { NoteReferenceType } from '@/shared/schema'

export type { NoteItem }

/** Sample notes — schema allows LEAD | TASK | CLIENT only (no PROJECT). */
export const defaultNotes: NoteItem[] = [
  {
    id: 1,
    body: 'Kickoff complete. Stakeholders aligned on cloud-native migration phases and success metrics.',
    author_name: 'Marcus Sterling',
    author_initials: 'MS',
    created_at: '2026-08-12T10:24:00Z',
    reference_type: NoteReferenceType.TASK,
    reference_id: 1042,
  },
  {
    id: 2,
    body: 'API gateway latency improved 22% after connection pooling change. Monitor for 48h before next deploy.',
    author_name: 'Sarah Jenkins',
    author_initials: 'SJ',
    created_at: '2026-08-15T14:02:00Z',
    reference_type: NoteReferenceType.TASK,
    reference_id: 1042,
  },
  {
    id: 3,
    body: 'Risk: vendor SSL cert expires next month — ticket raised with infra.',
    author_name: 'Marcus Sterling',
    author_initials: 'MS',
    created_at: '2026-08-17T09:11:00Z',
    reference_type: NoteReferenceType.TASK,
    reference_id: 1042,
  },
  {
    id: 4,
    body: 'Qualified after discovery call. Budget confirmed in Q3 range.',
    author_name: 'Alex Rivera',
    author_initials: 'AR',
    created_at: '2026-08-18T11:00:00Z',
    reference_type: NoteReferenceType.LEAD,
    reference_id: 1,
  },
  {
    id: 5,
    body: 'Enterprise renewal discussion scheduled for next week.',
    author_name: 'Alex Rivera',
    author_initials: 'AR',
    created_at: '2026-08-19T09:30:00Z',
    reference_type: NoteReferenceType.CLIENT,
    reference_id: 1,
  },
]

/** @deprecated use defaultNotes */
export const defaultProjectNotes = defaultNotes.filter(
  (n) => n.reference_type === NoteReferenceType.TASK,
)

export function notesFor(
  referenceType: NoteItem['reference_type'],
  referenceId: number,
): NoteItem[] {
  return defaultNotes.filter(
    (n) =>
      n.reference_type === referenceType &&
      (referenceId === 0 || n.reference_id === referenceId),
  )
}
