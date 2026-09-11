import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { TableSkeleton } from '@/shared/components/feedback/Skeleton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { ListToolbar } from '@/shared/components/layout/ListToolbar'
import { RowActions } from '@/shared/components/ui/RowActions'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { queryKeys } from '@/shared/lib/query-keys'
import { cn } from '@/shared/lib/cn'
import {
  listSources,
  createSource,
  updateSource,
  archiveSource,
  type LeadSource,
  type SourceMetric,
} from '../api/sales'
import { salesRoutes } from '../routes'

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(metrics.length
          ? metrics
          : [
              { id: 'total', label: 'Total sources', value: '—', icon: 'hub' },
              { id: 'top', label: 'Source with highest leads', value: '—', icon: 'emoji_events' },
            ]
        ).map((m) => (
          <div key={m.id} className="bv-surface card-hover p-5">
            <div className="flex justify-between items-start mb-2">
              <span className="p-2 rounded-lg bg-secondary/10 text-secondary">
                <span className="material-symbols-outlined text-xl">{m.icon ?? 'hub'}</span>
              </span>
            </div>
            <p className="text-label-md text-on-surface-variant">{m.label}</p>
            <h3 className="text-headline-md font-bold mt-0.5 text-on-background break-words">
              {m.value}
            </h3>
          </div>
        ))}
      </div>

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

      {actionError && (
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
        <div className="bv-surface overflow-hidden relative">
          {(query.isLoading || query.isFetching) && (
            <div className="absolute inset-0 z-10 bg-surface-container-lowest/70 backdrop-blur-[1px]">
              <TableSkeleton rows={5} />
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low/50">
                  <th className="px-4 py-3 text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-4 py-3 text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">
                    Leads
                  </th>
                  <th className="px-4 py-3 text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider text-center">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {filtered.map((row) => (
                  <tr key={row.id} className="zebra-row group">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-on-surface">{row.name}</p>
                      <p className="text-xs text-on-surface-variant font-mono">#{row.id}</p>
                    </td>
                    <td className="px-4 py-4 text-body-sm text-on-surface-variant max-w-md">
                      {row.description || '—'}
                    </td>
                    <td className="px-4 py-4 font-semibold text-on-surface">{row.leadCount}</td>
                    <td className="px-4 py-4">
                      <span
                        className={cn(
                          'px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase',
                          row.isArchived
                            ? 'status-badge status-neutral'
                            : 'status-badge status-success',
                        )}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex justify-center">
                        <RowActions
                          label={`Actions for ${row.name}`}
                          actions={[
                            {
                              id: 'edit',
                              label: 'Edit',
                              icon: 'edit',
                              onClick: () => openEdit(row),
                              disabled: row.isArchived,
                            },
                            {
                              id: 'archive',
                              label: 'Archive',
                              icon: 'inventory_2',
                              onClick: () => requestArchive(row),
                              disabled: row.isArchived,
                            },
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && !query.isLoading && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-body-sm text-on-surface-variant">
                      No sources found. Click “Add source” to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div
            className="w-full max-w-md bv-surface p-6 shadow-xl space-y-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="source-modal-title"
          >
            <h2 id="source-modal-title" className="text-title-md font-semibold text-on-background">
              {modalMode === 'create' ? 'Add source' : 'Edit source'}
            </h2>
            <p className="text-body-sm text-on-surface-variant">
              Sources map to the platforms table and appear in the lead Source picker.
            </p>

            {confirmKind === 'save' || confirmKind === 'cancel' ? (
              <div className="space-y-4">
                <p className="text-body-md text-on-surface">
                  {confirmKind === 'save'
                    ? modalMode === 'create'
                      ? `Create source “${name.trim()}”?`
                      : `Save changes to “${name.trim()}”?`
                    : 'Discard changes and close?'}
                </p>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => setConfirmKind(null)}
                  >
                    Back
                  </Button>
                  {confirmKind === 'cancel' ? (
                    <Button variant="primary" size="sm" onClick={closeModal}>
                      Discard
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={busy}
                      onClick={() => {
                        if (modalMode === 'create') createMut.mutate()
                        else updateMut.mutate()
                      }}
                    >
                      {busy ? 'Saving…' : 'Confirm'}
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <label className="block">
                    <span className="text-[10px] font-bold uppercase text-on-surface-variant">Name</span>
                    <input
                      className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={150}
                      placeholder="e.g. Website, LinkedIn"
                      autoFocus
                    />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-bold uppercase text-on-surface-variant">
                      Description
                    </span>
                    <textarea
                      className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40 min-h-[80px]"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Optional notes"
                    />
                  </label>
                  {formError && (
                    <p className="text-body-sm text-error" role="alert">
                      {formError}
                    </p>
                  )}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={requestCancel} disabled={busy}>
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" onClick={requestSave} disabled={busy}>
                    Save
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Archive confirm */}
      {confirmKind === 'archive' && archiveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-sm bv-surface p-6 shadow-xl space-y-4" role="dialog" aria-modal="true">
            <h2 className="text-title-md font-semibold">Archive source?</h2>
            <p className="text-body-sm text-on-surface-variant">
              “{archiveTarget.name}” will be hidden from new lead pickers. Existing leads keep their link.
            </p>
            {actionError && (
              <p className="text-body-sm text-error" role="alert">
                {actionError}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => {
                  setConfirmKind(null)
                  setArchiveTarget(null)
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={busy}
                onClick={() => archiveMut.mutate(archiveTarget.id)}
              >
                {busy ? 'Archiving…' : 'Confirm archive'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* keep route helper referenced for consistency */}
      <span className="sr-only">{salesRoutes.sources}</span>
    </div>
  )
}
