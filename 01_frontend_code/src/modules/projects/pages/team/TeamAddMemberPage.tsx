import { useNavigate, useParams } from '@tanstack/react-router'
import { BackButton } from '@/shared/components/layout/BackButton'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { Button } from '@/shared/components/ui/Button'
import { Select } from '@/shared/components/ui/Select'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { cn } from '@/shared/lib/cn'
import { projectRoutes } from '../../routes'
import { TEAM_MEMBER_ROLE_OPTIONS, useTeamAddMembers } from '../../hooks/team/use-team-add-members'

function Icon({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn('material-symbols-outlined', className)} aria-hidden>
      {name}
    </span>
  )
}

export function TeamAddMemberPage() {
  const { teamId } = useParams({ strict: false }) as { teamId: string }
  const navigate = useNavigate()
  const m = useTeamAddMembers(teamId)

  if (m.isLoading) return <PageLoadingSkeleton />
  if (m.teamId == null || m.isError || !m.team) {
    return (
      <ErrorState
        title="Could not load team"
        description={getApiErrorMessage(m.loadError, 'Team members cannot be added right now.')}
        onRetry={() => m.refetch()}
        onBack={() => safeNavigate(navigate, { to: projectRoutes.teams })}
      />
    )
  }

  const goDetail = () =>
    safeNavigate(navigate, {
      to: projectRoutes.teamDetailPath,
      params: { teamId: String(m.teamId) },
    })

  return (
    <div className="space-y-6 animate-fade-in">
      <BackButton
        to={projectRoutes.teamDetail(m.teamId)}
        label={`Back to ${m.team?.name ?? 'team'}`}
      />
      <PageHeader
        title={`Add members — ${m.team?.name ?? ''}`}
        description="Pick employees, set a team role or a custom position, then add them to the team."
        actions={
          <Button
            variant="primary"
            size="sm"
            disabled={!m.canSubmit || m.submitting}
            onClick={() =>
              void m.submit().then((ok) => {
                if (ok) goDetail()
              })
            }
          >
            {m.submitting
              ? 'Adding…'
              : m.selectionList.length > 0
                ? `Add ${m.selectionList.length} member${m.selectionList.length === 1 ? '' : 's'}`
                : 'Add members'}
          </Button>
        }
      />

      <div className="bv-surface p-4">
        <div className="relative max-w-sm">
          <Icon
            name="search"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
          />
          <input
            value={m.query}
            onChange={(e) => m.setQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-outline-variant rounded-lg text-body-sm focus:ring-2 focus:ring-secondary/30 outline-none"
            placeholder="Search employees…"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {m.candidates.map((e) => {
          const id = Number(e.id)
          const sel = m.selected[id]
          const checked = Boolean(sel)
          return (
            <div
              key={id}
              className={cn(
                'bv-surface p-4 flex flex-col gap-3 border-2 transition-colors',
                checked ? 'border-secondary' : 'border-transparent',
              )}
            >
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 rounded border-outline-variant text-secondary"
                  checked={checked}
                  onChange={() =>
                    m.toggle(id, e.fullName || e.employee_code, e.employee_code)
                  }
                />
                <div className="w-10 h-10 rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-xs font-bold shrink-0">
                  {(e.fullName || e.employee_code || '?')
                    .split(' ')
                    .map((p: string) => p[0])
                    .join('')
                    .slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-body-sm">{e.fullName || e.employee_code}</p>
                  <p className="text-caption text-on-surface-variant">
                    {[e.employee_code, e.departmentName, e.positionName]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
              </label>
              {checked && sel && (
                <div className="flex flex-wrap items-center gap-2 pl-7">
                  {!sel.useCustom ? (
                    <Select
                      value={sel.role}
                      onChange={(v) => m.setRole(id, v)}
                      options={TEAM_MEMBER_ROLE_OPTIONS.map((r) => ({ value: r, label: r }))}
                      minWidthClass="min-w-[150px]"
                      aria-label={`Role for ${sel.name}`}
                    />
                  ) : (
                    <input
                      value={sel.customRole}
                      onChange={(ev) => m.setCustomRole(id, ev.target.value)}
                      placeholder="Custom position, e.g. QA Analyst"
                      className="flex-1 min-w-[180px] border border-outline-variant rounded-lg px-3 py-2 text-body-sm focus:ring-2 focus:ring-secondary/30 outline-none"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => m.setUseCustom(id, !sel.useCustom)}
                    className="text-label-md font-semibold text-secondary hover:opacity-80"
                  >
                    {sel.useCustom ? 'Use preset role' : 'Custom role'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
        {m.candidates.length === 0 && (
          <p className="text-body-sm text-on-surface-variant lg:col-span-2">
            No eligible employees found. Everyone is already on this team, or try another search.
          </p>
        )}
      </div>
    </div>
  )
}
