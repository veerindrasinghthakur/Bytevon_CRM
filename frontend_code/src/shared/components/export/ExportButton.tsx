import { useState } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { Can } from '@/shared/rbac/Can.tsx'
import { Action, type ResourceName } from '@/shared/schema'
import { useExport, type ExportFormat, type ExportRequest } from '@/shared/hooks/useExport'
import { ExportDialog } from './ExportDialog'
import {ButtonVariant,ButtonSize} from '@/shared/types'

export interface ExportButtonProps {
  resource: ResourceName | string
  selectedIds?: string[]
  filters?: Record<string, unknown>
  query?: string
  sort?: ExportRequest['sort']
  filenameStem?: string
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
  label?: string
  visible?: boolean
}


export function ExportButton({
  resource,
  selectedIds,
  filters,
  query,
  sort,
  filenameStem,
  variant = 'outline',
  size = 'sm',
  className,
  label = 'Export',
  visible = true,
}: ExportButtonProps) {
  const [open, setOpen] = useState(false)
  const { exportDataAsync, isExporting, error, reset } = useExport()

  if (!visible) return null

  const contextLabel =
    selectedIds && selectedIds.length > 0
      ? `${selectedIds.length} selected`
      : query || (filters && Object.keys(filters).length > 0)
        ? 'filtered results'
        : 'current list'

  const handleConfirm = async (format: ExportFormat) => {
    try {
      await exportDataAsync({
        resource,
        selectedIds,
        filters,
        query,
        sort,
        format,
        filenameStem,
      })
      setOpen(false)
      reset()
    } catch {
      // error surfaced via hook → dialog
    }
  }

  return (
    <Can action={Action.EXPORT} resource={resource}>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        leftIcon={<span className="material-symbols-outlined text-[18px]">download</span>}
        onClick={() => {
          reset()
          setOpen(true)
        }}
      >
        {label}
      </Button>
      <ExportDialog
        open={open}
        onClose={() => !isExporting && setOpen(false)}
        onConfirm={handleConfirm}
        isExporting={isExporting}
        errorMessage={error ? 'Export failed. Please try again.' : null}
        contextLabel={contextLabel}
      />
    </Can>
  )
}
