export type NoteItem = {
  id: number
  body: string
  author_name: string
  author_initials: string
  created_at: string
  reference_type: 'PROJECT' | 'LEAD' | 'TASK' | 'CLIENT'
  reference_id: number
}

export const projectNotes: NoteItem[] = [
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
