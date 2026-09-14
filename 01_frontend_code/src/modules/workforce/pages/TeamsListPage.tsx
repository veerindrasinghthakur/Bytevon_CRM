import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { Select } from '@/shared/components/ui/Select'
import { MetricCard } from '@/shared/components/ui/MetricCard'
import { ExportButton } from '@/shared/components/export/ExportButton'
import { TableSkeleton } from '@/shared/components/feedback/Skeleton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { useQuickOverview } from '@/shared/components/layout/QuickOverview'
import {
  QuickSection,
  QuickStat,
  QuickStatGrid,
  QuickMetaTile,
  QuickRelatedRow,
  QuickPersonRow,
} from '@/shared/components/layout/QuickOverviewParts'
import { useTeamsList } from '../hooks/use-teams-list'
import { useDepartmentsList } from '../hooks/use-departments-list'
import type { Team } from '../types'
import { workforceRoutes } from '../routes'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { cn } from '@/shared/lib/cn'
import { DEPARTMENT_STATUS_OPTIONS } from '../schemas/enums'

function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn('material-symbols-outlined', className)} aria-hidden>
      {name}
    </span>
  )
}

function TeamQuickContent({ team }: { team: Team }) {
  return (
    <>
      <QuickSection title="Quick Statistics">
        <QuickStatGrid>
          <QuickStat icon="group" value={team.memberCount} label="Members" />
          <QuickStat icon="folder_open" value={team.projectCount} label="Projects" />
          <QuickStat icon="check_circle" value={team.status} label="Status" />
        </QuickStatGrid>
      </QuickSection>

      <QuickSection title="General Info">
        <div className="grid grid-cols-2 gap-3">
          <QuickMetaTile icon="domain" label="Department" value={team.department} />
          <QuickMetaTile
            icon="toggle_on"
            label="Status"
            value={
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-[11px] font-bold uppercase',
                  team.status === 'Active'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-surface-container text-on-surface-variant',
                )}
              >
                {team.status}
              </span>
            }
          />
        </div>
        {team.description && (
          <p className="mt-3 text-body-sm text-on-surface-variant">{team.description}</p>
        )}
      </QuickSection>

      <QuickSection title="Leadership">
        <QuickPersonRow
          initials={team.headName
            .split(' ')
            .map((p) => p[0])
            .join('')
            .slice(0, 2)}
          roleLabel={team.headTitle ?? 'Team Head'}
          name={team.headName}
        />
      </QuickSection>

      <QuickSection title="Related">
        <QuickRelatedRow icon="domain" label="Department" value={team.department} />
        <QuickRelatedRow icon="group" label="Members" value={String(team.memberCount)} />
        <QuickRelatedRow icon="folder_open" label="Projects" value={String(team.projectCount)} />
      </QuickSection>
    </>
  )
}

export function TeamsListPage() {
  const navigate = useNavigate()
  const { openPanel } = useQuickOverview()
  const {
    metrics,
    filtered,
    pageItems,
    isLoading,
    isError,
    refetch,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    departmentFilter,
    setDepartmentFilter,
    resetFilters,
    selectionMode,
    selectedIds,
    selectedCount,
    allFilteredSelected,
    isSelected,
    toggleOne,
    toggleSelectAllFiltered,
    exitSelectionMode,
    onRowPressStart,
    onRowPressEnd,
    onRowPressCancel,
  } = useTeamsList()
  const { items: departments } = useDepartmentsList()

  const rows = pageItems.length > 0 ? pageItems : filtered

  const openTeamOverview = (t: Team) => {
    openPanel({
      title: t.name,
      subtitle: t.department,
      icon: t.icon ?? 'groups',
      status: t.status,
      statusDotClass: t.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400',
      content: <TeamQuickContent team={t} />,
      fullRecordLabel: 'View full team',
      onOpenFull: () =>
        safeNavigate(navigate, {
          to: workforceRoutes.teamDetailPath,
          params: { teamId: String(t.id) },
        }),
      widthClass: 'max-w-[520px]',
    })
  }

  const goCreateTeam = () =>
    safeNavigate(navigate, { to: workforceRoutes.teamNew })

  return (
    <div className="space-y-6 relative animate-fade-in">
      <PageHeader
        title="Teams"
        description="Manage and organize your cross-functional teams."
        actions={
          <div className="flex gap-2 flex-wrap">
            <ExportButton
              resource="team"
              query={search}
              filters={{
                status: statusFilter !== 'All' ? statusFilter : undefined,
                department: departmentFilter !== 'All' ? departmentFilter : undefined,
              }}
              selectedIds={selectionMode ? Array.from(selectedIds) : undefined}
              filenameStem="teams"
            />
            <Button variant="primary" leftIcon={<Icon name="add" />} onClick={goCreateTeam}>
              New Team
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <MetricCard
            key={m.id}
            label={m.label}
            value={m.value}
            icon={m.icon}
            valueClassName={m.change ? 'text-secondary' : undefined}
          />
        ))}
      </div>

      <div className="bv-surface overflow-hidden">
        <div className="p-4 border-b border-outline-variant/30 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-lg text-body-sm focus:ring-2 focus:ring-secondary/30 outline-none transition-colors"
              placeholder="Search teams..."
            />
          </div>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="All Statuses"
            options={[{ value: 'All', label: 'All Statuses' }, ...DEPARTMENT_STATUS_OPTIONS]}
            minWidthClass="min-w-[140px]"
          />
          <Select
            value={departmentFilter}
            onChange={setDepartmentFilter}
            placeholder="All Departments"
            options={[
              { value: 'All', label: 'All Departments' },
              ...departments.map((d) => ({ value: d.name, label: d.name })),
            ]}
            minWidthClass="min-w-[160px]"
          />
          <button
            type="button"
            className="p-2 text-secondary border border-outline-variant rounded-lg hover:bg-secondary/5"
            onClick={resetFilters}
            aria-label="Reset filters"
          >
            <Icon name="restart_alt" className="text-lg" />
          </button>
        </div>

        {selectionMode && (
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-secondary/20 bg-secondary/5">
            <label className="flex items-center gap-2 text-body-sm font-semibold text-on-surface cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-outline-variant text-secondary"
                checked={allFilteredSelected}
                onChange={toggleSelectAllFiltered}
                aria-label="Select all filtered teams"
              />
              {selectedCount} selected
              <span className="text-on-surface-variant font-normal"> (of {filtered.length} shown)</span>
            </label>
            <div className="flex-1" />
            <Button variant="outline" size="sm" onClick={exitSelectionMode}>
              Cancel
            </Button>
            <ExportButton
              resource="team"
              selectedIds={Array.from(selectedIds)}
              filenameStem="teams-selected"
              label="Export selected"
            />
          </div>
        )}

        {isLoading && (
          <div className="p-4">
            <TableSkeleton rows={5} />
          </div>
        )}

        {isError && (
          <div className="p-6">
            <ErrorState
              title="Failed to load teams"
              description="We could not load the teams list. Check your connection and try again."
              onRetry={() => void refetch()}
              onBack={() => safeNavigate(navigate, { to: workforceRoutes.teams })}
            />
          </div>
        )}

        {!isLoading && !isError && (
          <>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low/50 border-b border-outline-variant/30">
                  <th className="px-3 py-4 w-12 text-center">
                    {selectionMode ? (
                      <input
                        type="checkbox"
                        className="rounded border-outline-variant text-secondary"
                        checked={allFilteredSelected}
                        onChange={toggleSelectAllFiltered}
                        aria-label="Select all filtered rows"
                      />
                    ) : (
                      <span className="sr-only">Select</span>
                    )}
                  </th>
                  <th className="px-6 py-4 text-label-sm font-medium text-on-surface-variant uppercase">Team Name</th>
                  <th className="px-6 py-4 text-label-sm font-medium text-on-surface-variant uppercase">Head</th>
                  <th className="px-6 py-4 text-label-sm font-medium text-on-surface-variant uppercase">Members</th>
                  <th className="px-6 py-4 text-label-sm font-medium text-on-surface-variant uppercase">Projects</th>
                  <th className="px-6 py-4 text-label-sm font-medium text-on-surface-variant uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {rows.map((t) => {
                  const selected = isSelected(t.id)
                  return (
                    <tr
                      key={t.id}
                      className={cn(
                        'zebra-row cursor-pointer group select-none',
                        selected && 'bg-secondary/10',
                      )}
                      onMouseDown={() => onRowPressStart(t.id)}
                      onMouseUp={() => onRowPressEnd(t.id, () => openTeamOverview(t))}
                      onMouseLeave={onRowPressCancel}
                      onTouchStart={() => onRowPressStart(t.id)}
                      onTouchEnd={() => onRowPressEnd(t.id, () => openTeamOverview(t))}
                      onTouchCancel={onRowPressCancel}
                      onContextMenu={(e) => e.preventDefault()}
                    >
                      <td
                        className="px-3 py-4 text-center"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (selectionMode) toggleOne(t.id)
                        }}
                      >
                        {selectionMode ? (
                          <input
                            type="checkbox"
                            className="rounded border-outline-variant text-secondary"
                            checked={selected}
                            onChange={() => toggleOne(t.id)}
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`Select ${t.name}`}
                          />
                        ) : null}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
                            <Icon name={t.icon ?? 'groups'} />
                          </div>
                          <div>
                            <p className="font-semibold group-hover:text-secondary">{t.name}</p>
                            <p className="text-caption text-on-surface-variant">{t.department}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-xs font-bold">
                            {t.headName
                              .split(' ')
                              .map((p) => p[0])
                              .join('')
                              .slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{t.headName}</p>
                            <p className="text-caption text-on-surface-variant">{t.headTitle}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-xs font-medium inline-flex">
                          {t.memberCount}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium">{t.projectCount}</span>
                        {t.status === 'Active' && (
                          <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase">
                            Active
                          </span>
                        )}
                      </td>
                      <td
                        className="px-6 py-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="p-2 hover:bg-secondary/10 rounded-full transition-colors"
                          onClick={() => openTeamOverview(t)}
                          aria-label={`Quick view ${t.name}`}
                        >
                          <Icon name="visibility" className="text-lg" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div className="px-6 py-3 border-t border-outline-variant/30 text-xs text-on-surface-variant">
              Showing <span className="font-semibold text-on-surface">{rows.length}</span> of{' '}
              <span className="font-semibold text-on-surface">{filtered.length}</span> teams
              {!selectionMode && (
                <span className="ml-2 text-on-surface-variant/80">· Hold a row 3s to multi-select</span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
