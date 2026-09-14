import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/shared/components/ui/Button'
import { Select } from '@/shared/components/ui/Select'
import { MetricCard } from '@/shared/components/ui/MetricCard'
import { ExportButton } from '@/shared/components/export/ExportButton'
import { ResourceName } from '@/shared/schema'
import { Pagination, DEFAULT_PAGE_SIZE } from '@/shared/components/ui/Pagination'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { TableSkeleton } from '@/shared/components/feedback/Skeleton'
import { RowActions } from '@/shared/components/ui/RowActions'
import { ListToolbar } from '@/shared/components/layout/ListToolbar'
import { BulkSelectionBar } from '@/shared/components/layout/BulkSelectionBar'
import { useQuickOverview } from '@/shared/components/layout/QuickOverview'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { useProjectsList } from '../hooks/use-projects-list'
import { projectRoutes } from '../routes'
import type { ProjectStatus } from '../schemas/project'
import { cn } from '@/shared/lib/cn'
import { projectStatusColors } from '../cssTokens'
import { ProjectStatusOptions } from '../enums'
import { ProjectQuickContent } from '../components/ProjectQuickContent'

function statusTrackLabel(status: ProjectStatus) {
  const style = projectStatusColors[status]
  return { dot: style.dot, text: style.text, label: style.label }
}

export function ProjectsListPage() {
  const navigate = useNavigate()
  const { openPanel } = useQuickOverview()
  const {
    search,
    setSearch,
    status,
    setStatus,
    page,
    setPage,
    filtersActive,
    resetFilters,
    items,
    pageItems,
    total,
    active,
    atRisk,
    isLoading,
    isFetching,
    isError,
    refetch,
    selection,
  } = useProjectsList()

  const goDetail = (id: number, edit?: boolean) => {
    safeNavigate(navigate, {
      to: projectRoutes.projectDetailPath,
      params: { projectId: String(id) },
      search: edit ? { edit: '1' } : undefined,
    })
  }

  const goNew = () => safeNavigate(navigate, { to: projectRoutes.projectNew })

  const openProjectOverview = (project: (typeof pageItems)[number]) => {
    const track = statusTrackLabel(project.status)
    openPanel({
      title: project.name,
      subtitle: project.code ? `ID: ${project.code}` : undefined,
      icon: 'folder_open',
      status: track.label,
      statusDotClass: track.dot,
      content: (
        <ProjectQuickContent
          clientName={project.clientName}
          progress={project.progress}
          taskCount={project.taskCount}
          teamCount={project.teamCount}
          startDate={project.startDate}
          endDate={project.endDate}
        />
      ),
      fullRecordLabel: 'Open Workspace',
      onOpenFull: () => goDetail(project.id),
      onEdit: () => goDetail(project.id, true),
      widthClass: 'max-w-[520px]',
    })
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-[32px] leading-10 font-bold tracking-tight text-on-background">
            Project Management
          </h2>
          <p className="text-body-md text-on-surface-variant mt-1">
            Manage projects, assign teams, track milestones and monitor progress.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="outline" size="sm" leftIcon={<span className="material-symbols-outlined text-[18px]">upload</span>}>
            Import
          </Button>
          <ExportButton
            resource={ResourceName.PROJECT}
            query={search}
            filters={{ status }}
            selectedIds={
              selection.selectionMode ? Array.from(selection.selectedIds ?? []) : undefined
            }
            filenameStem="projects"
          />
          <Button
            type="button"
            variant="primary"
            size="sm"
            leftIcon={<span className="material-symbols-outlined text-[18px]">add</span>}
            onClick={goNew}
          >
            New Project
          </Button>
        </div>
      </section>

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by Project Name, Client..."
        filtersActive={filtersActive}
        onResetFilters={resetFilters}
        onRefresh={() => void refetch()}
      >
        <Select
          value={status}
          onChange={setStatus}
          placeholder="Project Status"
          aria-label="Filter by project status"
          options={[{ value: '', label: 'All statuses' }, ...ProjectStatusOptions]}
        />
      </ListToolbar>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard label="Total Projects" value={String(total || '—')} icon="folder_open" hint="All" />
        <MetricCard label="Active Projects" value={String(active)} icon="trending_up" valueClassName="text-secondary" />
        <MetricCard
          label="At Risk / Delayed"
          value={String(atRisk)}
          icon="warning"
          valueClassName={atRisk > 0 ? 'text-error' : undefined}
          hint={atRisk > 0 ? 'Review' : undefined}
        />
        <MetricCard
          label="Completion rate"
          value={total > 0 ? `${Math.round(((total - atRisk - active) / total) * 100)}%` : '—'}
          icon="percent"
          hint="Filtered set"
        />
      </section>

      {selection.selectionMode && (
        <BulkSelectionBar
          selectedCount={selection.selectedCount}
          filteredCount={pageItems.length}
          onCancel={selection.exitSelectionMode}
        >
          <ExportButton
            resource={ResourceName.PROJECT}
            selectedIds={Array.from(selection.selectedIds ?? [])}
            filenameStem="projects-selected"
            label="Export selected"
          />
          <Button variant="primary" size="sm">Archive</Button>
        </BulkSelectionBar>
      )}

      {isError && (
        <ErrorState
          title="Failed to load projects"
          description="We could not load the projects list. Check your connection and try again."
          onRetry={() => void refetch()}
        />
      )}

      {!isError && items.length === 0 && !isLoading && (
        <EmptyState
          icon="folder_off"
          title="No projects yet"
          description="Create your first project or clear filters."
          actionLabel="New Project"
          onAction={goNew}
        />
      )}

      {!isError && (items.length > 0 || isLoading) && (
        <section className="bv-surface overflow-hidden flex flex-col relative">
          {(isLoading || isFetching) && (
            <div className="absolute inset-0 z-10 bg-surface-container-lowest/70 backdrop-blur-[1px]">
              <TableSkeleton rows={5} />
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="border-b border-outline-variant/30 bg-surface/50">
                  <th className="py-4 px-6 w-12">
                    {selection.selectionMode ? (
                      <input
                        type="checkbox"
                        className="rounded border-outline-variant w-4 h-4"
                        checked={selection.allFilteredSelected}
                        onChange={selection.toggleSelectAllFiltered}
                        aria-label="Select all filtered rows on this page"
                      />
                    ) : (
                      <span className="sr-only">Select</span>
                    )}
                  </th>
                  <th className="py-4 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Proj ID</th>
                  <th className="py-4 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Project Name</th>
                  <th className="py-4 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Client</th>
                  <th className="py-4 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Priority & Status</th>
                  <th className="py-4 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Progress</th>
                  <th className="py-4 px-6 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {pageItems.map((project) => {
                  const track = statusTrackLabel(project.status)
                  const id = String(project.id)
                  const isSelected = selection.isSelected(id)
                  const initials = project.name
                    .split(' ')
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join('')
                    .toUpperCase()

                  return (
                    <tr
                      key={project.id}
                      className={cn(
                        'h-[72px] cursor-pointer select-none',
                        isSelected ? 'bg-secondary/10' : 'zebra-row',
                      )}
                      onMouseDown={() => selection.onRowPressStart(id)}
                      onMouseUp={() => selection.onRowPressEnd(id, () => openProjectOverview(project))}
                      onMouseLeave={selection.onRowPressCancel}
                      onTouchStart={() => selection.onRowPressStart(id)}
                      onTouchEnd={() => selection.onRowPressEnd(id, () => openProjectOverview(project))}
                      onTouchCancel={selection.onRowPressCancel}
                      onContextMenu={(e) => e.preventDefault()}
                    >
                      <td
                        className="py-2 px-6"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (selection.selectionMode) selection.toggleOne(id)
                        }}
                      >
                        {selection.selectionMode ? (
                          <input
                            type="checkbox"
                            className="rounded border-outline-variant w-4 h-4"
                            checked={isSelected}
                            onChange={() => selection.toggleOne(id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span className={cn('inline-block w-2.5 h-2.5 rounded-full', track.dot)} title={track.label} />
                        )}
                      </td>
                      <td className="py-2 px-4 text-[11px] text-on-surface-variant">#{project.code}</td>
                      <td className="py-2 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-secondary/15 text-secondary flex items-center justify-center text-xs font-bold">
                            {initials}
                          </div>
                          <div>
                            <p className="text-body-md font-semibold text-on-background">{project.name}</p>
                            <p className="text-[11px] text-on-surface-variant">{project.taskCount ?? 0} tasks</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        <p className="text-body-md font-semibold text-on-background">{project.clientName ?? '—'}</p>
                      </td>
                      <td className="py-2 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="status-badge status-neutral text-[10px]">{project.status.replace('_', ' ')}</span>
                          <div className="flex items-center gap-1.5">
                            <span className={cn('w-1.5 h-1.5 rounded-full', track.dot)} />
                            <span className={cn('text-[11px] font-medium', track.text)}>{track.label}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 rounded-full bg-surface-container-high overflow-hidden">
                            <div
                              className="h-full rounded-full bg-secondary"
                              style={{ width: `${project.progress ?? 0}%` }}
                            />
                          </div>
                          <span className="text-body-sm text-on-surface-variant">{project.progress ?? 0}%</span>
                        </div>
                      </td>
                      <td
                        className="py-2 px-6 text-right"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex justify-end">
                          <RowActions
                            label={`Actions for ${project.name}`}
                            actions={[
                              {
                                id: 'overview',
                                label: 'Quick view',
                                icon: 'visibility',
                                onClick: () => openProjectOverview(project),
                              },
                              {
                                id: 'details',
                                label: 'View details',
                                icon: 'description',
                                onClick: () => goDetail(project.id),
                              },
                              {
                                id: 'edit',
                                label: 'Edit',
                                icon: 'edit',
                                onClick: () => goDetail(project.id, true),
                              },
                            ]}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={page} total={total} onPageChange={setPage} itemLabel="Projects" />
          {total <= DEFAULT_PAGE_SIZE && (
            <div className="border-t border-outline-variant/30 p-4">
              <p className="text-[11px] text-on-surface-variant">
                Showing <span className="font-semibold text-on-background">1-{total}</span> of{' '}
                <span className="font-semibold text-on-background">{total}</span> Projects
                {!selection.selectionMode && (
                  <span className="ml-2 opacity-80">· Hold a row 3s to multi-select</span>
                )}
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
