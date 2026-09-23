import { useMemo, useState } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { Select } from '@/shared/components/ui/Select'
import { UploadButton } from '@/shared/components/forms/UploadButton'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { useUploadDocument } from '../../hooks/document/use-documents'
import { useProjects } from '../../hooks/project/use-projects'

/**
 * Upload-documents popup: pick one of the active projects first, then choose
 * files. The upload links each document to the chosen project
 * (link_entity_type=PROJECT) via the backend document operations.
 */
export function UploadDocumentsModal({
  open,
  onClose,
  onUploaded,
}: {
  open: boolean
  onClose: () => void
  onUploaded: () => void
}) {
  const { data: projectsData, isLoading: projectsLoading } = useProjects({ pageSize: 200 })
  const [projectId, setProjectId] = useState('')
  const [done, setDone] = useState<string[]>([])

  const activeProjects = useMemo(
    () =>
      (projectsData?.items ?? []).filter((p) => p.status !== 'COMPLETED' && p.status !== 'CANCELLED'),
    [projectsData],
  )

  const uploadMutation = useUploadDocument(
    projectId
      ? { referenceType: 'PROJECT', referenceId: Number(projectId) }
      : undefined,
  )

  if (!open) return null

  const chosen = activeProjects.find((p) => String(p.id) === projectId)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal
        className="relative z-10 w-full max-w-md bv-surface executive-shadow border border-outline-variant p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-title-lg font-semibold">Upload documents</h2>
            <p className="text-body-sm text-on-surface-variant">
              Select a project, then choose files to link to it.
            </p>
          </div>
          <button
            type="button"
            className="p-2 rounded-full hover:bg-surface-container"
            onClick={onClose}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <Select
          label="Project *"
          value={projectId}
          onChange={(v) => {
            setProjectId(v)
            setDone([])
          }}
          placeholder={projectsLoading ? 'Loading projects…' : 'Select project…'}
          options={activeProjects.map((p) => ({
            value: String(p.id),
            label: `${p.name} (#${p.id})`,
          }))}
          minWidthClass="w-full"
        />

        <UploadButton
          label={uploadMutation.isPending ? 'Uploading…' : 'Choose files'}
          disabled={!projectId || uploadMutation.isPending}
          isLoading={uploadMutation.isPending}
          onFiles={(files) => {
            const list = Array.from(files)
            void uploadMutation
              .mutateAsync(list)
              .then((results) => {
                setDone(results.map((r) => r.name))
                onUploaded()
              })
              .catch(() => {})
          }}
        />
        {!projectId && (
          <p className="text-body-sm text-on-surface-variant">
            Pick a project above to enable file selection.
          </p>
        )}
        {uploadMutation.isError && (
          <p className="text-body-sm text-error" role="alert">
            {getApiErrorMessage(uploadMutation.error, 'Failed to upload documents.')}
          </p>
        )}
        {done.length > 0 && chosen && (
          <p className="text-body-sm text-secondary" role="status">
            Uploaded {done.length} file{done.length === 1 ? '' : 's'} to {chosen.name}.
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            {done.length > 0 ? 'Done' : 'Cancel'}
          </Button>
        </div>
      </div>
    </div>
  )
}
