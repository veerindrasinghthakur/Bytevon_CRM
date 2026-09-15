import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { ListToolbar } from '@/shared/components/layout/ListToolbar'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { queryKeys } from '@/shared/lib/query-keys'
import {
  listSources,
  createSource,
  updateSource,
  archiveSource,
  type LeadSource,
  type SourceMetric,
} from '../../api/source'
import { salesRoutes } from '../../routes'
import { SourceMetricsCards } from '../../components/source/SourceMetricsCards'
import { SourcesTable } from '../../components/source/SourcesTable'
import { SourceFormModal } from '../../components/source/SourceFormModal'
import { SourceArchiveDialog } from '../../components/source/SourceArchiveDialog'

type ModalMode = 'create' | 'edit' | null
type ConfirmKind = 'save' | 'cancel' | 'archive' | null

export function SourcesListPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [includeArchived, setIncludeArchived] = useState(false)

  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [editing, setEditing] = useState<LeadSource | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const [confirmKind, setConfirmKind] = useState<ConfirmKind>(null)
  const [archiveTarget, setArchiveTarget] = useState<LeadSource | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const query = useQuery({
    queryKey: [...queryKeys.sales.platforms(), { includeArchived }],
    queryFn: () => listSources({ includeArchived }),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })

  const items = query.data?.items ?? []
  const metrics: SourceMetric[] = query.data?.metrics ?? []

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.description ?? '').toLowerCase().includes(q),
    )
  }, [items, search])

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: queryKeys.sales.platforms() })
  }

  const createMut = useMutation({
    mutationFn: () => createSource({ name: name.trim(), description: description.trim() || null }),
    onSuccess: () => {
      invalidate()
      closeModal()
    },
    onError: (err) => setFormError(getApiErrorMessage(err, 'Could not create source')),
  })

  const updateMut = useMutation({
    mutationFn: () =>
      updateSource(editing!.id, {
        name: name.trim(),
        description: description.trim() || null,
      }),
    onSuccess: () => {
      invalidate()
      closeModal()
    },
    onError: (err) => setFormError(getApiErrorMessage(err, 'Could not update source')),
  })

  const archiveMut = useMutation({
    mutationFn: (id: number) => archiveSource(id),
    onSuccess: () => {
      invalidate()
      setConfirmKind(null)
      setArchiveTarget(null)
    },
    onError: (err) => setActionError(getApiErrorMessage(err, 'Could not archive source')),
  })

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

  const requestArchive = (row: LeadSource) => {
    setArchiveTarget(row)
    setActionError(null)
    setConfirmKind('archive')
  }

  const busy = createMut.isPending || updateMut.isPending || archiveMut.isPending

  return (
    <div className="space-y-6 animate-fade-in relative">
      <PageHeader
        title="Manage sources"
        description="Lead sources (platforms) used on leads. Create, update, or archive sources for the pipeline."
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
        onRefresh={() => void query.refetch()}
      >
        <label className="inline-flex items-center gap-2 text-body-sm text-on-surface-variant cursor-pointer select-none">
          <input
            type="checkbox"
            className="rounded border-outline-variant text-secondary"
            checked={includeArchived}
            onChange={(e) => setIncludeArchived(e.target.checked)}
          />
          Include archived
        </label>
      </ListToolbar>

      {actionError && confirmKind !== 'archive' && (
        <p className="text-body-sm text-error" role="alert">
          {actionError}
        </p>
      )}

      {query.isError && (
        <ErrorState
          title="Failed to load sources"
          description={getApiErrorMessage(query.error, 'Could not load lead sources.')}
          onRetry={() => void query.refetch()}
        />
      )}

      {!query.isError && (
        <SourcesTable
          rows={filtered}
          isLoading={query.isLoading}
          isFetching={query.isFetching}
          onEdit={openEdit}
          onArchive={requestArchive}
        />
      )}

      {modalMode && (
        <SourceFormModal
          mode={modalMode}
          name={name}
          description={description}
          formError={formError}
          confirmKind={confirmKind === 'save' || confirmKind === 'cancel' ? confirmKind : null}
          busy={busy}
          onNameChange={setName}
          onDescriptionChange={setDescription}
          onRequestSave={requestSave}
          onRequestCancel={requestCancel}
          onBackFromConfirm={() => setConfirmKind(null)}
          onConfirmSave={() => {
            if (modalMode === 'create') createMut.mutate()
            else updateMut.mutate()
          }}
          onConfirmDiscard={closeModal}
        />
      )}

      {confirmKind === 'archive' && archiveTarget && (
        <SourceArchiveDialog
          target={archiveTarget}
          busy={busy}
          actionError={actionError}
          onCancel={() => {
            setConfirmKind(null)
            setArchiveTarget(null)
          }}
          onConfirm={() => archiveMut.mutate(archiveTarget.id)}
        />
      )}

      <span className="sr-only">{salesRoutes.sources}</span>
    </div>
  )
}
