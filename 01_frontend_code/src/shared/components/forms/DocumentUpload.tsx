import { useRef, useState, type ChangeEvent } from 'react'
import { cn } from '@/shared/lib/cn'
import {DocumentUploadProps} from '@/shared/types'

/**
 * Shared drag-style file picker used by Apply Leave, Compose Notification, etc.
 * Does not upload — parent owns API / draft payload (`attachmentNames` or FormData).
 */
export function DocumentUpload({
  files: controlledFiles,
  onChange,
  accept = '.pdf,.jpg,.jpeg,.png,.docx',
  multiple = true,
  maxSizeMb = 10,
  hint = 'PDF, JPG, PNG or DOCX',
  title = 'Drop files here or click to upload',
  className,
  disabled = false,
}: DocumentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [internal, setInternal] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)

  const files = controlledFiles ?? internal

  const apply = (next: File[]) => {
    const maxBytes = maxSizeMb * 1024 * 1024
    // Validate size first.
    const tooBig = next.find((f) => f.size > maxBytes)
    if (tooBig) {
      setError(`"${tooBig.name}" exceeds ${maxSizeMb}MB limit.`)
      return
    }
    // Validate MIME type against the accepted extensions list.
    const acceptedExt = accept.split(',').map((s) => s.trim().toLowerCase())
    const invalid = next.find((f) => {
      const ext = '.' + f.name.split('.').pop()?.toLowerCase()
      return !acceptedExt.includes(ext)
    })
    if (invalid) {
      setError(`"${invalid.name}" is not an allowed file type.`)
      return
    }
    setError(null)
    if (controlledFiles === undefined) setInternal(next)
    onChange?.(next)
  }

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? [])
    apply(multiple ? [...files, ...list] : list.slice(0, 1))
    e.target.value = ''
  }

  const removeAt = (index: number) => {
    apply(files.filter((_, i) => i !== index))
  }

  return (
    <div className={cn('space-y-2', className)}>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={onFileChange}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'w-full border-2 border-dashed border-outline-variant rounded-xl p-8 flex flex-col items-center',
          'hover:border-secondary hover:bg-surface-container-low transition-all',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        <span className="material-symbols-outlined text-4xl text-outline-variant mb-3">cloud_upload</span>
        <p className="text-label-md text-deep-navy font-semibold">{title}</p>
        <p className="text-body-sm text-on-surface-variant mt-1">
          {hint} (Max {maxSizeMb}MB)
        </p>
      </button>
      {error && <p className="text-body-sm text-error">{error}</p>}
      {files.length > 0 && (
        <ul className="space-y-1">
          {files.map((f, i) => (
            <li
              key={`${f.name}-${f.size}-${i}`}
              className="flex items-center justify-between gap-2 rounded-lg bg-surface-container-low px-3 py-2 text-label-sm"
            >
              <span className="truncate text-on-surface flex items-center gap-2 min-w-0">
                <span className="material-symbols-outlined text-[18px] text-secondary shrink-0">attach_file</span>
                <span className="truncate">{f.name}</span>
              </span>
              <button
                type="button"
                className="text-on-surface-variant hover:text-error shrink-0"
                aria-label={`Remove ${f.name}`}
                onClick={() => removeAt(i)}
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
