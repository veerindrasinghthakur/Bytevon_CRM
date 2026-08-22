import { useState } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { useCreateTeam } from '../hooks/use-teams'

export interface CreateTeamModalProps {
  open: boolean
  onClose: () => void
  onCreated?: () => void
}

export function CreateTeamModal({ open, onClose, onCreated }: CreateTeamModalProps) {
  const create = useCreateTeam()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [headName, setHeadName] = useState('')
  const [headRole, setHeadRole] = useState('')

  if (!open) return null

  const submit = async () => {
    if (!name.trim()) return
    await create.mutateAsync({
      name: name.trim(),
      description: description.trim() || undefined,
      headName: headName.trim() || undefined,
      headRole: headRole.trim() || undefined,
    })
    setName('')
    setDescription('')
    setHeadName('')
    setHeadRole('')
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
        <div className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="text-label-sm block mb-1">Team name <span className="text-error">*</span></label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface focus:ring-2 focus:ring-secondary/30 outline-none"
              placeholder="e.g. Platform Engineering"
            />
          </div>
          <div>
            <label className="text-label-sm block mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface resize-none focus:ring-2 focus:ring-secondary/30 outline-none"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-label-sm block mb-1">Team head</label>
              <input
                value={headName}
                onChange={(e) => setHeadName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface focus:ring-2 focus:ring-secondary/30 outline-none"
              />
            </div>
            <div>
              <label className="text-label-sm block mb-1">Head role</label>
              <input
                value={headRole}
                onChange={(e) => setHeadRole(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface focus:ring-2 focus:ring-secondary/30 outline-none"
              />
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-outline-variant flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" disabled={!name.trim() || create.isPending} onClick={() => void submit()}>
            Create team
          </Button>
        </div>
      </div>
    </div>
  )
}
