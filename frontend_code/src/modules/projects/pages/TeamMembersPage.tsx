import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { Skeleton } from '@/shared/components/feedback/Skeleton'
import { useTeam } from '../hooks/use-teams'

const MOCK_MEMBERS = [
  { id: '1', name: 'Sarah Chen', role: 'Tech Lead', status: 'Active' },
  { id: '2', name: 'Jordan Lee', role: 'Senior Engineer', status: 'Active' },
  { id: '3', name: 'Priya Sharma', role: 'Engineer', status: 'Active' },
  { id: '4', name: 'Marcus Thorne', role: 'QA', status: 'Active' },
]

export function ProjectTeamMembersPage() {
  const params = useParams({ strict: false }) as { teamId?: string }
  const navigate = useNavigate()
  const id = Number(params.teamId)
  const { data: team, isLoading } = useTeam(Number.isFinite(id) ? id : undefined)

  if (isLoading || !team) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${team.name} · Members`}
        description="Team roster"
        showBack
        backTo={`/projects/teams/${team.id}`}
        actions={
          <Button
            variant="primary"
            leftIcon={<span className="material-symbols-outlined">person_add</span>}
            onClick={() =>
              navigate({
                to: '/projects/teams/$teamId/add-member',
                params: { teamId: String(team.id) },
              })
            }
          >
            Add Member
          </Button>
        }
      />

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-subtle overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-container-low/50 border-b border-outline-variant">
              <th className="px-6 py-3 text-label-sm font-medium text-on-surface-variant uppercase">
                Member
              </th>
              <th className="px-6 py-3 text-label-sm font-medium text-on-surface-variant uppercase">
                Role
              </th>
              <th className="px-6 py-3 text-label-sm font-medium text-on-surface-variant uppercase">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30">
            {MOCK_MEMBERS.map((m) => (
              <tr key={m.id} className="hover:bg-surface-container-low/40">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-xs font-bold">
                      {m.name
                        .split(' ')
                        .map((p) => p[0])
                        .join('')
                        .slice(0, 2)}
                    </div>
                    <span className="font-semibold text-body-sm">{m.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-body-sm">{m.role}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {m.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-caption text-on-surface-variant">
        <Link to="/projects/teams/$teamId" params={{ teamId: String(team.id) }} className="text-secondary hover:underline">
          Back to team
        </Link>
      </p>
    </div>
  )
}
