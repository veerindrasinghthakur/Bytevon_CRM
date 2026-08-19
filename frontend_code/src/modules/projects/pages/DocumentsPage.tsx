import { useMemo, useState } from 'react'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import { documentsList, type DocumentItem } from '../data/documentsMock'
import { cn } from '@/shared/lib/cn'

function iconFor(mime: string) {
  if (mime.includes('pdf')) return 'picture_as_pdf'
  if (mime.startsWith('image/')) return 'image'
  if (mime.includes('word') || mime.includes('document')) return 'description'
  return 'attach_file'
}

export function DocumentsPage() {
  const [q, setQ] = useState('')
  const [items] = useState<DocumentItem[]>(documentsList)

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return items
    return items.filter(
      (d) =>
        d.name.toLowerCase().includes(s) ||
        d.uploaded_by.toLowerCase().includes(s) ||
        d.reference_type.toLowerCase().includes(s),
    )
  }, [items, q])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        description="Organization and entity-linked files"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                search
              </span>
              <input
                className="w-[240px] pl-9 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-sm focus:outline-none focus:border-secondary shadow-sm"
                placeholder="Search documents…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <Button
              variant="primary"
              leftIcon={<span className="material-symbols-outlined text-lg">upload</span>}
              onClick={() => {}}
            >
              Upload
            </Button>
          </div>
        }
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon="folder_off"
          title="No documents"
          description="Upload a file or adjust your search."
        />
      ) : (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                {['Name', 'Linked to', 'Uploaded by', 'Date', 'Size', ''].map((h) => (
                  <th key={h} className="px-5 py-3 text-label-sm uppercase text-on-surface-variant">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id} className="border-b border-outline-variant last:border-0 bv-row-hover">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-secondary">{iconFor(d.mime_type)}</span>
                      <span className="font-medium text-on-background">{d.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-surface-container text-on-surface-variant">
                      {d.reference_type}
                      {d.reference_id ? ` #${d.reference_id}` : ''}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-body-sm">{d.uploaded_by}</td>
                  <td className="px-5 py-3 text-body-sm text-on-surface-variant">{d.uploaded_at}</td>
                  <td className="px-5 py-3 text-body-sm">{d.size_label}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      className={cn(
                        'text-secondary text-sm font-medium hover:underline cursor-pointer',
                      )}
                    >
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
