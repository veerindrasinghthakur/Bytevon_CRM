import { useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Modal } from '@/shared/components/ui/Modal'
import { Button } from '@/shared/components/ui/Button'
import { DeleteButton } from '@/shared/components/ui/DeleteButton'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { queryKeys } from '@/shared/lib/query-keys'
import { getSource } from '../../api/source'
import { useSources, useSourceLeads } from '../../hooks/source/use-sources'
import { SourceFormModal } from '../../components/source/SourceFormModal'
import { salesRoutes } from '../../routes'
import { Can } from '@/shared/rbac'
import { Action } from '@/shared/schema'

function formatDateTime(value?: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/** Source detail as a compact modal popup: info + latest 8 leads + actions. */
export function SourceDetailPage() {
  const navigate = useNavigate()
  const params = useParams({ strict: false }) as { sourceId?: string }
  const sourceId = Number(params.sourceId)
  const close = () => safeNavigate(navigate, { to: salesRoutes.sources })

  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [confirmKind, setConfirmKind] = useState<'save' | 'cancel' | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const { updateSource, deleteSource, restoreSource, isMutating } = useSources()

  const detailQuery = useQuery({
    queryKey: [...queryKeys.sales.platforms(), 'detail', sourceId],
    queryFn: () => getSource(sourceId, { includeArchived: true }),
    enabled: Number.isFinite(sourceId),
  })
  const leadsQuery = useSourceLeads(Number.isFinite(sourceId) ? sourceId : undefined, 8)
  const source = detailQuery.data
  const leads = leadsQuery.data ?? []

  const openEdit = () => {
    if (!source) return
    setName(source.name)
    setDescription(source.description ?? '')
    setFormError(null)
    setConfirmKind(null)
    setEditing(true)
  }

  const confirmSave = async () => {
    if (!name.trim()) {
      setFormError('Name is required')
      return
    }
    try {
      await updateSource({
        id: sourceId,
        input: { name: name.trim(), description: description.trim() || null },
      })
      setEditing(false)
      setConfirmKind(null)
      void detailQuery.refetch()
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Could not save source'))
    }
  }

  if (!Number.isFinite(sourceId)) {
    return (
      <Modal title="Source not found" onClose={close}>
        <p className="text-body-sm text-on-surface-variant">Invalid source id.</p>
      </Modal>
    )
  }

  return (
    <Modal title={detailQuery.data ? detailQuery.data.name : 'Source'} wide onClose={close}>
      {detailQuery.isLoading ? (
        <PageLoadingSkeleton />
      ) : detailQuery.isError || !source ? (
        <ErrorState
          title="Source not found"
          description={getApiErrorMessage(detailQuery.error, 'This source could not be loaded.')}
          onRetry={() => void detailQuery.refetch()}
        />
      ) : (
        <div className="space-y-5">
          {actionError && (
            <p className="text-body-sm text-error" role="alert">
              {actionError}
            </p>
          )}

          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Status</dt>
              <dd className="font-semibold mt-0.5">{source.status}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Leads</dt>
              <dd className="font-semibold mt-0.5">{source.leadCount}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Source ID</dt>
              <dd className="font-semibold mt-0.5">#{source.id}</dd>
            </div>
            <div className="col-span-2 sm:col-span-3">
              <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Description</dt>
              <dd className="mt-0.5">{source.description || '—'}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Created</dt>
              <dd className="mt-0.5 text-body-sm">{formatDateTime(source.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Created by</dt>
              <dd className="mt-0.5 text-body-sm">{source.createdByName ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase text-on-surface-variant">Updated</dt>
              <dd className="mt-0.5 text-body-sm">{formatDateTime(source.updatedAt)}</dd>
            </div>
          </dl>

          <div>
            <h4 className="text-label-md font-bold uppercase text-on-surface-variant mb-2">
              Latest leads
            </h4>
            {leadsQuery.isLoading ? (
              <p className="text-body-sm text-on-surface-variant">Loading leads…</p>
            ) : leads.length === 0 ? (
              <p className="text-body-sm text-on-surface-variant">No leads use this source yet.</p>
            ) : (
              <ul className="divide-y divide-outline-variant/40 border-y border-outline-variant/40">
                {leads.map((l) => (
                  <li key={l.id} className="py-2 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-body-sm truncate">{l.title}</p>
                      <p className="text-caption text-on-surface-variant">
                        {l.contactName ?? '—'}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold uppercase text-on-surface-variant shrink-0">
                      {l.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex justify-end gap-2">
            {!source.isArchived ? (
              <>
                <Can action={Action.UPDATE} resource="lead">
                  <Button variant="outline" size="sm" onClick={openEdit}>
                    Edit
                  </Button>
                </Can>
                <Can action={Action.DELETE} resource="lead">
                  <DeleteButton
                    entityLabel={source.name}
                    isLoading={isMutating}
                    onConfirm={async () => {
                      try {
                        await deleteSource(source.id)
                        close()
                      } catch (err) {
                        setActionError(getApiErrorMessage(err, 'Could not delete source'))
                        throw err
                      }
                    }}
                  />
                </Can>
              </>
            ) : (
              <Can action={Action.UPDATE} resource="lead">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    restoreSource(source.id)
                      .then(() => {
                        setActionError(null)
                        void detailQuery.refetch()
                      })
                      .catch((err: unknown) =>
                        setActionError(getApiErrorMessage(err, 'Could not restore source')),
                      )
                  }
                >
                  Restore
                </Button>
              </Can>
            )}
          </div>
        </div>
      )}

      {editing && (
        <Modal title="Edit source" onClose={() => setEditing(false)}>
          <SourceFormModal
            mode="edit"
            name={name}
            description={description}
            formError={formError}
            confirmKind={confirmKind}
            busy={isMutating}
            onNameChange={setName}
            onDescriptionChange={setDescription}
            onRequestSave={() => {
              if (!name.trim()) {
                setFormError('Name is required')
                return
              }
              setFormError(null)
              setConfirmKind('save')
            }}
            onRequestCancel={() => setConfirmKind('cancel')}
            onBackFromConfirm={() => setConfirmKind(null)}
            onConfirmSave={() => void confirmSave()}
            onConfirmDiscard={() => {
              setEditing(false)
              setConfirmKind(null)
            }}
          />
        </Modal>
      )}
    </Modal>
  )
}
