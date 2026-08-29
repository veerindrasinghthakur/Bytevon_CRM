import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/shared/components/ui/Button'
import { useCreateTeam } from '../hooks/use-teams'

const createTeamSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(120),
  description: z.string().max(2000).optional(),
  headName: z.string().max(120).optional(),
  headRole: z.string().max(80).optional(),
})

type CreateTeamFormValues = z.infer<typeof createTeamSchema>

export interface CreateTeamModalProps {
  open: boolean
  onClose: () => void
  onCreated?: () => void
}

export function CreateTeamModal({ open, onClose, onCreated }: CreateTeamModalProps) {
  const create = useCreateTeam()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateTeamFormValues>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      name: '',
      description: '',
      headName: '',
      headRole: '',
    },
  })

  if (!open) return null

  const onSubmit = async (data: CreateTeamFormValues) => {
    await create.mutateAsync({
      name: data.name.trim(),
      description: data.description?.trim() || undefined,
      headName: data.headName?.trim() || undefined,
      headRole: data.headRole?.trim() || undefined,
    })
    reset()
    onCreated?.()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" aria-label="Close" onClick={onClose} />
      <div role="dialog" aria-modal className="relative z-10 w-full max-w-lg bv-surface executive-shadow border border-outline-variant flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
          <h2 className="text-title-lg font-semibold">Create team</h2>
          <button type="button" className="p-2 rounded-full hover:bg-surface-container" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6 space-y-4 overflow-y-auto">
            <div>
              <label className="text-label-sm block mb-1">Team name <span className="text-error">*</span></label>
              <input
                {...register('name')}
                className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface focus:ring-2 focus:ring-secondary/30 outline-none"
                placeholder="e.g. Platform Engineering"
              />
              {errors.name && <p className="mt-1 text-body-sm text-error">{errors.name.message}</p>}
            </div>
            <div>
              <label className="text-label-sm block mb-1">Description</label>
              <textarea
                rows={3}
                {...register('description')}
                className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface resize-none focus:ring-2 focus:ring-secondary/30 outline-none"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-label-sm block mb-1">Team head</label>
                <input
                  {...register('headName')}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface focus:ring-2 focus:ring-secondary/30 outline-none"
                />
              </div>
              <div>
                <label className="text-label-sm block mb-1">Head role</label>
                <input
                  {...register('headRole')}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface focus:ring-2 focus:ring-secondary/30 outline-none"
                />
              </div>
            </div>
          </div>
          <div className="px-6 py-4 border-t border-outline-variant flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting || create.isPending}>
              Create team
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}