import { cn } from '@/shared/lib/cn'

export function UnavailableProtocol({
  icon,
  title,
  description,
}: {
  icon: string
  title: string
  description: string
}) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-outline-variant bg-surface-container-low p-4 opacity-70">
      <span className="material-symbols-outlined rounded-lg bg-surface-container p-2 text-outline" aria-hidden>
        {icon}
      </span>
      <div>
        <p className="text-body-md font-semibold text-on-surface">{title}</p>
        <p className="text-body-sm text-on-surface-variant">{description}</p>
      </div>
    </div>
  )
}

export function ProtocolRow({
  icon,
  iconClass,
  title,
  description,
  checked,
  onChange,
}: {
  icon: string
  iconClass?: string
  title: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-outline-variant p-4">
      <div className="flex min-w-0 items-center gap-4">
        <span className={cn('material-symbols-outlined rounded-lg p-2', iconClass)} aria-hidden>
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-body-md font-semibold text-on-surface">{title}</p>
          <p className="text-body-sm text-on-surface-variant">{description}</p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors',
          checked ? 'bg-secondary' : 'bg-outline-variant',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all',
            checked ? 'left-[22px]' : 'left-0.5',
          )}
        />
      </button>
    </div>
  )
}
