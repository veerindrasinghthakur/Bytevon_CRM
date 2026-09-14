import {
  QuickSection,
  QuickStat,
  QuickStatGrid,
  QuickRelatedRow,
  QuickPersonRow,
} from '@/shared/components/layout/QuickOverviewParts'
import type { ProjectDocument } from '../types'

export function iconForMime(type: string, name: string) {
  const t = type.toLowerCase()
  const n = name.toLowerCase()
  if (t.includes('pdf') || n.endsWith('.pdf')) return 'picture_as_pdf'
  if (t.startsWith('image/') || /\.(png|jpe?g|gif|webp)$/.test(n)) return 'image'
  if (t.includes('word') || n.endsWith('.docx') || n.endsWith('.doc')) return 'description'
  return 'attach_file'
}

export function DocumentQuickContent({ d }: { d: ProjectDocument }) {
  return (
    <>
      <QuickSection title="File">
        <QuickStatGrid>
          <QuickStat icon={iconForMime(d.type, d.name)} value={d.sizeLabel} label="Size" />
          <QuickStat icon="category" value={d.type} label="Type" />
          <QuickStat icon="event" value={d.uploadedAt} label="Uploaded" />
        </QuickStatGrid>
      </QuickSection>
      <QuickSection title="Uploader">
        <QuickPersonRow
          initials={(d.uploadedBy ?? '?')
            .split(' ')
            .map((p: string) => p[0])
            .join('')
            .slice(0, 2)}
          roleLabel="Uploaded by"
          name={d.uploadedBy ?? '—'}
        />
      </QuickSection>
      <QuickSection title="Identity">
        <QuickRelatedRow icon="description" label="Name" value={d.name} />
        <QuickRelatedRow icon="tag" label="ID" value={d.id} />
      </QuickSection>
    </>
  )
}
