import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useNavigate, useSearch } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { Skeleton } from '@/shared/components/feedback/Skeleton'
import { useProject, useUpdateProject } from '../hooks/use-projects'
import { useTasks } from '../hooks/use-tasks'
import { ProjectStatusBadge } from '../components/ProjectStatusBadge'
import { TaskStatusBadge, TaskPriorityLabel } from '../components/TaskStatusBadge'
import { handleEnterAdvance } from '@/shared/lib/enter-advance'
import { cn } from '@/shared/lib/cn'
import type { ProjectStatus } from '../schemas/project'
import type { TaskStatus } from '../api/tasks'

type TabId = 'overview' | 'tasks' | 'team' | 'timeline' | 'documents' | 'repository'

const TABS: { id: TabId; label: string; icon?: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'team', label: 'Team' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'documents', label: 'Documents' },
  { id: 'repository', label: 'Repository' },
]

const STATUS_TIMELINE: ProjectStatus[] = [
  'PLANNING',
  'IN_PROGRESS',
  'ON_HOLD',
  'COMPLETED',
  'CANCELLED',
]

const MOCK_DOCS = [
  { id: 1, name: 'PRD Document', type: 'Confluence', icon: 'description' },
  { id: 2, name: 'Architecture Review', type: 'PDF', icon: 'picture_as_pdf' },
  { id: 3, name: 'API Spec v2', type: 'OpenAPI', icon: 'api' },
]

const MOCK_TEAM = {
  name: 'Alpha Engineering',
  members: 8,
  lead: 'Sarah Jenkins',
  role: 'Cross-functional',
}

const MOCK_ACTIVITY = [
  { title: 'Architecture Review Completed', body: 'Lead approved the final draft.', time: '2 hours ago', icon: 'check_circle' },
  { title: 'Task Fixed', body: 'Authentication bug in staging resolved.', time: 'Yesterday', icon: 'bug_report' },
  { title: 'Code Merged to Main', body: 'PR — Caching layer implementation.', time: 'Oct 24', icon: 'commit' },
]

export function ProjectDetailPage() {
  const navigate = useNavigate()
  const params = useParams({ strict: false }) as { projectId?: string }
  const search = useSearch({ strict: false }) as { edit?: string; tab?: string }
  const id = Number(params.projectId)
  const { data: project, isLoading, isError, refetch } = useProject(
    Number.isFinite(id) ? id : undefined
  )
  const { data: tasksData, isLoading: tasksLoading } = useTasks(
    Number.isFinite(id) ? { projectId: id } : undefined
  )
  const updateMutation = useUpdateProject()

  const initialTab = (TABS.find((t) => t.id === search.tab)?.id ?? 'overview') as TabId
  const [tab, setTab] = useState<TabId>(initialTab)
  const [taskStatusFilter, setTaskStatusFilter] = useState('')
  const [taskSearch, setTaskSearch] = useState('')

  const [editing, setEditing] = useState(search.edit === '1')
  const [draft, setDraft] = useState({
    name: '',
    description: '',
    clientName: '',
    repositoryUrl: '',
  })

  useEffect(() => {
    if (project) {
      setDraft({
        name: project.name,
        description: project.description ?? '',
        clientName: project.clientName ?? '',
        repositoryUrl: project.repositoryUrl ?? '',
      })
      setEditing(search.edit === '1')
    }
  }, [project, search.edit])

  useEffect(() => {
    if (search.tab && TABS.some((t) => t.id === search.tab)) {
      setTab(search.tab as TabId)
    }
  }, [search.tab])

  const tasks = tasksData?.items ?? []
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (taskStatusFilter && t.status !== taskStatusFilter) return false
      if (taskSearch) {
        const q = taskSearch.toLowerCase()
        if (!t.title.toLowerCase().includes(q) && !(t.assigneeName ?? '').toLowerCase().includes(q))
          return false
      }
      return true
    })
  }, [tasks, taskStatusFilter, taskSearch])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (isError || !project) {
    return (
      <div className="text-center py-16">
        <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-4">folder_off</span>
        <h2 className="text-title-lg text-on-background mb-2">Project not found</h2>
        <Link to="/projects">
          <Button variant="outline">Back to Projects</Button>
        </Link>
      </div>
    )
  }

  const progress = project.progress ?? 0
  const openTasks = tasks.filter((t) => t.status !== 'DONE').length
  const daysToDeadline = project.endDate
    ? Math.max(0, Math.ceil((new Date(project.endDate).getTime() - Date.now()) / 86400000))
    : null

  const startEdit = () => {
    setDraft({
      name: project.name,
      description: project.description ?? '',
      clientName: project.clientName ?? '',
      repositoryUrl: project.repositoryUrl ?? '',
    })
    setEditing(true)
  }

  const saveEdit = () => {
    updateMutation.mutate(
      {
        id: project.id,
        patch: {
          name: draft.name,
          description: draft.description,
          clientName: draft.clientName,
          repositoryUrl: draft.repositoryUrl || null,
        },
      },
      { onSuccess: () => setEditing(false) }
    )
  }

  const selectTab = (id: TabId) => {
    setTab(id)
    navigate({
      to: '/projects/$projectId',
      params: { projectId: String(project.id) },
      search: { tab: id } as never,
      replace: true,
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={editing ? draft.name || project.name : project.name}
        description={project.code}
        showBack
        backTo="/projects"
        backLabel="Back to projects"
        breadcrumbs={
          <nav className="text-body-sm text-on-surface-variant">
            <Link to="/projects" className="hover:text-secondary">
              Projects
            </Link>
            <span className="mx-2">/</span>
            <span className="text-on-surface">{project.name}</span>
          </nav>
        }
        actions={
          editing ? (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={saveEdit} isLoading={updateMutation.isPending}>
                Save
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <ProjectStatusBadge status={project.status} />
              <Button
                variant="outline"
                size="sm"
                leftIcon={<span className="material-symbols-outlined text-lg">edit</span>}
                onClick={startEdit}
              >
                Edit Project
              </Button>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<span className="material-symbols-outlined text-lg">group</span>}
                onClick={() => selectTab('team')}
              >
                Manage Team
              </Button>
            </div>
          )
        }
      />

      {/* Progress strip */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-on-surface-variant">Progress: {progress}%</span>
        <div className="w-40 h-1.5 bg-surface-container rounded-full overflow-hidden">
          <div className="bg-secondary h-full rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-outline-variant">
        <nav className="flex flex-wrap gap-1 -mb-px">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => selectTab(t.id)}
              className={cn(
                'px-4 py-3 text-sm font-semibold border-b-2 transition-colors',
                tab === t.id
                  ? 'border-secondary text-secondary'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              )}
            >
              {t.label}
              {t.id === 'tasks' && tasks.length > 0 && (
                <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant">
                  {tasks.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard label="Open Tasks" value={String(openTasks)} icon="format_list_bulleted" />
              <MetricCard
                label="Days to Deadline"
                value={daysToDeadline != null ? String(daysToDeadline) : '—'}
                icon="calendar_today"
              />
              <MetricCard label="Progress" value={`${progress}%`} icon="speed" />
              <MetricCard label="Teams" value={String(project.teamCount ?? 0)} icon="groups" />
            </div>

            <section className="bv-surface p-6">
              <h3 className="text-title-md font-semibold mb-4">Project Description</h3>
              {editing ? (
                <textarea
                  rows={5}
                  value={draft.description}
                  onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                  onKeyDown={(e) => handleEnterAdvance(e)}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface text-on-background focus:outline-none focus:ring-2 focus:ring-secondary resize-none"
                />
              ) : (
                <p className="text-body-md text-on-surface-variant leading-relaxed">
                  {project.description || 'No description provided.'}
                </p>
              )}
            </section>

            <section className="bv-surface p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-title-md font-semibold">Assigned Team</h3>
                <button type="button" className="text-sm font-semibold text-secondary hover:underline" onClick={() => selectTab('team')}>
                  View All
                </button>
              </div>
              <div className="flex items-center gap-4 p-4 border border-outline-variant rounded-lg bg-surface-container-low">
                <div className="w-12 h-12 rounded-lg bg-secondary/15 text-secondary flex items-center justify-center">
                  <span className="material-symbols-outlined">engineering</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-on-surface">{MOCK_TEAM.name}</h4>
                  <p className="text-xs text-on-surface-variant">
                    {MOCK_TEAM.members} Members · {MOCK_TEAM.role}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-on-surface-variant">Lead</p>
                  <p className="text-sm font-semibold">{MOCK_TEAM.lead}</p>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl bg-on-background text-white p-5">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-white/60 mb-3">Client</h4>
              <p className="font-bold text-lg">{project.clientName ?? '—'}</p>
              {editing && (
                <input
                  value={draft.clientName}
                  onChange={(e) => setDraft((d) => ({ ...d, clientName: e.target.value }))}
                  className="mt-2 w-full px-2 py-1 rounded text-on-background text-sm"
                />
              )}
            </div>
            <section className="bv-surface p-5 space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Key Dates</h4>
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-base">flag</span> Start
                </span>
                <span className="font-semibold">{project.startDate ?? '—'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-base">event_available</span> Target End
                </span>
                <span className="font-semibold">{project.endDate ?? '—'}</span>
              </div>
            </section>
            <section className="bv-surface p-5">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-3">Resources</h4>
              <div className="space-y-1">
                <button
                  type="button"
                  className="w-full flex items-center gap-2 p-2 rounded hover:bg-surface-container text-sm text-left"
                  onClick={() => selectTab('repository')}
                >
                  <span className="material-symbols-outlined text-on-surface-variant">code</span>
                  GitHub Repository
                </button>
                <button type="button" className="w-full flex items-center gap-2 p-2 rounded hover:bg-surface-container text-sm text-left" onClick={() => selectTab('documents')}>
                  <span className="material-symbols-outlined text-on-surface-variant">description</span>
                  Documents
                </button>
              </div>
            </section>
            <section className="bv-surface p-5">
              <h4 className="text-title-md font-semibold mb-4">Recent Activity</h4>
              <ul className="space-y-4">
                {MOCK_ACTIVITY.map((a) => (
                  <li key={a.title} className="flex gap-3">
                    <span className="w-8 h-8 rounded-full bg-secondary/15 text-secondary flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-sm">{a.icon}</span>
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{a.title}</p>
                      <p className="text-xs text-on-surface-variant">{a.body}</p>
                      <p className="text-[11px] text-on-surface-variant mt-1">{a.time}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      )}

      {tab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                search
              </span>
              <input
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
                placeholder="Search tasks..."
                className="w-full pl-10 pr-3 py-2 rounded-lg border border-outline-variant bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>
            <select
              value={taskStatusFilter}
              onChange={(e) => setTaskStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-outline-variant bg-surface text-sm"
            >
              <option value="">All statuses</option>
              {(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED', 'ON_HOLD'] as TaskStatus[]).map(
                (s) => (
                  <option key={s} value={s}>
                    {s.replace('_', ' ')}
                  </option>
                )
              )}
            </select>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<span className="material-symbols-outlined text-lg">add</span>}
              onClick={() =>
                navigate({
                  to: '/projects/tasks/new',
                  search: { projectId: String(project.id) } as never,
                })
              }
            >
              New Task
            </Button>
          </div>

          {tasksLoading && <Skeleton className="h-40 w-full" />}
          {!tasksLoading && filteredTasks.length === 0 && (
            <p className="text-center text-on-surface-variant py-12">No tasks match filters.</p>
          )}
          {!tasksLoading && filteredTasks.length > 0 && (
            <div className="bv-surface overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container-low/50">
                    <th className="px-4 py-3 text-[11px] font-bold uppercase text-on-surface-variant">Task</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase text-on-surface-variant">Priority</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase text-on-surface-variant">Status</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase text-on-surface-variant">Assignee</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase text-on-surface-variant">Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {filteredTasks.map((task) => (
                    <tr
                      key={task.id}
                      className="cursor-pointer hover:bg-surface-container-low"
                      onClick={() =>
                        navigate({ to: '/projects/tasks/$taskId', params: { taskId: String(task.id) } })
                      }
                    >
                      <td className="px-4 py-3 font-medium text-on-surface">{task.title}</td>
                      <td className="px-4 py-3">
                        <TaskPriorityLabel priority={task.priority} />
                      </td>
                      <td className="px-4 py-3">
                        <TaskStatusBadge status={task.status} />
                      </td>
                      <td className="px-4 py-3 text-sm">{task.assigneeName ?? '—'}</td>
                      <td className="px-4 py-3 text-sm">{task.dueDate ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'team' && (
        <div className="space-y-6">
          <section className="bv-surface p-6">
            <h3 className="text-title-md font-semibold mb-4">Team info</h3>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">groups</span>
              </div>
              <div>
                <p className="text-lg font-bold">{MOCK_TEAM.name}</p>
                <p className="text-sm text-on-surface-variant">
                  {MOCK_TEAM.members} members · Lead: {MOCK_TEAM.lead}
                </p>
              </div>
            </div>
          </section>
          <section className="bv-surface overflow-hidden">
            <div className="px-5 py-4 border-b border-outline-variant">
              <h3 className="font-semibold">Members</h3>
            </div>
            <ul className="divide-y divide-outline-variant">
              {[MOCK_TEAM.lead, 'Alex Chen', 'Marcus Sterling', 'Elena R.', 'Mike T.'].map((name, i) => (
                <li key={name} className="px-5 py-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-secondary/15 text-secondary flex items-center justify-center text-xs font-bold">
                    {name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{name}</p>
                    <p className="text-xs text-on-surface-variant">{i === 0 ? 'Team Lead' : 'Member'}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      {tab === 'timeline' && (
        <section className="bv-surface p-6 max-w-2xl">
          <h3 className="text-title-md font-semibold mb-6">Project status timeline</h3>
          <ol className="relative border-l-2 border-outline-variant ml-3 space-y-8">
            {STATUS_TIMELINE.map((s) => {
              const reached =
                STATUS_TIMELINE.indexOf(s) <= STATUS_TIMELINE.indexOf(project.status) &&
                project.status !== 'CANCELLED'
              const active = project.status === s
              return (
                <li key={s} className="ml-6 relative">
                  <span
                    className={cn(
                      'absolute -left-[1.9rem] top-0 w-8 h-8 rounded-full flex items-center justify-center',
                      active
                        ? 'bg-secondary text-white'
                        : reached
                          ? 'bg-secondary/20 text-secondary'
                          : 'bg-surface-container text-on-surface-variant'
                    )}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {s === 'COMPLETED' ? 'check' : s === 'CANCELLED' ? 'close' : 'radio_button_checked'}
                    </span>
                  </span>
                  <p className={cn('font-semibold', active && 'text-secondary')}>{s.replace('_', ' ')}</p>
                  {active && <p className="text-xs text-on-surface-variant mt-1">Current status</p>}
                </li>
              )
            })}
          </ol>
        </section>
      )}

      {tab === 'documents' && (
        <section className="bv-surface overflow-hidden">
          <div className="px-5 py-4 border-b border-outline-variant flex justify-between">
            <h3 className="font-semibold">Project documents</h3>
            <Button variant="outline" size="sm">
              Upload
            </Button>
          </div>
          <ul className="divide-y divide-outline-variant">
            {MOCK_DOCS.map((d) => (
              <li key={d.id} className="px-5 py-4 flex items-center gap-3 hover:bg-surface-container-low">
                <span className="material-symbols-outlined text-secondary">{d.icon}</span>
                <div className="flex-1">
                  <p className="font-medium text-sm">{d.name}</p>
                  <p className="text-xs text-on-surface-variant">{d.type}</p>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant">open_in_new</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === 'repository' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <section className="bv-surface p-6">
              <div className="flex items-center gap-4 mb-6 pb-4 border-b border-outline-variant">
                <div className="w-12 h-12 rounded-lg bg-[#24292e] text-white flex items-center justify-center">
                  <span className="material-symbols-outlined">code</span>
                </div>
                <div>
                  <h3 className="text-title-md font-semibold">
                    {project.repositoryUrl
                      ? project.repositoryUrl.replace(/^https?:\/\/(github\.com\/)?/, '')
                      : `${project.code?.toLowerCase() ?? 'project'}-core`}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Connected
                    </span>
                    <span className="text-xs text-on-surface-variant">Last sync: mock</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant">Remote URL</label>
                  <div className="mt-1 flex items-center gap-2 p-2 rounded-lg bg-surface-container-low border border-outline-variant font-mono text-sm">
                    <span className="material-symbols-outlined text-base text-on-surface-variant">link</span>
                    <span className="truncate flex-1">
                      {project.repositoryUrl || 'git@github.com:bytevon/project.git'}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant">Default Branch</label>
                  <div className="mt-1 flex items-center gap-2 p-2 rounded-lg bg-surface-container-low border border-outline-variant font-mono text-sm">
                    <span className="material-symbols-outlined text-base text-on-surface-variant">call_split</span>
                    main
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-container">Protected</span>
                  </div>
                </div>
              </div>
              {editing && (
                <div className="mt-4">
                  <label className="text-xs font-semibold text-on-surface-variant">Edit repository URL</label>
                  <input
                    value={draft.repositoryUrl}
                    onChange={(e) => setDraft((d) => ({ ...d, repositoryUrl: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-outline-variant font-mono text-sm"
                  />
                </div>
              )}
            </section>
            <section className="bv-surface p-6">
              <h3 className="font-semibold mb-4">Recent commits</h3>
              <p className="text-sm text-on-surface-variant">Mock commit history for documentation UI.</p>
              <ul className="mt-4 space-y-3">
                {[
                  { hash: 'a7f9b2c', msg: 'fix: resolve race condition in worker pool', author: 'Sarah J.' },
                  { hash: 'e4d1a88', msg: 'feat: implement oauth2 token refresh', author: 'Mike K.' },
                  { hash: '3c2b19f', msg: 'docs: update API schema definitions', author: 'Alex L.' },
                ].map((c) => (
                  <li key={c.hash} className="flex gap-3 text-sm border-b border-outline-variant/50 pb-3">
                    <span className="font-mono text-xs text-secondary bg-secondary/10 px-1.5 py-0.5 rounded h-fit">
                      {c.hash}
                    </span>
                    <div>
                      <p className="font-medium">{c.msg}</p>
                      <p className="text-xs text-on-surface-variant">{c.author}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
          <div className="space-y-4">
            <section className="bv-surface p-5">
              <h3 className="font-semibold mb-3">Development resources</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 p-2 rounded border border-outline-variant text-sm">
                  <span className="material-symbols-outlined text-orange-500">rocket_launch</span> CI/CD Pipeline
                </li>
                <li className="flex items-center gap-2 p-2 rounded border border-outline-variant text-sm">
                  <span className="material-symbols-outlined text-secondary">menu_book</span> API Documentation
                </li>
              </ul>
            </section>
            <section className="bv-surface p-5">
              <h3 className="font-semibold mb-3">Stats</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 rounded-lg bg-surface-container-low">
                  <p className="text-2xl font-bold text-secondary">12</p>
                  <p className="text-[10px] uppercase text-on-surface-variant">Open PRs</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-surface-container-low">
                  <p className="text-2xl font-bold">8</p>
                  <p className="text-[10px] uppercase text-on-surface-variant">Issues</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  )
}

function MetricCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bv-surface card-hover p-4 flex flex-col justify-between min-h-[100px]">
      <div className="flex justify-between items-start">
        <span className="text-xs text-on-surface-variant">{label}</span>
        <span className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
          <span className="material-symbols-outlined text-lg">{icon}</span>
        </span>
      </div>
      <p className="text-2xl font-bold text-on-background mt-2">{value}</p>
    </div>
  )
}
