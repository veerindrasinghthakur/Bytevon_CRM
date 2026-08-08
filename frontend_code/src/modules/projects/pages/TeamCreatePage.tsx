import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from '@tanstack/react-router'
import { Button } from '@/shared/components/ui/Button'
import { BackButton } from '@/shared/components/layout/BackButton'
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
      // shown below
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-4">
        <BackButton to="/projects/teams" label="Back to teams" />
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-outline-variant flex justify-between items-center bg-surface">
          <div>
            <h2 className="text-headline-lg font-semibold text-on-surface">Create New Team</h2>
            <p className="text-body-md text-on-surface-variant mt-1">
              Define team identity and assign members.
            </p>
          </div>
          <Link
            to="/projects/teams"
            className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-full p-2"
          >
            <span className="material-symbols-outlined">close</span>
          </Link>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6 space-y-8 bg-background">
            <section>
              <h3 className="text-headline-md font-semibold text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-electric-blue">badge</span>
                Team Identity
              </h3>
              <div className="space-y-4 bg-surface-container-lowest p-5 rounded-lg border border-outline-variant">
                <div className="space-y-1">
                  <label className="text-label-sm text-on-surface block" htmlFor="name">
                    Team Name <span className="text-error">*</span>
                  </label>
                  <input
                    id="name"
                    {...register('name')}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-2 text-on-surface text-body-md focus:border-electric-blue focus:ring-1 focus:ring-electric-blue outline-none"
                    placeholder="e.g., DevOps Team"
                  />
                  {errors.name && <p className="text-body-sm text-error">{errors.name.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-label-sm text-on-surface block" htmlFor="description">
                    Description
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    {...register('description')}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-2 text-on-surface text-body-md focus:border-electric-blue focus:ring-1 focus:ring-electric-blue outline-none resize-none"
                    placeholder="e.g., Responsible for infrastructure and CI/CD pipelines"
                  />
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-headline-md font-semibold text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-electric-blue">star</span>
                Leadership
              </h3>
              <div className="bg-surface-container-lowest p-5 rounded-lg border border-outline-variant">
                <label className="text-label-sm text-on-surface block mb-1">Assign Team Head</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                    search
                  </span>
                  <input
                    type="text"
                    disabled
                    className="w-full pl-10 pr-4 py-2 bg-surface-container border border-outline-variant rounded-md text-on-surface-variant text-body-md cursor-not-allowed"
                    placeholder="Search employees by name... (connect API later)"
                  />
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-headline-md font-semibold text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-electric-blue">group_add</span>
                Team Composition
              </h3>
              <div className="bg-surface-container-lowest p-5 rounded-lg border border-outline-variant">
                <label className="text-label-sm text-on-surface block mb-1">Add Members</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                    person_search
                  </span>
                  <input
                    type="text"
                    disabled
                    className="w-full pl-10 pr-4 py-2 bg-surface-container border border-outline-variant rounded-md text-on-surface-variant text-body-md cursor-not-allowed"
                    placeholder="Search employees... (connect API later)"
                  />
                </div>
              </div>
            </section>

            {createMutation.isError && (
              <p className="text-body-sm text-error">Failed to create team. Please try again.</p>
            )}
          </div>

          <div className="px-6 py-4 border-t border-outline-variant bg-surface flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate({ to: '/projects/teams' })}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting || createMutation.isPending}>
              Create Team
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
