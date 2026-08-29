import { useMemo, useState } from 'react'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { Select } from '@/shared/components/ui/Select'
import { ExportButton } from '@/shared/components/export/ExportButton'
import { UploadButton } from '@/shared/components/forms/UploadButton'
import { RefreshButton } from '@/shared/components/ui/RefreshButton'
import { FilePreviewModal, type FilePreviewItem } from '@/shared/components/documents/FilePreviewModal'
import { useQuickOverview } from '@/shared/components/layout/QuickOverview'
import {
  QuickSection,
  QuickStat,
  QuickStatGrid,
  QuickMetaTile,
  QuickRelatedRow,
  QuickPersonRow,
} from '@/shared/components/layout/QuickOverviewParts'
import { downloadFile } from '@/shared/lib/download-file'
import { ResourceName } from '@/shared/schema'
import { useDocuments, useUploadDocument } from '../hooks/use-documents'

function iconForMime(type: string, name: string) {
  const t = type.toLowerCase()
  const n = name.toLowerCase()
  if (t.includes('pdf') || n.endsWith('.pdf')) return 'picture_as_pdf'
  if (t.startsWith('image/') || /\.(png|jpe?g|gif|webp)$/.test(n)) return 'image'
  if (t.includes('word') || n.endsWith('.docx') || n.endsWith('.doc')) return 'description'
  return 'attach_file'
}

interface DocRow {
  id: string
  name: string
  type: string
  sizeLabel: string
  uploadedBy: string
  uploadedAt: string
  url?: string
  referenceType?: string
  referenceId?: number
}

function DocumentQuickContent({ d }: { d: DocRow }) {
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

export function DocumentsPage() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const { data, isLoading, isError, refetch, isFetching } = useDocuments({
    search: search || undefined,
  })
  const uploadMutation = useUploadDocument()
  const [preview, setPreview] = useState<FilePreviewItem | null>(null)
  const { openPanel } = useQuickOverview()

  const items = useMemo(() => {
    let list = data?.items ?? []
    if (typeFilter === 'pdf') list = list.filter((d) => d.type.includes('pdf') || d.name.endsWith('.pdf'))
    if (typeFilter === 'image') list = list.filter((d) => d.type.startsWith('image') || /\.(png|jpe?g|gif)$/i.test(d.name))
    if (typeFilter === 'doc') list = list.filter((d) => d.type.includes('word') || /\.docx?$/i.test(d.name))
    return list
  }, [data, typeFilter])

  const downloadOne = (name: string, url?: string) => {
    if (url) {
      const a = document.createElement('a')
      a.href = url
      a.download = name
      a.target = '_blank'
      a.rel = 'noopener'
      document.body.appendChild(a)
      a.click()
      a.remove()
      return
    }
    downloadFile({
      blob: new Blob([`Placeholder content for ${name}`], { type: 'text/plain' }),
      filename: name,
    })
  }

  const openDocOverview = (d: DocRow) => {
    openPanel({
      title: d.name,
      subtitle: `${d.sizeLabel} · ${d.type}`,
      icon: iconForMime(d.type, d.name),
      status: 'Document',
      statusDotClass: 'bg-secondary',
      content: <DocumentQuickContent d={d} />,
      secondaryLabel: 'Preview',
      onSecondary: () =>
        setPreview({
          id: d.id,
          name: d.name,
          mimeType: d.type,
          sizeLabel: d.sizeLabel,
          uploadedBy: d.uploadedBy,
          uploadedAt: d.uploadedAt,
          url: d.url,
        }),
      widthClass: 'max-w-[520px]',
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Documents"
        description="Project and organization documents. Upload, preview, and download."
        actions={
          <div className="flex flex-wrap gap-2">
            <RefreshButton onClick={() => void refetch()} isLoading={isFetching} iconOnly />
            <ExportButton resource={ResourceName.DOCUMENT} query={search} selectedIds={[]} filenameStem="documents" />
            <UploadButton
              label="Upload"
              onFiles={(files) => void uploadMutation.mutateAsync(files)}
              disabled={uploadMutation.isPending}
            />
          </div>
        }
      />

      <div className="flex flex-wrap gap-3 items-center bv-surface p-4">
        <div className="relative flex-1 min-w-[200px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
            search
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-lg text-body-sm outline-none focus:ring-2 focus:ring-secondary/30"
            placeholder="Search documents…"
          />
        </div>
        <Select
          value={typeFilter}
          onChange={setTypeFilter}
          placeholder="All types"
          options={[
            { value: '', label: 'All types' },
            { value: 'pdf', label: 'PDF' },
            { value: 'image', label: 'Images' },
            { value: 'doc', label: 'Word' },
          ]}
        />
      </div>

      {isLoading && (
        <div className="bv-surface p-12 text-center text-on-surface-variant">Loading documents…</div>
      )}
      {isError && (
        <div className="bv-surface p-8 text-center">
          <p className="text-error mb-3">Failed to load documents.</p>
          <Button variant="outline" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      )}
      {!isLoading && !isError && items.length === 0 && (
        <div className="bv-surface p-12 text-center space-y-2">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant">folder_off</span>
          <p className="font-semibold">No documents</p>
          <UploadButton label="Upload first file" onFiles={(files) => void uploadMutation.mutateAsync(files)} />
        </div>
      )}

      {!isLoading && items.length > 0 && (
        <div className="bv-surface overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container-low/50">
                <th className="px-4 py-3 text-label-sm font-semibold text-on-surface-variant uppercase">Name</th>
                <th className="px-4 py-3 text-label-sm font-semibold text-on-surface-variant uppercase">Size</th>
                <th className="px-4 py-3 text-label-sm font-semibold text-on-surface-variant uppercase">Uploaded by</th>
                <th className="px-4 py-3 text-label-sm font-semibold text-on-surface-variant uppercase">Date</th>
                <th className="px-4 py-3 text-label-sm font-semibold text-on-surface-variant uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {items.map((d) => (
                <tr
                  key={d.id}
                  className="zebra-row cursor-pointer"
                  onClick={() => openDocOverview(d)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-secondary">
                        {iconForMime(d.type, d.name)}
                      </span>
                      <div>
                        <p className="font-medium text-on-surface">{d.name}</p>
                        <p className="text-xs text-on-surface-variant">{d.type}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-body-sm">{d.sizeLabel}</td>
                  <td className="px-4 py-3 text-body-sm">{d.uploadedBy}</td>
                  <td className="px-4 py-3 text-body-sm">{d.uploadedAt}</td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        className="p-2 rounded-lg hover:bg-surface-container text-on-surface-variant"
                        title="Preview"
                        onClick={() =>
                          setPreview({
                            id: d.id,
                            name: d.name,
                            mimeType: d.type,
                            sizeLabel: d.sizeLabel,
                            uploadedBy: d.uploadedBy,
                            uploadedAt: d.uploadedAt,
                            url: d.url,
                          })
                        }
                      >
                        <span className="material-symbols-outlined text-lg">visibility</span>
                      </button>
                      <button
                        type="button"
                        className="p-2 rounded-lg hover:bg-surface-container text-on-surface-variant"
                        title="Download"
                        onClick={() => downloadOne(d.name, d.url)}
                      >
                        <span className="material-symbols-outlined text-lg">download</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-outline-variant text-label-sm text-on-surface-variant">
            Showing {items.length} document{items.length === 1 ? '' : 's'}
          </div>
        </div>
      )}

      <FilePreviewModal open={Boolean(preview)} file={preview} onClose={() => setPreview(null)} />
    </div>
  )
}
