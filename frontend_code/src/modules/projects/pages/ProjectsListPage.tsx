import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/shared/components/ui/Button'
import { Select } from '@/shared/components/ui/Select'
import { Pagination, paginate, DEFAULT_PAGE_SIZE } from '@/shared/components/ui/Pagination'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import { TableSkeleton } from '@/shared/components/feedback/Skeleton'
import { RowActions } from '@/shared/components/ui/RowActions'
import { ListToolbar } from '@/shared/components/layout/ListToolbar'
import { BulkSelectionBar } from '@/shared/components/layout/BulkSelectionBar'
import { useQuickOverview } from '@/shared/components/layout/QuickOverview'
import { useListSelection } from '@/shared/hooks/useListSelection'
import { useProjects } from '../hooks/use-projects'
import type { ProjectStatus } from '../schemas/project'
import { cn } from '@/shared/lib/cn'

function PriorityBadge({ status }: { status: ProjectStatus }) {
  if (status === 'IN_PROGRESS') {
    return (
      <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
        Critical
      </span>
    )
  }
  if (status === 'ON_HOLD') {
    return (
      <span className="bg-orange-100 text-orange-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
        High
      </span>
    )
  }
  return (
    <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
      Medium
    </span>
  )
}

function statusTrackLabel(status: ProjectStatus) {
  switch (status) {
    case 'IN_PROGRESS':
      return { dot: 'bg-emerald-500', text: 'text-emerald-700', label: 'On Track' }
    case 'PLANNING':
      return { dot: 'bg-blue-500', text: 'text-blue-700', label: 'Planning' }
    case 'ON_HOLD':
      return { dot: 'bg-amber-500', text: 'text-amber-700', label: 'Delayed' }
    case 'COMPLETED':
      return { dot: 'bg-emerald-500', text: 'text-emerald-700', label: 'Completed' }
    default:
      return { dot: 'bg-gray-400', text: 'text-on-surface-variant', label: status }
  }
}

const STATUS_OPTIONS = [
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'PLANNING', label: 'Planning' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

export function ProjectsListPage() {
  const navigate = useNavigate()
  const { open: openOverview } = useQuickOverview()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading, isError, refetch } = useProjects({
    search: search || undefined,
    status: status || undefined,
  })

  const filtersActive = Boolean(search || status)

  const resetFilters = () => {
    setSearch('')
    setStatus('')
    setPage(1)
  }

  const items = data?.items ?? []
  const total = items.length
  const pageItems = useMemo(() => paginate(items, page, DEFAULT_PAGE_SIZE), [items, page])

  const selection = useListSelection({
    items: pageItems,
    getId: (p) => String(p.id),
  })

  const active = items.filter((p) => p.status === 'IN_PROGRESS').length
  const atRisk = items.filter((p) => p.status === 'ON_HOLD').length

  const goDetail = (id: number, edit?: boolean) => {
    navigate({
      to: '/projects/$projectId',
      params: { projectId: String(id) },
      search: edit ? { edit: '1' } : undefined,
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
            Manage projects, assign teams, track milestones and monitor budget burn rates.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" leftIcon={<span className="material-symbols-outlined text-[18px]">upload</span>}>
            Import
          </Button>
          <Button variant="outline" size="sm" leftIcon={<span className="material-symbols-outlined text-[18px]">download</span>}>
            Export
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<span className="material-symbols-outlined text-[18px]">add</span>}
            onClick={() => navigate({ to: '/projects/new' })}
          >
            New Project
          </Button>
        </div>
      </section>

      <ListToolbar
        search={search}
        onSearchChange={(v) => {
          setSearch(v)
          setPage(1)
        }}
        searchPlaceholder="Search by Project Name, Client..."
        filtersActive={filtersActive}
        onResetFilters={resetFilters}
        onRefresh={() => void refetch()}
      >
        <Select
          value={status}
          onChange={(v) => {
            setStatus(v)
            setPage(1)
          }}
          placeholder="Project Status"
          options={STATUS_OPTIONS}
        />
      </ListToolbar>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Metric label="Total Projects" value={String(total || '—')} trend="+12%" icon="folder_open" tone="bg-electric-blue/10 text-electric-blue" />
        <Metric label="Active Projects" value={String(active)} trend="+4.2%" icon="trending_up" tone="bg-purple-100 text-purple-600" />
        <Metric label="At Risk / Delayed" value={String(atRisk)} trend="-2.1%" trendDanger icon="warning" tone="bg-red-100 text-red-600" />
        <div className="bg-deep-navy border border-white/10 rounded-xl p-5 executive-shadow flex flex-col justify-between h-[160px]">
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
          </div>
          <div>
            <p className="text-label-sm text-white/70 mb-1">Total Managed Budget</p>
            <h3 className="text-[32px] font-bold text-white leading-none">$12.4M</h3>
          </div>
        </div>
      </section>

      {selection.selectionMode && (
        <BulkSelectionBar
          selectedCount={selection.selectedCount}
          filteredCount={pageItems.length}
          onCancel={selection.exitSelectionMode}
        >
          <Button variant="outline" size="sm">
            Export selected
          </Button>
          <Button variant="primary" size="sm">
            Archive
          </Button>
        </BulkSelectionBar>
      )}

      {isLoading && <TableSkeleton rows={5} />}
      {isError && (
        <div className="rounded-lg border border-error/30 bg-error/5 p-6 text-center">
          <p className="text-body-md text-error mb-3">Failed to load projects.</p>
          <Button variant="outline" onClick={() => refetch()}>Retry</Button>
        </div>
      )}
      {!isLoading && !isError && items.length === 0 && (
        <EmptyState
          icon="folder_off"
          title="No projects yet"
          description="Create your first project or clear filters."
          actionLabel="New Project"
          onAction={() => navigate({ to: '/projects/new' })}
        />
      )}

      {!isLoading && !isError && items.length > 0 && (
        <section className="bv-surface overflow-hidden flex flex-col">
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
                        title="Select all filtered rows on this page"
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

                  const openOverviewFor = () =>
                    openOverview({
                      id: project.id,
                      title: project.name,
                      subtitle: project.code,
                      badge: project.status.replace('_', ' '),
                      fields: [
                        { label: 'Client', value: project.clientName ?? '—' },
                        { label: 'Progress', value: `${project.progress ?? 0}%` },
                        { label: 'Tasks', value: String(project.taskCount ?? 0) },
                        { label: 'Teams', value: String(project.teamCount ?? 0) },
                        { label: 'Start', value: project.startDate ?? '—' },
                        { label: 'End', value: project.endDate ?? '—' },
                      ],
                      detailTo: '/projects/$projectId',
                      detailParams: { projectId: String(project.id) },
                      editTo: '/projects/$projectId',
                      editParams: { projectId: String(project.id) },
                    })

                  return (
                    <tr
                      key={project.id}
                      className={cn(
                        'h-[72px] cursor-pointer select-none',
                        isSelected ? 'bg-secondary/10' : 'zebra-row'
                      )}
                      onMouseDown={() => selection.onRowPressStart(id)}
                      onMouseUp={() => selection.onRowPressEnd(id, openOverviewFor)}
                      onMouseLeave={selection.onRowPressCancel}
                      onTouchStart={() => selection.onRowPressStart(id)}
                      onTouchEnd={() => selection.onRowPressEnd(id, openOverviewFor)}
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
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
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
                          <PriorityBadge status={project.status} />
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
                              className="h-full rounded-full bg-electric-blue"
                              style={{ width: `${project.progress ?? 0}%` }}
                            />
                          </div>
                          <span className="text-body-sm text-on-surface-variant">{project.progress ?? 0}%</span>
                        </div>
                      </td>
                      <td className="py-2 px-6 text-right" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end">
                          <RowActions
                            label={`Actions for ${project.name}`}
                            actions={[
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

function Metric({
  label,
  value,
  trend,
  trendDanger,
  icon,
  tone,
}: {
  label: string
  value: string
  trend?: string
  trendDanger?: boolean
  icon: string
  tone: string
}) {
  return (
    <div className="bv-surface card-hover p-5 flex flex-col justify-between h-[160px]">
      <div className="flex justify-between items-start">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', tone)}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            {icon}
          </span>
        </div>
        {trend && (
          <div
            className={cn(
              'text-xs font-bold px-2 py-1 rounded',
              trendDanger ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
            )}
          >
            {trend}
          </div>
        )}
      </div>
      <div>
        <p className="text-label-sm text-on-surface-variant mb-1">{label}</p>
        <h3 className="text-[32px] font-bold text-on-background leading-none">{value}</h3>
      </div>
    </div>
  )
}
