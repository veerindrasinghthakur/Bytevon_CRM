import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, Link } from '@tanstack/react-router'
import { Button } from '@/shared/components/ui/Button'
import { BackButton } from '@/shared/components/layout/BackButton'
import { createProjectSchema, type CreateProjectInput } from '../schemas/project'
import { useCreateProject } from '../hooks/use-projects'
import { handleEnterAdvance } from '@/shared/lib/enter-advance'

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
      // mutation state
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-4">
        <BackButton to="/projects" label="Back to projects" />
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-outline-variant bg-surface">
          <div>
            <h2 className="text-xl font-bold text-on-background">Create New Project</h2>
            <p className="text-sm text-on-surface-variant mt-1">
              Configure workspace, team allocation, and repository details.
            </p>
          </div>
          <Link
            to="/projects"
            className="text-on-surface-variant hover:text-error p-1 rounded-md hover:bg-surface-container"
          >
            <span className="material-symbols-outlined">close</span>
          </Link>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6 space-y-8 bg-background/50">
            <section>
              <h3 className="text-sm font-semibold text-on-background uppercase tracking-wider mb-4 border-b border-outline-variant pb-2">
                Core Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-on-background" htmlFor="name">
                    Project Name <span className="text-error">*</span>
                  </label>
                  <input
                    id="name"
                    {...register('name')}
                    onKeyDown={(e) => handleEnterAdvance(e)}
                    className="w-full px-4 py-2.5 border border-outline-variant rounded-lg focus:ring-2 focus:ring-electric-blue focus:border-electric-blue outline-none bg-surface-container-lowest text-on-background"
                    placeholder="e.g., Nexus Platform Migration"
                  />
                  {errors.name && <p className="text-body-sm text-error">{errors.name.message}</p>}
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-on-background" htmlFor="clientName">
                    Client
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                      search
                    </span>
                    <input
                      id="clientName"
                      {...register('clientName')}
                      onKeyDown={(e) => handleEnterAdvance(e)}
                      className="w-full pl-10 pr-4 py-2.5 border border-outline-variant rounded-lg focus:ring-2 focus:ring-electric-blue focus:border-electric-blue outline-none bg-surface-container-lowest text-on-background"
                      placeholder="Search and select client..."
                    />
                  </div>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-on-background" htmlFor="description">
                    Project Description
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    {...register('description')}
                    onKeyDown={(e) => handleEnterAdvance(e)}
                    className="w-full px-4 py-2.5 border border-outline-variant rounded-lg focus:ring-2 focus:ring-electric-blue focus:border-electric-blue outline-none bg-surface-container-lowest text-on-background resize-none"
                    placeholder="Brief overview of the project goals and scope..."
                  />
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <section>
                <h3 className="text-sm font-semibold text-on-background uppercase tracking-wider mb-4 border-b border-outline-variant pb-2">
                  Assignment Strategy
                </h3>
                <div className="space-y-3">
                  {[
                    { id: 'existing', title: 'Assign Existing Team', desc: 'Allocate a pre-configured team to this project.' },
                    { id: 'new', title: 'Create New Team', desc: 'Build a custom team from available resources.' },
                    { id: 'later', title: 'Assign Later', desc: 'Setup shell project, add members later.' },
                  ].map((opt, i) => (
                    <label
                      key={opt.id}
                      className="flex items-start gap-3 p-3 border border-outline-variant rounded-lg cursor-pointer hover:border-electric-blue hover:bg-electric-blue/5 bg-surface-container-lowest"
                    >
                      <input
                        type="radio"
                        name="assignment"
                        defaultChecked={i === 2}
                        className="mt-0.5 w-4 h-4 text-electric-blue border-outline-variant focus:ring-electric-blue"
                      />
                      <div>
                        <p className="text-sm font-medium text-on-background">{opt.title}</p>
                        <p className="text-xs text-on-surface-variant mt-0.5">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </section>

              <div className="space-y-8">
                <section>
                  <h3 className="text-sm font-semibold text-on-background uppercase tracking-wider mb-4 border-b border-outline-variant pb-2">
                    Initial Configuration
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-on-background">Phase</label>
                      <select
                        className="w-full px-4 py-2.5 border border-outline-variant rounded-lg focus:ring-2 focus:ring-electric-blue outline-none bg-surface-container-lowest text-on-background"
                        onKeyDown={(e) => handleEnterAdvance(e)}
                      >
                        <option>Discovery</option>
                        <option>Implementation</option>
                        <option>QA & Testing</option>
                        <option>Deployment</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-on-background">Priority</label>
                      <select
                        className="w-full px-4 py-2.5 border border-outline-variant rounded-lg focus:ring-2 focus:ring-electric-blue outline-none bg-surface-container-lowest text-on-background"
                        onKeyDown={(e) => handleEnterAdvance(e)}
                      >
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                        <option>Critical</option>
                      </select>
                    </div>
                  </div>
                </section>
                <section>
                  <h3 className="text-sm font-semibold text-on-background uppercase tracking-wider mb-4 border-b border-outline-variant pb-2">
                    Repository Details
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-on-background" htmlFor="repositoryUrl">
                        Git URL
                      </label>
                      <input
                        id="repositoryUrl"
                        type="url"
                        {...register('repositoryUrl')}
                        onKeyDown={(e) => handleEnterAdvance(e)}
                        className="w-full px-4 py-2.5 border border-outline-variant rounded-lg focus:ring-2 focus:ring-electric-blue outline-none bg-surface-container-lowest text-on-background text-sm font-mono"
                        placeholder="https://github.com/org/repo"
                      />
                      {errors.repositoryUrl && (
                        <p className="text-body-sm text-error">{errors.repositoryUrl.message}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-on-background">Default Branch</label>
                      <input
                        type="text"
                        defaultValue="main"
                        onKeyDown={(e) => handleEnterAdvance(e)}
                        className="w-full px-4 py-2.5 border border-outline-variant rounded-lg focus:ring-2 focus:ring-electric-blue outline-none bg-surface-container-lowest text-on-background text-sm font-mono"
                        placeholder="main"
                      />
                    </div>
                  </div>
                </section>
              </div>
            </div>

            {createMutation.isError && (
              <p className="text-body-sm text-error">Failed to create project. Please try again.</p>
            )}
          </div>

          <div className="p-6 border-t border-outline-variant bg-surface flex justify-end gap-3 items-center">
            <Button type="button" variant="ghost" onClick={() => navigate({ to: '/projects' })}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting || createMutation.isPending}
              rightIcon={<span className="material-symbols-outlined text-sm">arrow_forward</span>}
            >
              Create Project
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
