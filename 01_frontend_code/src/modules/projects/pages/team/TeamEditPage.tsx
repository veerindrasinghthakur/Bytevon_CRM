import { useNavigate, useParams } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { BackButton } from '@/shared/components/layout/BackButton'
import { Button } from '@/shared/components/ui/Button'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { useTeamDetail } from '../../hooks/team/use-team-detail'
import { useUpdateTeam } from '../../hooks/team/use-teams'
import { projectRoutes } from '../../routes'

const schema = z.object({
  name: z.string().min(1, 'Team name is required'),
  description: z.string().optional().or(z.literal('')),
  department: z.string().optional().or(z.literal('')),
  headName: z.string().optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'INACTIVE']),
})
type FormValues = z.infer<typeof schema>

export function TeamEditPage() {
  const { teamId } = useParams({ strict: false }) as { teamId: string }
  const navigate = useNavigate()
  const { team, isLoading, isError, refetch } = useTeamDetail(teamId)
  const update = useUpdateTeam()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: team
      ? {
          name: team.name,
          description: team.description ?? team.mission ?? '',
          department: team.department,
          headName: team.headName,
          status: team.status === 'Active' ? 'ACTIVE' : 'INACTIVE',
        }
      : undefined,
  })

  if (isLoading) return <PageLoadingSkeleton />
  if (isError || !team) {
    return <ErrorState title="Could not load team" onRetry={() => void refetch()} />
  }

  const onSubmit = form.handleSubmit(async (data) => {
    await update.mutateAsync({
      id: Number(team.id),
      patch: {
        name: data.name,
        description: data.description,
        department: data.department,
        headName: data.headName,
        status: data.status,
      },
    })
    safeNavigate(navigate, { to: projectRoutes.teamDetailPath, params: { teamId: team.id } })
  })

  return (
    <div className="space-y-6 max-w-3xl animate-fade-in">
      <div>
        <BackButton to={projectRoutes.teamDetail(team.id)} label="Back to team" />
        <h1 className="text-headline-xl font-bold mt-2">Edit Team</h1>
      </div>
      <form className="bv-surface p-6 space-y-4" onSubmit={onSubmit}>
        <label className="block text-body-sm">
          <span className="text-on-surface-variant">Team name</span>
          <input {...form.register('name')} className="mt-1 w-full border border-outline-variant rounded-lg px-3 py-2" />
        </label>
        <label className="block text-body-sm">
          <span className="text-on-surface-variant">Description</span>
          <textarea {...form.register('description')} rows={3} className="mt-1 w-full border border-outline-variant rounded-lg px-3 py-2 resize-none" />
        </label>
        <label className="block text-body-sm">
          <span className="text-on-surface-variant">Department</span>
          <input {...form.register('department')} className="mt-1 w-full border border-outline-variant rounded-lg px-3 py-2" />
        </label>
        <label className="block text-body-sm">
          <span className="text-on-surface-variant">Team head</span>
          <input {...form.register('headName')} className="mt-1 w-full border border-outline-variant rounded-lg px-3 py-2" />
        </label>
        <label className="block text-body-sm">
          <span className="text-on-surface-variant">Status</span>
          <select
            value={form.watch('status')}
            onChange={(e) => form.setValue('status', e.target.value as FormValues['status'])}
            className="mt-1 w-full border border-outline-variant rounded-lg px-3 py-2"
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => safeNavigate(navigate, { to: projectRoutes.teamDetailPath, params: { teamId: team.id } })}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={update.isPending}>Save</Button>
        </div>
      </form>
    </div>
  )
}
