import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { ListToolbar } from '@/shared/components/layout/ListToolbar'
import { DeleteButton } from '@/shared/components/ui/DeleteButton'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { useSources, type LeadSource } from '../../hooks/source/use-sources'
import { salesRoutes } from '../../routes'
import { SourceMetricsCards } from '../../components/source/SourceMetricsCards'
import { SourcesTable } from '../../components/source/SourcesTable'
import { SourceFormModal } from '../../components/source/SourceFormModal'

type ModalMode = 'create' | 'edit' | null
type ConfirmKind = 'save' | 'cancel' | null

export function SourcesListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  // Deleted sources stay visible in real time; uncheck to hide them.
  const [includeArchived, setIncludeArchived] = useState(true)

  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [editing, setEditing] = useState<LeadSource | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const [confirmKind, setConfirmKind] = useState<ConfirmKind>(null)
  const [deleteTarget, setDeleteTarget] = useState<LeadSource | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const {
    items,
    metrics,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    createSource,
    updateSource,
    deleteSource,
    restoreSource,
    isMutating,
  } = useSources({ includeArchived })

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.description ?? '').toLowerCase().includes(q),
    )
  }, [items, search])

  const openCreate = () => {
    setEditing(null)
    setName('')
    setDescription('')
    setFormError(null)
    setConfirmKind(null)
    setModalMode('create')
  }

  const openEdit = (row: LeadSource) => {
    setEditing(row)
    setName(row.name)
    setDescription(row.description ?? '')
    setFormError(null)
    setConfirmKind(null)
    setModalMode('edit')
  }

  const closeModal = () => {
    setModalMode(null)
    setEditing(null)
    setConfirmKind(null)
    setFormError(null)
    setName('')
    setDescription('')
  }

  const requestSave = () => {
    if (!name.trim()) {
      setFormError('Name is required')
      return
    }
    setFormError(null)
    setConfirmKind('save')
  }

  const requestCancel = () => {
    setConfirmKind('cancel')
  }

  const confirmSave = async () => {
    try {
      if (modalMode === 'create') {
        await createSource({ name: name.trim(), description: description.trim() || null })
      } else if (editing) {
        await updateSource({
          id: editing.id,
          input: { name: name.trim(), description: description.trim() || null },
        })
      }
      closeModal()
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Could not save source'))
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteSource(deleteTarget.id)
      setDeleteTarget(null)
      setActionError(null)
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Could not delete source'))
    }
  }

  const handleRestore = async (row: LeadSource) => {
    try {
      await restoreSource(row.id)
      setActionError(null)
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Could not restore source'))
    }
  }

  const busy = isMutating

  return (
    <div className="space-y-6 animate-fade-in relative">
      <PageHeader
        title="Manage sources"
        description="Lead sources used on leads. Create, update, or delete sources for the pipeline."
        actions={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<span className="material-symbols-outlined text-[18px]">add</span>}
            onClick={openCreate}
          >
            Add source
          </Button>
        }
      />

      <SourceMetricsCards metrics={metrics} />

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search sources…"
        filtersActive={includeArchived}
        onResetFilters={() => {
          setSearch('')
          setIncludeArchived(false)
        }}
        onRefresh={() => void refetch()}
      >
        <label className="inline-flex items-center gap-2 text-body-sm text-on-surface-variant cursor-pointer select-none">
          <input
            type="checkbox"
            className="rounded border-outline-variant text-secondary"
            checked={includeArchived}
            onChange={(e) => setIncludeArchived(e.target.checked)}
          />
          Include deleted
        </label>
      </ListToolbar>

      {actionError && (
        <p className="text-body-sm text-error" role="alert">
          {actionError}
        </p>
      )}

      {isError && (
        <ErrorState
          title="Failed to load sources"
          description={getApiErrorMessage(error, 'Could not load lead sources.')}
          onRetry={() => void refetch()}
        />
      )}

      {!isError && (
        <SourcesTable
          rows={filtered}
          isLoading={isLoading}
          isFetching={isFetching}
          onOpen={(row) =>
            safeNavigate(navigate, {
              to: salesRoutes.sourceDetailPath,
              params: { sourceId: String(row.id) },
            })
          }
          onEdit={openEdit}
          onDelete={(row) => {
            setDeleteTarget(row)
            setActionError(null)
          }}
          onRestore={(row) => void handleRestore(row)}
        />
      )}

      {modalMode && (
        <Modal
          title={modalMode === 'create' ? 'Add source' : 'Edit source'}
          onClose={closeModal}
        >
          <SourceFormModal
            mode={modalMode}
            name={name}
            description={description}
            formError={formError}
            confirmKind={confirmKind}
            busy={busy}
            onNameChange={setName}
            onDescriptionChange={setDescription}
            onRequestSave={requestSave}
            onRequestCancel={requestCancel}
            onBackFromConfirm={() => setConfirmKind(null)}
            onConfirmSave={() => void confirmSave()}
            onConfirmDiscard={closeModal}
          />
        </Modal>
      )}

      {deleteTarget && (
        <Modal title={`Delete “${deleteTarget.name}”?`} danger onClose={() => setDeleteTarget(null)}>
          <p className="text-body-sm text-on-surface-variant">
            This source will be hidden from new lead pickers. Existing leads keep their link.
          </p>
          {actionError && (
            <p className="text-body-sm text-error mt-2" role="alert">
              {actionError}
            </p>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <DeleteButton
              entityLabel={deleteTarget.name}
              isLoading={busy}
              onConfirm={() => void confirmDelete()}
            />
          </div>
        </Modal>
      )}

      <span className="sr-only">{salesRoutes.sources}</span>
    </div>
  )
}
