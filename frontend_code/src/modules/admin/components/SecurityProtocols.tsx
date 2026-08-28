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
    <div className="flex items-center justify-between p-4 bg-surface-container-low/50 border border-dashed border-outline-variant rounded-lg opacity-75">
      <div className="flex gap-4 items-center">
        <div className="p-3 rounded-lg bg-surface-container text-outline">
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <div>
          <p className="font-bold text-on-surface-variant">{title}</p>
          <p className="text-body-sm text-on-surface-variant">{description}</p>
        </div>
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant bg-surface-container px-2 py-1 rounded shrink-0">
        Not available
      </span>
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
  iconClass: string
  title: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-surface-container-low border border-outline-variant rounded-lg">
      <div className="flex gap-4 items-center">
        <div className={cn('p-3 rounded-lg', iconClass)}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <div>
          <p className="font-bold text-primary">{title}</p>
          <p className="text-body-sm text-on-surface-variant">{description}</p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative w-11 h-6 rounded-full transition-colors',
          checked ? 'bg-secondary' : 'bg-outline-variant',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all',
            checked ? 'left-[22px]' : 'left-0.5',
          )}
        />
      </button>
    </div>
  )
}