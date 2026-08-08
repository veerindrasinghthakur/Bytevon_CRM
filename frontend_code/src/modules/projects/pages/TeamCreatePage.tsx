import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { useCreateTeam } from '../hooks/use-teams'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(120),
  description: z.string().max(500).optional(),
})

type FormValues = z.infer<typeof schema>

export function TeamCreatePage() {
  const navigate = useNavigate()
  const createMutation = useCreateTeam()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '' },
  })

  const onSubmit = async (data: FormValues) => {
    try {
      await createMutation.mutateAsync(data)
      navigate({ to: '/projects/teams' })
    } catch {
      // mutation error shown below
    }
  }

  return (
    <div>
      <PageHeader
        title="New Team"
        breadcrumbs={
          <nav className="text-body-sm text-on-surface-variant">
            <Link to="/projects/teams" className="hover:text-electric-blue">Teams</Link>
            <span className="mx-2">/</span>
            <span className="text-on-surface">New</span>
          </nav>
        }
      />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-w-xl space-y-5 rounded-xl border border-outline-variant bg-surface-container-lowest p-6"
      >
        <div>
          <label className="block text-label-md text-on-surface mb-1.5" htmlFor="name">
            Team name <span className="text-error">*</span>
          </label>
          <input
            id="name"
            {...register('name')}
            className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-body-md text-on-surface outline-none focus:border-electric-blue focus:border-2"
            placeholder="e.g. Alpha Engineering"
          />
          {errors.name && <p className="mt-1 text-body-sm text-error">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-label-md text-on-surface mb-1.5" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            {...register('description')}
            className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-body-md text-on-surface outline-none focus:border-electric-blue focus:border-2 resize-y"
            placeholder="Brief description"
          />
        </div>

        {createMutation.isError && (
          <p className="text-body-sm text-error">Failed to create team. Please try again.</p>
        )}

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" variant="primary" isLoading={isSubmitting || createMutation.isPending}>
            Create Team
          </Button>
          <Button type="button" variant="ghost" onClick={() => navigate({ to: '/projects/teams' })}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
