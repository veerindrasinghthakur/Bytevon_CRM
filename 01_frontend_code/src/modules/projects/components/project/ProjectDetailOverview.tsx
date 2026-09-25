import type { UseFormReturn } from 'react-hook-form'
import { Button } from '@/shared/components/ui/Button'
import { ActivityFeed } from '@/shared/components/ui/ActivityFeed'
import { EntitySearch, type EntityOption } from '@/shared/components/forms/EntitySearch'
import { handleEnterAdvance } from '@/shared/lib/enter-advance'
import type { ActivityItem } from '@/shared/types'
import type { ProjectDetail } from '../../schemas/project/project'
import type { ProjectDetailFormInput } from '../../schemas/project/project-detail-form'
import {
  MetricCard,
  StatusTimelineCard,
  formatProjectDate,
} from './project-detail-helpers'
import { Can } from '@/shared/rbac'
import { Action } from '@/shared/schema'

type Props = {
  project: ProjectDetail
  openTasks: number
  progress: number
  daysToDeadline: number | null
  isEditing: boolean
  form: UseFormReturn<ProjectDetailFormInput>
  hasTeam: boolean
  changingTeam: boolean
  setChangingTeam: (v: boolean) => void
  teamOptions: EntityOption[]
  selectedTeam: EntityOption | null
  setSelectedTeam: (v: EntityOption | null) => void
  teamAssignError: string | null
  isAssigningTeam: boolean
  assignTeam: (teamId: number) => void
  activityItems: ActivityItem[]
  repoHref: string | null
}

export function ProjectDetailOverview({
  project,
  openTasks,
  progress,
  daysToDeadline,
  isEditing,
  form,
  hasTeam,
  changingTeam,
  setChangingTeam,
  teamOptions,
  selectedTeam,
  setSelectedTeam,
  teamAssignError,
  isAssigningTeam,
  assignTeam,
  activityItems,
  repoHref,
}: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label="Open Tasks" value={String(openTasks)} icon="format_list_bulleted" />
          <MetricCard
            label="Days to Deadline"
            value={
              daysToDeadline == null
                ? '—'
                : daysToDeadline < 0
                  ? `${Math.abs(daysToDeadline)}d overdue`
                  : String(daysToDeadline)
            }
            icon="calendar_today"
          />
          <MetricCard label="Progress" value={`${progress}%`} icon="speed" />
          <MetricCard label="Team members" value={String(project.teamMemberCount ?? 0)} icon="groups" />
        </div>

        <section className="bv-surface p-6">
          <h3 className="text-title-md font-semibold mb-4">Project Description</h3>
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="text-label-sm text-on-surface-variant block mb-1" htmlFor="proj-name">
                  Name
                </label>
                <input
                  id="proj-name"
                  {...form.register('name')}
                  onKeyDown={(e) => handleEnterAdvance(e)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface text-on-background focus:outline-none focus:ring-2 focus:ring-secondary"
                />
                {form.formState.errors.name && (
                  <p className="text-body-sm text-error mt-1">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div>
                <label className="text-label-sm text-on-surface-variant block mb-1" htmlFor="proj-desc">
                  Description
                </label>
                <textarea
                  id="proj-desc"
                  rows={5}
                  {...form.register('description')}
                  onKeyDown={(e) => handleEnterAdvance(e)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface text-on-background focus:outline-none focus:ring-2 focus:ring-secondary resize-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-label-sm text-on-surface-variant block mb-1">Start date</label>
                  <input
                    type="date"
                    {...form.register('startDate')}
                    className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface"
                  />
                </div>
                <div>
                  <label className="text-label-sm text-on-surface-variant block mb-1">Target end date</label>
                  <input
                    type="date"
                    {...form.register('endDate')}
                    className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface"
                  />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-body-md text-on-surface-variant leading-relaxed">
              {project.description || 'No description provided.'}
            </p>
          )}
        </section>

        <section className="bv-surface p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="text-title-md font-semibold">Assigned Team</h3>
            <Can action={Action.UPDATE} resource="project">
              {!changingTeam && (
                <Button type="button" variant="outline" size="sm" onClick={() => setChangingTeam(true)}>
                  {hasTeam ? 'Change team' : 'Assign team'}
                </Button>
              )}
            </Can>
          </div>

          {changingTeam ? (
            <div className="space-y-3">
              <EntitySearch
                label="Select team"
                placeholder="Search teams…"
                options={teamOptions}
                value={selectedTeam}
                onChange={setSelectedTeam}
              />
              {teamAssignError && (
                <p className="text-body-sm text-error" role="alert">
                  {teamAssignError}
                </p>
              )}
              <div className="flex gap-2">
                <Can action={Action.UPDATE} resource="project">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    disabled={!selectedTeam || isAssigningTeam}
                    isLoading={isAssigningTeam}
                    onClick={() => {
                      if (!selectedTeam) return
                      void assignTeam(Number(selectedTeam.id))
                    }}
                  >
                    Assign
                  </Button>
                </Can>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isAssigningTeam}
                  onClick={() => setChangingTeam(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : hasTeam ? (
            <div className="flex items-center gap-4 p-4 border border-outline-variant rounded-lg bg-surface-container-low">
              <div className="w-12 h-12 rounded-lg bg-secondary/15 text-secondary flex items-center justify-center">
                <span className="material-symbols-outlined">engineering</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-on-surface">{project.teamName ?? 'Team'}</h4>
                <p className="text-xs text-on-surface-variant">
                  {project.teamMemberCount ?? 0} members
                  {project.teamHeadName ? ` · Head: ${project.teamHeadName}` : ''}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-body-sm text-on-surface-variant">No team assigned to this project.</p>
          )}
        </section>

        <section className="bv-surface p-6">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h3 className="text-title-md font-semibold">Repository</h3>
            {repoHref && (
              <a href={repoHref} target="_blank" rel="noreferrer" className="inline-flex">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  leftIcon={<span className="material-symbols-outlined text-lg">open_in_new</span>}
                >
                  Open in GitHub
                </Button>
              </a>
            )}
          </div>
          {isEditing ? (
            <div>
              <label className="text-label-sm block mb-1">Repository reference / URL</label>
              <input
                {...form.register('repositoryUrl')}
                className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface"
                placeholder="https://github.com/org/repo or org/repo"
              />
            </div>
          ) : project.repositoryUrl ? (
            <p className="text-sm text-on-surface break-all">{project.repositoryUrl}</p>
          ) : (
            <p className="text-body-sm text-on-surface-variant">No repository linked.</p>
          )}
        </section>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl bg-primary text-on-primary p-5">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-on-primary/60 mb-3">Client</h4>
          <p className="font-bold text-lg">{project.clientName ?? '—'}</p>
        </div>
        <section className="bv-surface p-5 space-y-3">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Key Dates</h4>
          <div className="flex justify-between text-sm">
            <span className="text-on-surface-variant">Start</span>
            <span className="font-semibold">{formatProjectDate(project.startDate)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-on-surface-variant">Target End</span>
            <span className="font-semibold">{formatProjectDate(project.endDate)}</span>
          </div>
          {project.createdAt && (
            <div className="flex justify-between text-sm">
              <span className="text-on-surface-variant">Created</span>
              <span className="font-semibold">{formatProjectDate(project.createdAt)}</span>
            </div>
          )}
          {project.updatedAt && (
            <div className="flex justify-between text-sm">
              <span className="text-on-surface-variant">Updated</span>
              <span className="font-semibold">{formatProjectDate(project.updatedAt)}</span>
            </div>
          )}
        </section>
        <ActivityFeed
          title="Recent Activity"
          items={activityItems}
          variant="compact"
          framed
          emptyMessage="No recent activity"
          emptyHint="Project updates and audit events will show here."
        />
        <StatusTimelineCard status={project.status} />
      </div>
    </div>
  )
}
