import { useRef, type ChangeEvent } from 'react'
import { Button,  } from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/cn'
import { UploadButtonProps } from '@/shared/types'



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
  isLoading = false,
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
          disabled={disabled || isLoading}
          onChange={onChange}
        />
        <button
          type="button"
          disabled={disabled || isLoading}
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
        disabled={disabled || isLoading}
        leftIcon={<span className="material-symbols-outlined text-[18px]">upload</span>}
        onClick={() => inputRef.current?.click()}
      >
        {isLoading ? 'Uploading…' : label}
      </Button>
    </>
  )
}
