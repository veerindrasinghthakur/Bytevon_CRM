import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, Link } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { createProjectSchema, type CreateProjectInput } from '../schemas/project'
import { useCreateProject } from '../hooks/use-projects'

export function ProjectCreatePage() {
  const navigate = useNavigate()
  const createMutation = useCreateProject()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      clientName: '',
      repositoryUrl: '',
    },
  })

  const onSubmit = async (data: CreateProjectInput) => {
    try {
      const project = await createMutation.mutateAsync(data)
      navigate({ to: '/projects/$projectId', params: { projectId: String(project.id) } })
    } catch {
      // Error handled by mutation state
    }
  }

  return (
    <div>
      <PageHeader
        title="New Project"
        breadcrumbs={
          <nav className="text-body-sm text-on-surface-variant">
            <Link to="/projects" className="hover:text-electric-blue">Projects</Link>
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
            Project name <span className="text-error">*</span>
          </label>
          <input
            id="name"
            {...register('name')}
            className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-body-md text-on-surface outline-none focus:border-electric-blue focus:border-2"
            placeholder="e.g. Client Portal"
          />
          {errors.name && (
            <p className="mt-1 text-body-sm text-error">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-label-md text-on-surface mb-1.5" htmlFor="code">
            Code
          </label>
          <input
            id="code"
            {...register('code')}
            className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-body-md text-on-surface outline-none focus:border-electric-blue focus:border-2"
            placeholder="e.g. BV-PORTAL"
          />
        </div>

        <div>
          <label className="block text-label-md text-on-surface mb-1.5" htmlFor="clientName">
            Client
          </label>
          <input
            id="clientName"
            {...register('clientName')}
            className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-body-md text-on-surface outline-none focus:border-electric-blue focus:border-2"
            placeholder="Client name"
          />
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

        <div>
          <label className="block text-label-md text-on-surface mb-1.5" htmlFor="repositoryUrl">
            Repository URL
          </label>
          <input
            id="repositoryUrl"
            type="url"
            {...register('repositoryUrl')}
            className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-body-md text-on-surface outline-none focus:border-electric-blue focus:border-2"
            placeholder="https://github.com/..."
          />
          {errors.repositoryUrl && (
            <p className="mt-1 text-body-sm text-error">{errors.repositoryUrl.message}</p>
          )}
        </div>

        {createMutation.isError && (
          <p className="text-body-sm text-error">Failed to create project. Please try again.</p>
        )}

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" variant="primary" isLoading={isSubmitting || createMutation.isPending}>
            Create Project
          </Button>
          <Button type="button" variant="ghost" onClick={() => navigate({ to: '/projects' })}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}