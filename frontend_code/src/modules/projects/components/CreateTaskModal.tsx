import { useState } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { Select } from '@/shared/components/ui/Select'
import { useCreateTask } from '../hooks/use-tasks'
import type { TaskPriority } from '../types'

export interface CreateTaskModalProps {
  open: boolean
  onClose: () => void
  projectId?: number
  projectName?: string
  onCreated?: () => void
}

export function CreateTaskModal({
  open,
  onClose,
  projectId,
  projectName,
  onCreated,
}: CreateTaskModalProps) {
  const create = useCreateTask()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM')
  const [assigneeName, setAssigneeName] = useState('')

  if (!open) return null

  const submit = async () => {
    if (!title.trim()) return
    await create.mutateAsync({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      projectId,
      projectName,
      assigneeName: assigneeName.trim() || undefined,
    })
    setTitle('')
    setDescription('')
    setPriority('MEDIUM')
    setAssigneeName('')
    onCreated?.()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" aria-label="Close" onClick={onClose} />
      <div
        role="dialog"
        aria-modal
        className="relative z-10 w-full max-w-lg bv-surface executive-shadow border border-outline-variant flex flex-col max-h-[90vh]"
      >
        <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-title-lg font-semibold">Create task</h2>
            {projectName && (
              <p className="text-body-sm text-on-surface-variant">Project: {projectName}</p>
            )}
          </div>
          <button type="button" className="p-2 rounded-full hover:bg-surface-container" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="text-label-sm block mb-1">Title <span className="text-error">*</span></label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface text-body-md focus:ring-2 focus:ring-secondary/30 outline-none"
              placeholder="Task title"
            />
          </div>
          <div>
            <label className="text-label-sm block mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface text-body-md resize-none focus:ring-2 focus:ring-secondary/30 outline-none"
            />
          </div>
          <Select
            label="Priority"
            value={priority}
            onChange={(v) => setPriority(v as TaskPriority)}
            options={[
              { value: 'LOW', label: 'Low' },
              { value: 'MEDIUM', label: 'Medium' },
              { value: 'HIGH', label: 'High' },
              { value: 'URGENT', label: 'Urgent' },
            ]}
          />
          <div>
            <label className="text-label-sm block mb-1">Assignee</label>
            <input
              value={assigneeName}
              onChange={(e) => setAssigneeName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface text-body-md focus:ring-2 focus:ring-secondary/30 outline-none"
              placeholder="Name"
            />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-outline-variant flex justify-end gap-2 shrink-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" disabled={!title.trim() || create.isPending} onClick={() => void submit()}>
            Create task
          </Button>
        </div>
      </div>
    </div>
  )
}
