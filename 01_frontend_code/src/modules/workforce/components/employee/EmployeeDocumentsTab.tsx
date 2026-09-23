import { useEffect, useRef, useState } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { Can } from '@/shared/rbac'
import { Action } from '@/shared/schema'
import { formatFileSize, listDocuments, uploadDocument } from '@/modules/projects/api/document'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import type { ProjectDocument } from '@/modules/projects/types'

export function EmployeeDocumentsTab({ employmentId }: { employmentId: number }) {
  const [docs, setDocs] = useState<ProjectDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await listDocuments({ referenceType: 'EMPLOYMENT', referenceId: employmentId })
      setDocs(res.items)
    } catch (e) {
      setError(getApiErrorMessage(e, 'Could not load documents'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employmentId])

  const onPick = async (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    setError('')
    setUploading(true)
    try {
      const created = await uploadDocument({
        name: file.name,
        type: file.type,
        sizeLabel: formatFileSize(file.size),
        fileSize: file.size,
        referenceType: 'EMPLOYMENT',
        referenceId: employmentId,
      })
      setDocs((d) => [created, ...d])
    } catch (e) {
      setError(getApiErrorMessage(e, 'Upload failed'))
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-body-sm text-on-surface-variant">
          {docs.length} document{docs.length === 1 ? '' : 's'} linked to this employment.
        </p>
        <Can action={Action.CREATE} resource={'document'}>
          <Button
            variant="primary"
            size="sm"
            isLoading={uploading}
            onClick={() => fileRef.current?.click()}
          >
            Add document
          </Button>
        </Can>
      </div>
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        aria-label="Upload employee document"
        onChange={(e) => void onPick(e.target.files)}
      />
      {error && (
        <p role="alert" className="rounded-lg border border-error/30 bg-error/5 px-4 py-2 text-body-sm text-error">
          {error}
        </p>
      )}
      {loading ? (
        <p className="text-body-sm text-on-surface-variant">Loading documents…</p>
      ) : docs.length === 0 ? (
        <p className="text-body-sm text-on-surface-variant">No documents yet.</p>
      ) : (
        <ul className="divide-y divide-outline-variant/30">
          {docs.map((d) => (
            <li key={d.id} className="py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-body-md truncate">{d.name}</p>
                <p className="text-label-sm text-on-surface-variant">
                  {d.sizeLabel} · {d.uploadedAt} · {d.uploadedBy}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
