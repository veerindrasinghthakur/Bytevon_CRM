import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'

const defaultSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(120),
  description: z.string().max(2000).optional(),
})

type DefaultFormValues = z.infer<typeof defaultSchema>

interface CreatePageShellProps {
  title: string
  listPath: string
  listLabel: string
  entityLabel: string
  namePlaceholder?: string
  submitLabel?: string
  extraFields?: React.ReactNode
  schema?: z.ZodType<DefaultFormValues>
  onSubmit?: (data: DefaultFormValues) => Promise<void>
}

/**
 * Reusable create-page layout for modules that share a simple name + description form.
 * Used by Leads, Clients, Employees, Departments until full module forms are built.
 */
export function CreatePageShell({
  title,
  listPath,
  listLabel,
  entityLabel,
  namePlaceholder = 'Name',
  submitLabel,
  extraFields,
  schema = defaultSchema,
  onSubmit,
}: CreatePageShellProps) {
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DefaultFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '' },
  })

  const handleFormSubmit = async (data: DefaultFormValues) => {
    if (onSubmit) {
      await onSubmit(data)
    } else {
      await new Promise((r) => setTimeout(r, 400))
    }
    navigate({ to: listPath })
  }

  return (
    <div>
      <PageHeader
        title={title}
        breadcrumbs={
          <nav className="text-body-sm text-on-surface-variant">
            <Link to={listPath} className="hover:text-electric-blue">{listLabel}</Link>
            <span className="mx-2">/</span>
            <span className="text-on-surface">New</span>
          </nav>
        }
      />

      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className="max-w-xl space-y-5 rounded-xl border border-outline-variant bg-surface-container-lowest p-6"
      >
        <div>
          <label className="block text-label-md text-on-surface mb-1.5" htmlFor="name">
            {entityLabel} name <span className="text-error">*</span>
          </label>
          <input
            id="name"
            {...register('name')}
            className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-body-md text-on-surface outline-none focus:border-electric-blue focus:border-2"
            placeholder={namePlaceholder}
          />
          {errors.name && <p className="mt-1 text-body-sm text-error">{errors.name.message}</p>}
        </div>

        {extraFields}

        <div>
          <label className="block text-label-md text-on-surface mb-1.5" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            {...register('description')}
            className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-body-md text-on-surface outline-none focus:border-electric-blue focus:border-2 resize-y"
            placeholder="Optional description"
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {submitLabel ?? `Create ${entityLabel}`}
          </Button>
          <Button type="button" variant="ghost" onClick={() => navigate({ to: listPath })}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
