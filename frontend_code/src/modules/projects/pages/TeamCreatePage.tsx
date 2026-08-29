import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link, useSearch } from '@tanstack/react-router'
import { Button } from '@/shared/components/ui/Button'
import { BackButton } from '@/shared/components/layout/BackButton'
import { EntitySearch, type EntityOption } from '@/shared/components/forms/EntitySearch'
import { useCreateTeam } from '../hooks/use-teams'
import { useProject } from '../hooks/use-projects'
import { projectRoutes } from '../routes'
import { getDb } from '@/shared/mock/db'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(120),
  description: z.string().max(500).optional(),
  head: z.custom<EntityOption | null>().optional(),
  members: z.array(z.custom<EntityOption>()).optional(),
})

type FormValues = z.infer<typeof schema>

export function TeamCreatePage() {
  const navigate = useNavigate()
  const search = useSearch({ strict: false }) as {
    projectId?: string
    returnTo?: string
  }
  const projectId = search.projectId ? Number(search.projectId) : undefined
  const { data: project } = useProject(
    projectId != null && Number.isFinite(projectId) ? projectId : undefined
  )

  const employeeOptions: EntityOption[] = useMemo(
    () =>
      getDb().employees.map((e) => ({
        id: e.id,
        label: e.fullName,
        sublabel: [e.role, e.department].filter(Boolean).join(' · '),
      })),
    []
  )

  const createMutation = useCreateTeam()
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '', head: null, members: [] },
  })

  const head = watch('head')
  const members = watch('members')

  const backTo =
    search.returnTo ||
    (projectId && Number.isFinite(projectId)
      ? projectRoutes.projectDetail(projectId)
      : projectRoutes.teams)

  const onSubmit = async (data: FormValues) => {
    try {
      await createMutation.mutateAsync({
        name: data.name,
        description: data.description,
        headName: data.head?.label,
        headRole: data.head?.sublabel?.split(' · ')[0],
        memberNames: data.members?.map((m) => m.label) ?? [],
        projectId: projectId && Number.isFinite(projectId) ? projectId : undefined,
        projectName: project?.name,
      })
      if (search.returnTo) {
        navigate({ to: search.returnTo as '/projects/new' })
      } else if (projectId && Number.isFinite(projectId)) {
        navigate({ to: projectRoutes.projectDetail(projectId), params: { projectId: String(projectId) } })
      } else {
        navigate({ to: projectRoutes.teams })
      }
    } catch {
      // mutation error UI
    }
  }

  const handleHeadChange = (value: EntityOption | null) => {
    setValue('head', value)
  }

  const handleMembersChange = (value: EntityOption[]) => {
    setValue('members', value)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-4">
        <BackButton
          to={backTo}
          label={project ? `Back to ${project.name}` : 'Back to teams'}
        />
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-outline-variant flex justify-between items-center bg-surface">
          <div>
            <h2 className="text-headline-lg font-semibold text-on-surface">Create New Team</h2>
            <p className="text-body-md text-on-surface-variant mt-1">
              {project
                ? `Will be assigned to project: ${project.name}`
                : 'Define team identity and assign members.'}
            </p>
          </div>
          <Link
            to={backTo as '/projects/teams'}
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
                <EntitySearch
                  label="Assign Team Head"
                  placeholder="Search employees by name or role…"
                  options={employeeOptions}
                  value={head}
                  onChange={handleHeadChange}
                  emptyMessage="No employees match your search"
                />
              </div>
            </section>

            <section>
              <h3 className="text-headline-md font-semibold text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-electric-blue">group_add</span>
                Team Composition
              </h3>
              <div className="bg-surface-container-lowest p-5 rounded-lg border border-outline-variant">
                <EntitySearch
                  label="Add Members"
                  placeholder="Search and add employees…"
                  options={employeeOptions.filter((o) => String(o.id) !== String(head?.id ?? ''))}
                  multi
                  values={members}
                  onChangeMulti={handleMembersChange}
                  emptyMessage="No employees match your search"
                />
              </div>
            </section>

            {createMutation.isError && (
              <p className="text-body-sm text-error">Failed to create team. Please try again.</p>
            )}
          </div>

          <div className="px-6 py-4 border-t border-outline-variant bg-surface flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate({ to: backTo as '/projects/teams' })}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting || createMutation.isPending}>
              {project ? 'Create & assign to project' : 'Create Team'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}