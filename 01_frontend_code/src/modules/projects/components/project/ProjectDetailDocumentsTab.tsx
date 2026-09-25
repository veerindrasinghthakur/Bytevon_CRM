import { UploadButton } from '@/shared/components/forms/UploadButton'
import type { ProjectDocument } from '../../types'
import { Can } from '@/shared/rbac'
import { Action } from '@/shared/schema'

type UploadMutation = {
  mutateAsync: (files: File[]) => Promise<unknown>
  isPending: boolean
  isError: boolean
}

type Props = {
  docsLoading: boolean
  documents: ProjectDocument[]
  uploadDoc: UploadMutation
  onUploaded: () => void
}

export function ProjectDetailDocumentsTab({
  docsLoading,
  documents,
  uploadDoc,
  onUploaded,
}: Props) {
  return (
    <section className="bv-surface overflow-hidden">
      <div className="px-5 py-4 border-b border-outline-variant flex justify-between items-center gap-3 flex-wrap">
        <h3 className="font-semibold text-title-md">Documents</h3>
        <Can action={Action.UPDATE} resource="project">
          <UploadButton
            onFiles={(files) => {
              const fileArray = files instanceof FileList ? Array.from(files) : files
              void uploadDoc.mutateAsync(fileArray).then(() => onUploaded()).catch(() => {})
            }}
            isLoading={uploadDoc.isPending}
          />
        </Can>
      </div>
      {uploadDoc.isError && (
        <p className="px-5 py-2 text-body-sm text-error" role="alert">
          Failed to upload document.
        </p>
      )}
      {docsLoading ? (
        <p className="p-8 text-center text-on-surface-variant text-sm">Loading documents…</p>
      ) : documents.length === 0 ? (
        <p className="p-8 text-center text-on-surface-variant text-sm">No documents linked yet.</p>
      ) : (
        <ul className="divide-y divide-outline-variant">
          {documents.map((doc) => (
            <li key={doc.id} className="px-5 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{doc.name}</p>
                <p className="text-xs text-on-surface-variant">{doc.sizeLabel ?? doc.type ?? '—'}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}


