import { DateRangeFilter } from '@/shared/components/forms/DateRangeFilter'
import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { Select } from '@/shared/components/ui/Select'
import { MetricCard } from '@/shared/components/ui/MetricCard'
import { ExportButton } from '@/shared/components/export/ExportButton'
import { TableSkeleton } from '@/shared/components/feedback/Skeleton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { useQuickOverview } from '@/shared/components/layout/QuickOverview'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import {
  QuickSection,
  QuickStat,
  QuickStatGrid,
  QuickMetaTile,
  QuickRelatedRow,
  QuickPersonRow,
} from '@/shared/components/layout/QuickOverviewParts'
import { useTeamsList } from '../../hooks/team/use-teams'
import type { Team } from '../../types'
import { projectRoutes } from '../../routes'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { Can } from '@/shared/rbac'
import { cn } from '@/shared/lib/cn'
import { TeamStatusOptions } from '../../enums'

function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn('material-symbols-outlined', className)} aria-hidden>
      {name}
    </span>
  )
}

function TeamQuickContent({ team }: { team: Team }) {
  const statusLabel = team.status === 'ACTIVE' ? 'Active' : 'Inactive'
  return (
    <>
      <QuickSection title="Quick Statistics">
        <QuickStatGrid>
          <QuickStat icon="group" value={team.memberCount} label="Members" />
          <QuickStat icon="folder_open" value={team.projectCount} label="Projects" />
          <QuickStat icon="check_circle" value={statusLabel} label="Status" />
        </QuickStatGrid>
      </QuickSection>
      <QuickSection title="General Info">
        <div className="grid grid-cols-2 gap-3">
          <QuickMetaTile icon="domain" label="Department" value={team.department ?? '—'} />
          <QuickMetaTile icon="toggle_on" label="Status" value={statusLabel} />
        </div>
        {team.description && (
          <p className="mt-3 text-body-sm text-on-surface-variant">{team.description}</p>
        )}
      </QuickSection>
      <QuickSection title="Leadership">
        <QuickPersonRow
          initials={(team.headName ?? 'U')
            .split(' ')
            .map((x) => x[0])
            .join('')
            .slice(0, 2)}
          roleLabel={team.headRole ?? 'Team Head'}
          name={team.headName ?? 'Unassigned'}
        />
      </QuickSection>
      <QuickSection title="Related">
        <QuickRelatedRow icon="domain" label="Department" value={team.department ?? '—'} />
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
    pageItems,
    totalCount,
    isLoading,
    isError,
    error,
    refetch,
    search,
    setSearch,
    status,
    setStatus,
    dateFilter,
    setDateFilter,
  } = useTeamsList()

  const openTeamOverview = (t: Team) => {
    openPanel({
      title: t.name,
      subtitle: t.department,
      icon: 'groups',
      status: t.status === 'ACTIVE' ? 'Active' : 'Inactive',
      statusDotClass: t.status === 'ACTIVE' ? 'bg-secondary' : 'bg-outline',
      content: <TeamQuickContent team={t} />,
      fullRecordLabel: 'View full team',
      onOpenFull: () =>
        safeNavigate(navigate, {
          to: projectRoutes.teamDetailPath,
          params: { teamId: String(t.id) },
        }),
      widthClass: 'max-w-[520px]',
    })
  }

  return (
    <div className="space-y-6 relative animate-fade-in">
      <PageHeader
        title="Teams"
        description="Manage cross-functional teams and their project assignments."
        actions={
          <div className="flex gap-2 flex-wrap">
            <ExportButton resource="project" query={search} filenameStem="teams" />
            <Can action="CREATE" resource="project">
              <Button
                variant="primary"
                leftIcon={<Icon name="add" />}
                onClick={() => safeNavigate(navigate, { to: projectRoutes.teamNew })}
              >
                New Team
              </Button>
            </Can>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Teams" value={String(totalCount)} icon="groups" />
        <MetricCard
          label="Members (page)"
          value={String(pageItems.reduce((s, t) => s + t.memberCount, 0))}
          icon="person"
        />
        <MetricCard
          label="Projects (page)"
          value={String(pageItems.reduce((s, t) => s + t.projectCount, 0))}
          icon="account_tree"
        />
        <MetricCard
          label="Active"
          value={String(pageItems.filter((t) => t.status === 'ACTIVE').length)}
          icon="check_circle"
          valueClassName="text-secondary"
        />
      </div>

      <div className="bv-surface overflow-hidden">
        <div className="p-4 border-b border-outline-variant/30 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-lg text-body-sm focus:ring-2 focus:ring-secondary/30 outline-none"
              placeholder="Search teams..."
            />
          </div>
          <Select
            value={status}
            onChange={setStatus}
            placeholder="All Statuses"
            options={[{ value: '', label: 'All Statuses' }, ...TeamStatusOptions]}
            minWidthClass="min-w-[140px]"
          />
          <DateRangeFilter
            value={{ from: dateFilter?.from ?? '', to: dateFilter?.to ?? '' }}
            onChange={setDateFilter}
            label="Date"
            placeholder="Date"
          />
        </div>

        {isLoading && (
          <div className="p-4">
            <TableSkeleton rows={5} />
          </div>
        )}

        {isError && (
          <div className="p-6">
            <ErrorState
              title="Failed to load teams"
              description={getApiErrorMessage(error, 'We could not load the teams list.')}
              onRetry={() => void refetch()}
            />
          </div>
        )}

        {!isLoading && !isError && (
          <>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low/50 border-b border-outline-variant/30">
                  <th className="px-6 py-4 text-label-sm font-medium text-on-surface-variant uppercase">Team Name</th>
                  <th className="px-6 py-4 text-label-sm font-medium text-on-surface-variant uppercase">Head</th>
                  <th className="px-6 py-4 text-label-sm font-medium text-on-surface-variant uppercase">Members</th>
                  <th className="px-6 py-4 text-label-sm font-medium text-on-surface-variant uppercase">Projects</th>
                  <th className="px-6 py-4 text-label-sm font-medium text-on-surface-variant uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {pageItems.map((t) => (
                  <tr
                    key={t.id}
                    className="zebra-row cursor-pointer group"
                    onClick={() => openTeamOverview(t)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
                          <Icon name="groups" />
                        </div>
                        <div>
                          <p className="font-semibold group-hover:text-secondary">{t.name}</p>
                          <p className="text-caption text-on-surface-variant">{t.department ?? '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-sm">{t.headName ?? '—'}</p>
                      <p className="text-caption text-on-surface-variant">{t.headRole}</p>
                    </td>
                    <td className="px-6 py-4">{t.memberCount}</td>
                    <td className="px-6 py-4">{t.projectCount}</td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="p-2 hover:bg-secondary/10 rounded-full"
                        onClick={() => openTeamOverview(t)}
                        aria-label={`Quick view ${t.name}`}
                      >
                        <Icon name="visibility" className="text-lg" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-6 py-3 border-t border-outline-variant/30 text-xs text-on-surface-variant">
              Showing <span className="font-semibold text-on-surface">{pageItems.length}</span> of{' '}
              <span className="font-semibold text-on-surface">{totalCount}</span> teams
            </div>
          </>
        )}
      </div>
    </div>
  )
}
