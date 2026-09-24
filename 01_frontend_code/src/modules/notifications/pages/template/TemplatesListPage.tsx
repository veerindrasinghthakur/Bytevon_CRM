import { useMemo, useState } from 'react'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { MetricCard } from '@/shared/components/ui/MetricCard'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { ListToolbar } from '@/shared/components/layout/ListToolbar'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { useTemplates } from '../../hooks/template/use-templates'
import type { NotificationTemplate } from '../../api/template'

type ModalMode = 'create' | 'edit' | null

export function TemplatesListPage() {
  const [search, setSearch] = useState('')
  const [activeOnly, setActiveOnly] = useState(false)
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [editing, setEditing] = useState<NotificationTemplate | null>(null)
  const [code, setCode] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const {
    items,
    total,
    active,
    inactive,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    createTemplate,
    updateTemplate,
    toggleActive,
    isMutating,
  } = useTemplates({ activeOnly })

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (t) =>
        t.code.toLowerCase().includes(q) ||
        t.title_template.toLowerCase().includes(q),
    )
  }, [items, search])

  const openCreate = () => {
    setEditing(null)
    setCode('')
    setTitle('')
    setBody('')
    setFormError(null)
    setModalMode('create')
  }
  const openEdit = (row: NotificationTemplate) => {
    setEditing(row)
    setCode(row.code)
    setTitle(row.title_template)
    setBody(row.body_template)
    setFormError(null)
    setModalMode('edit')
  }
  const closeModal = () => {
    setModalMode(null)
    setEditing(null)
    setFormError(null)
  }

  const save = async () => {
    if (!code.trim() || !title.trim() || !body.trim()) {
      setFormError('Code, title and body are required')
      return
    }
    try {
      if (modalMode === 'create') {
        await createTemplate({ code: code.trim(), title_template: title, body_template: body })
      } else if (editing) {
        await updateTemplate({ id: editing.id, input: { title_template: title, body_template: body } })
      }
      closeModal()
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Could not save template'))
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Notification templates"
        description="Reusable title/body templates for notifications. Toggle active state per template."
        actions={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<span className="material-symbols-outlined text-[18px]">add</span>}
            onClick={openCreate}
          >
            Add template
          </Button>
        }
      />

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard label="Total templates" value={String(total)} icon="description" />
        <MetricCard label="Active" value={String(active)} icon="check_circle" valueClassName="text-secondary" />
        <MetricCard label="Inactive" value={String(inactive)} icon="block" />
      </section>

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search templates…"
        filtersActive={activeOnly}
        onResetFilters={() => {
          setSearch('')
          setActiveOnly(false)
        }}
        onRefresh={() => void refetch()}
      >
        <label className="inline-flex items-center gap-2 text-body-sm text-on-surface-variant cursor-pointer select-none">
          <input
            type="checkbox"
            className="rounded border-outline-variant text-secondary"
            checked={activeOnly}
            onChange={(e) => setActiveOnly(e.target.checked)}
          />
          Active only
        </label>
      </ListToolbar>

      {isError && (
        <ErrorState
          title="Failed to load templates"
          description={getApiErrorMessage(error, 'Could not load templates.')}
          onRetry={() => void refetch()}
        />
      )}

      {!isError && (
        <div className="bv-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low/50">
                  <th className="px-4 py-3 text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">Code</th>
                  <th className="px-4 py-3 text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">Title template</th>
                  <th className="px-4 py-3 text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider text-center">Active</th>
                  {/* Actions column hidden — restore the block below when row actions return.
                  <th className="px-4 py-3 text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider text-right">Actions</th>
                  */}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {filtered.map((t) => (
                  <tr key={t.id} className="zebra-row">
                    <td className="px-4 py-4 font-mono font-semibold text-on-surface">{t.code}</td>
                    <td className="px-4 py-4 text-body-sm text-on-surface max-w-md truncate">{t.title_template}</td>
                    <td className="px-4 py-4 text-center">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={t.is_active}
                        aria-label={`Toggle ${t.code}`}
                        disabled={isMutating}
                        onClick={() => void toggleActive({ id: t.id, is_active: !t.is_active })}
                        className="relative inline-flex h-6 w-11 items-center rounded-full bg-surface-container-high transition-colors data-[on=true]:bg-secondary"
                        data-on={t.is_active}
                      >
                        <span
                          className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${t.is_active ? 'translate-x-6' : 'translate-x-1'}`}
                        />
                      </button>
                    </td>
                    {/* Edit entry point hidden with the Actions column (modal editor kept).
                        Restore with the Actions <th> above when row actions return.
                    <td className="px-4 py-4 text-right">
                      <Button variant="outline" size="sm" onClick={() => openEdit(t)}>
                        Edit
                      </Button>
                    </td>
                    */}
                  </tr>
                ))}
                {filtered.length === 0 && !isLoading && !isFetching && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-body-sm text-on-surface-variant">
                      No templates found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" aria-label="Close" onClick={closeModal} />
          <div className="relative bv-surface executive-shadow w-full max-w-lg p-6 space-y-4 z-10 rounded-xl">
            <h3 className="text-title-lg font-semibold">{modalMode === 'create' ? 'Add template' : 'Edit template'}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-label-md mb-1">Code</label>
                <input
                  value={code}
                  disabled={modalMode === 'edit'}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-2 text-body-sm font-mono outline-none focus:border-secondary"
                  placeholder="WELCOME"
                />
              </div>
              <div>
                <label className="block text-label-md mb-1">Title template</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-2 text-body-sm outline-none focus:border-secondary"
                  placeholder="Welcome {{name}}"
                />
              </div>
              <div>
                <label className="block text-label-md mb-1">Body template</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={4}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-2 text-body-sm outline-none focus:border-secondary resize-none"
                  placeholder="Hello {{name}}…"
                />
              </div>
              {formError && (
                <p className="text-body-sm text-error" role="alert">{formError}</p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={closeModal}>Cancel</Button>
              <Button variant="primary" isLoading={isMutating} onClick={() => void save()}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
