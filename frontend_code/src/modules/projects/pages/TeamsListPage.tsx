import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/shared/components/ui/Button'
import { Select } from '@/shared/components/ui/Select'
import { ExportButton } from '@/shared/components/export/ExportButton'
import { Pagination, DEFAULT_PAGE_SIZE } from '@/shared/components/ui/Pagination'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import { TableSkeleton } from '@/shared/components/feedback/Skeleton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { RowActions } from '@/shared/components/ui/RowActions'
import { ListToolbar } from '@/shared/components/layout/ListToolbar'
import { BulkSelectionBar } from '@/shared/components/layout/BulkSelectionBar'
import { useQuickOverview } from '@/shared/components/layout/QuickOverview'
import {
  QuickSection,
  QuickStat,
  QuickStatGrid,
  QuickMetaTile,
  QuickPersonRow,
  QuickRelatedRow,
} from '@/shared/components/layout/QuickOverviewParts'
import { useListSelection } from '@/shared/hooks/useListSelection'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { useTeamsList } from '../hooks/use-teams-list'
import { projectRoutes } from '../routes'
import { CreateTeamModal } from '../components/CreateTeamModal'
import type { Team } from '../types'
import { cn } from '@/shared/lib/cn'
import { teamStatusColors } from '../cssTokens'
import { TeamStatusOptions } from '../enums'

function TeamQuickContent({ team }: { team: Team }) {
  return (
    <>
      <QuickSection title="Capacity">
        <QuickStatGrid>
          <QuickStat icon="group" value={String(team.memberCount)} label="Members" />
          <QuickStat icon="folder" value={String(team.projectCount)} label="Projects" />
          <QuickStat icon="flag" value={team.status} label="Status" />
        </QuickStatGrid>
      </QuickSection>
      <QuickSection title="Leadership">
        {team.headName ? (
          <QuickPersonRow
            initials={team.headName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)}
            roleLabel={team.headRole ?? 'Head'}
            name={team.headName}
          />
        ) : (
          <QuickRelatedRow icon="person_off" label="Head" value="Unassigned" />
        )}
      </QuickSection>
      <QuickSection title="Details">
        <div className="grid grid-cols-2 gap-3">
          <QuickMetaTile icon="domain" label="Department" value={team.department ?? '—'} />
          <QuickMetaTile icon="link" label="Linked project" value={team.projectName ?? '—'} />
        </div>
      </QuickSection>
    </>
  )
}

export function TeamsListPage() {
  const navigate = useNavigate()
  const { openPanel } = useQuickOverview()
  const [createOpen, setCreateOpen] = useState(false)

  const {
    filtered,
    pageItems,
    totalCount: total,
    search,
    setSearch,
    status,
    setStatus,
    department,
    setDepartment,
    filtersActive,
    resetFilters,
    page,
    setPage,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useTeamsList()

  const selection = useListSelection({
    items: pageItems,
    getId: (t) => String(t.id),
  })

  const activeMembers = useMemo(
    () => filtered.reduce((s, t) => s + t.memberCount, 0),
    [filtered],
  )
  const totalProjects = useMemo(
    () => filtered.reduce((s, t) => s + t.projectCount, 0),
    [filtered],
  )
  const avgSize = total > 0 ? (activeMembers / total).toFixed(1) : '0'

  const goTeam = (teamId: number, edit?: boolean) =>
    safeNavigate(navigate, {
      to: projectRoutes.teamDetailPath,
      params: { teamId: String(teamId) },
      search: edit ? { edit: '1' } : undefined,
    })

  const openTeamOverview = (team: Team) => {
    const statusStyle = teamStatusColors[team.status] ?? {
      label: team.status,
      className: 'status-badge status-neutral',
      dot: 'bg-outline',
    }
    openPanel({
      title: team.name,
      subtitle: team.department ?? undefined,
      icon: 'groups',
      status: statusStyle.label,
      statusDotClass: statusStyle.dot,
      content: <TeamQuickContent team={team} />,
      fullRecordLabel: 'Open full record',
      onOpenFull: () => goTeam(team.id),
      onEdit: () => goTeam(team.id, true),
      widthClass: 'max-w-[520px]',
    })
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-[32px] leading-10 font-bold tracking-tight text-on-background">Teams</h2>
          <p className="text-body-md text-on-surface-variant mt-1">
            Manage and organize your cross-functional teams.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <ExportButton
            resource="team"
            query={search}
            filters={{ status, department }}
            selectedIds={selection.selectionMode ? Array.from(selection.selectedIds) : undefined}
            filenameStem="project-teams"
          />
          <Button
            variant="primary"
            size="sm"
            leftIcon={<span className="material-symbols-outlined text-[18px]">add</span>}
            onClick={() => setCreateOpen(true)}
          >
            New Team
          </Button>
        </div>
      </section>

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search teams..."
        filtersActive={filtersActive}
        onResetFilters={resetFilters}
        onRefresh={() => void refetch()}
      >
        <Select
          value={status}
          onChange={setStatus}
          placeholder="All Statuses"
          aria-label="Filter by team status"
          options={[{ value: '', label: 'All Statuses' }, ...TeamStatusOptions]}
        />
        <Select
          value={department}
          onChange={setDepartment}
          placeholder="All Departments"
          aria-label="Filter by department"
          options={[
            { value: '', label: 'All Departments' },
            { value: 'Engineering', label: 'Engineering' },
            { value: 'Design', label: 'Design' },
            { value: 'Sales', label: 'Sales' },
          ]}
        />
      </ListToolbar>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          label="Total Teams"
          value={String(total || '—')}
          trend="+12%"
          icon="groups"
          iconClass="bg-secondary/10 text-secondary"
        />
        <MetricCard
          label="Active Members"
          value={String(activeMembers)}
          trend="+4%"
          icon="person"
          iconClass="bg-secondary/10 text-secondary"
        />
        <MetricCard
          label="Total Projects"
          value={String(totalProjects)}
          sub="Active"
          icon="account_tree"
          iconClass="bg-secondary/10 text-secondary"
        />
        <MetricCard
          label="Avg. Team Size"
          value={avgSize}
          sub="Members"
          icon="group_work"
          iconClass="bg-[var(--color-warning-amber)]/10 text-[var(--color-warning-amber)]"
        />
      </section>

      {selection.selectionMode && (
        <BulkSelectionBar
          selectedCount={selection.selectedCount}
          filteredCount={pageItems.length}
          onCancel={selection.exitSelectionMode}
        >
          <ExportButton
            resource="team"
            selectedIds={Array.from(selection.selectedIds)}
            filenameStem="project-teams-selected"
            label="Export selected"
          />
        </BulkSelectionBar>
      )}

      {isError && (
        <ErrorState
          title="Failed to load teams"
          description="We could not load the teams list. Check your connection and try again."
          onRetry={() => void refetch()}
        />
      )}

      {!isError && filtered.length === 0 && !isLoading && (
        <EmptyState
          icon="groups"
          title="No teams found"
          description="Adjust filters or create a new team."
          actionLabel="New Team"
          onAction={() => setCreateOpen(true)}
        />
      )}

      {!isError && (filtered.length > 0 || isLoading) && (
        <section className="bv-surface overflow-hidden flex flex-col relative">
          {(isLoading || isFetching) && (
            <div className="absolute inset-0 z-10 bg-surface-container-lowest/70 backdrop-blur-[1px]">
              <TableSkeleton rows={4} />
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-outline-variant/30 bg-surface/50">
                  <th className="py-4 px-6 w-12">
                    {selection.selectionMode ? (
                      <input
                        type="checkbox"
                        className="rounded border-outline-variant w-4 h-4"
                        checked={selection.allFilteredSelected}
                        onChange={selection.toggleSelectAllFiltered}
                        title="Select all on this page"
                        aria-label="Select all on this page"
                      />
                    ) : (
                      <span className="sr-only">Select</span>
                    )}
                  </th>
                  <th className="py-4 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Team Name</th>
                  <th className="py-4 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Head</th>
                  <th className="py-4 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Members</th>
                  <th className="py-4 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Projects</th>
                  <th className="py-4 px-6 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {pageItems.map((team) => {
                  const id = String(team.id)
                  const isSelected = selection.isSelected(id)

                  return (
                    <tr
                      key={team.id}
                      className={cn(
                        'h-[72px] cursor-pointer select-none',
                        isSelected ? 'bg-secondary/10' : 'zebra-row',
                      )}
                      onMouseDown={() => selection.onRowPressStart(id)}
                      onMouseUp={() => selection.onRowPressEnd(id, () => openTeamOverview(team))}
                      onMouseLeave={selection.onRowPressCancel}
                      onTouchStart={() => selection.onRowPressStart(id)}
                      onTouchEnd={() => selection.onRowPressEnd(id, () => openTeamOverview(team))}
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
                          <span className="inline-block w-2.5 h-2.5 rounded-full bg-outline-variant" aria-hidden />
                        )}
                      </td>
                      <td className="py-2 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
                            <span className="material-symbols-outlined">groups</span>
                          </div>
                          <div>
                            <p className="text-body-md font-semibold text-on-background">{team.name}</p>
                            <p className="text-[11px] text-on-surface-variant">{team.department ?? '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        {team.headName ? (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-xs font-bold text-on-background">
                              {team.headName
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .slice(0, 2)}
                            </div>
                            <div>
                              <p className="text-body-md font-medium text-on-background">{team.headName}</p>
                              <p className="text-[11px] text-on-surface-variant">{team.headRole}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-body-md text-on-surface-variant italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-2 px-4">
                        <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-xs font-medium text-on-background">
                          {team.memberCount}
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-body-md font-medium text-on-background">{team.projectCount}</span>
                          {team.status === 'ACTIVE' && (
                            <span className="status-badge status-success">Active</span>
                          )}
                        </div>
                      </td>
                      <td
                        className="py-2 px-6 text-right"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex justify-end">
                          <RowActions
                            label={`Actions for ${team.name}`}
                            actions={[
                              {
                                id: 'overview',
                                label: 'Quick view',
                                icon: 'visibility',
                                onClick: () => openTeamOverview(team),
                              },
                              { id: 'view', label: 'View', icon: 'description', onClick: () => goTeam(team.id) },
                              { id: 'edit', label: 'Edit', icon: 'edit', onClick: () => goTeam(team.id, true) },
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
          <Pagination page={page} total={total} onPageChange={setPage} itemLabel="Teams" />
          {total <= DEFAULT_PAGE_SIZE && (
            <div className="border-t border-outline-variant/30 p-4">
              <p className="text-[11px] text-on-surface-variant">
                Showing <span className="font-semibold text-on-background">1-{total}</span> of{' '}
                <span className="font-semibold text-on-background">{total}</span> Teams
                {!selection.selectionMode && (
                  <span className="ml-2 opacity-80">· Hold a row 3s to multi-select</span>
                )}
              </p>
            </div>
          )}
        </section>
      )}

      <CreateTeamModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={() => void refetch()} />
    </div>
  )
}

function MetricCard({
  label,
  value,
  trend,
  sub,
  icon,
  iconClass,
}: {
  label: string
  value: string
  trend?: string
  sub?: string
  icon: string
  iconClass: string
}) {
  return (
    <div className="bv-surface card-hover p-5 flex flex-col justify-between h-[160px]">
      <div className="flex justify-between items-start">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconClass}`}>
          <span className="material-symbols-outlined material-icons-filled">{icon}</span>
        </div>
        {trend && (
          <div className="status-badge status-success text-xs font-bold px-2 py-1">{trend}</div>
        )}
      </div>
      <div>
        <p className="text-label-sm text-on-surface-variant mb-1">{label}</p>
        <div className="flex items-end gap-2">
          <h3 className="text-[32px] font-bold text-on-background leading-none">{value}</h3>
          {sub && <span className="text-label-sm text-on-surface-variant mb-0.5">{sub}</span>}
        </div>
      </div>
    </div>
  )
}
