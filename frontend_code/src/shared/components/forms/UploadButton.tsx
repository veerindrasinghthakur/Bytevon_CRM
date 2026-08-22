import { useRef, type ChangeEvent } from 'react'
import { Button, type ButtonSize, type ButtonVariant } from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/cn'

export interface UploadButtonProps {
  onFiles?: (files: File[]) => void
  accept?: string
  multiple?: boolean
  maxSizeMb?: number
  variant?: ButtonVariant
  size?: ButtonSize
  label?: string
  className?: string
  disabled?: boolean
  /** When true, only icon (no label) */
  iconOnly?: boolean
}

/**
 * Shared upload control — opens OS file manager and returns selected File(s).
 * Parent owns API upload / draft; this only attaches files from disk.
 * Pair with DocumentUpload for drop-zone UX or FilePreviewModal for preview.
 */
export function UploadButton({
  onFiles,
  accept = '.pdf,.jpg,.jpeg,.png,.docx,.doc,.xlsx,.csv,.txt,.webp',
  multiple = true,
  maxSizeMb = 25,
  variant = 'outline',
  size = 'sm',
  label = 'Upload',
  className,
  disabled,
  iconOnly = false,
}: UploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (!list.length) return
    const maxBytes = maxSizeMb * 1024 * 1024
    const valid = list.filter((f) => f.size <= maxBytes)
    if (valid.length) onFiles?.(valid)
  }

  if (iconOnly) {
    return (
      <>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={onChange}
        />
        <button
          type="button"
          disabled={disabled}
          title={label}
          aria-label={label}
          className={cn(
            'p-2 rounded-lg border border-outline-variant text-on-surface-variant',
            'hover:text-secondary hover:border-secondary transition-colors',
            'disabled:opacity-50 disabled:pointer-events-none',
            className,
          )}
          onClick={() => inputRef.current?.click()}
        >
          <span className="material-symbols-outlined text-[22px]">upload</span>
        </button>
      </>
    )
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={onChange}
      />
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        disabled={disabled}
        leftIcon={<span className="material-symbols-outlined text-[18px]">upload</span>}
        onClick={() => inputRef.current?.click()}
      >
        {label}
      </Button>
    </>
  )
}
