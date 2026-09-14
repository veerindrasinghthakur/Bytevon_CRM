import { useMemo, useState } from 'react'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Select } from '@/shared/components/ui/Select'
import { ExportButton } from '@/shared/components/export/ExportButton'
import { UploadButton } from '@/shared/components/forms/UploadButton'
import { RefreshButton } from '@/shared/components/ui/RefreshButton'
import { FilePreviewModal } from '@/shared/components/documents/FilePreviewModal'
import type { FilePreviewItem } from '@/shared/types'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import { ListToolbar } from '@/shared/components/layout/ListToolbar'
import { useQuickOverview } from '@/shared/components/layout/QuickOverview'
import { useListControls } from '@/shared/hooks/useListControls'
import { downloadFile } from '@/shared/lib/download-file'
import { ResourceName } from '@/shared/schema'
import { useDocuments, useUploadDocument } from '../../hooks/document/use-documents'
import { DocumentQuickContent, iconForMime } from '../../components/DocumentQuickContent'
import type { ProjectDocument } from '../../types'

const FILTER_DEFAULTS = { type: '' }

export function DocumentsPage() {
  const controls = useListControls({ filterDefaults: FILTER_DEFAULTS })
  const search = controls.search
  const typeFilter = controls.filters.type

  const { data, isLoading, isError, refetch, isFetching } = useDocuments({
    search: search || undefined,
  })
  const uploadMutation = useUploadDocument()
  const [preview, setPreview] = useState<FilePreviewItem | null>(null)
  const { openPanel } = useQuickOverview()

  const items = useMemo(() => {
    let list = data?.items ?? []
    if (typeFilter === 'pdf') list = list.filter((d) => d.type.includes('pdf') || d.name.endsWith('.pdf'))
    if (typeFilter === 'image')
      list = list.filter((d) => d.type.startsWith('image') || /\.(png|jpe?g|gif)$/i.test(d.name))
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

  const openDocOverview = (d: ProjectDocument) => {
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

      <ListToolbar
        search={search}
        onSearchChange={controls.setSearch}
        searchPlaceholder="Search documents…"
        filtersActive={controls.anyActive}
        onResetFilters={controls.resetAll}
        onRefresh={() => void refetch()}
      >
        <Select
          value={typeFilter}
          onChange={(v) => controls.setFilter('type', v)}
          placeholder="All types"
          aria-label="Filter by document type"
          options={[
            { value: '', label: 'All types' },
            { value: 'pdf', label: 'PDF' },
            { value: 'image', label: 'Images' },
            { value: 'doc', label: 'Word' },
          ]}
        />
      </ListToolbar>

      {isLoading && (
        <div className="bv-surface p-12 text-center text-on-surface-variant">Loading documents…</div>
      )}
      {isError && (
        <ErrorState
          title="Failed to load documents"
          description="We could not load documents. Check your connection and try again."
          onRetry={() => void refetch()}
        />
      )}
      {!isLoading && !isError && items.length === 0 && (
        <EmptyState
          icon="folder_off"
          title="No documents"
          description="Upload your first file to get started."
        />
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
                <tr key={d.id} className="zebra-row cursor-pointer" onClick={() => openDocOverview(d)}>
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
