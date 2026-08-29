import { cn } from '@/shared/lib/cn'
import type { TimelineStepProps } from '@/shared/types'

export function TimelineStep({
  title,
  body,
  time,
  done,
  active,
  muted,
}: TimelineStepProps) {
  return (
    <div className={cn('relative', muted && 'opacity-40')}>
      <div
        className={cn(
          'absolute -left-[37px] top-0 w-7 h-7 rounded-full flex items-center justify-center border-4 border-surface-container-lowest z-10 executive-shadow',
          done && 'bg-secondary text-white',
          active && 'bg-secondary/80 text-white',
          !done && !active && 'bg-outline-variant text-white'
        )}
      >
        <span
          className="material-symbols-outlined text-[14px]"
          style={done ? { fontVariationSettings: "'FILL' 1" } : undefined}
        >
          {done ? 'check' : active ? 'pending' : 'radio_button_unchecked'}
        </span>
      </div>
      <div className="flex justify-between items-start gap-4">
        <div>
          <p className={cn('text-label-md font-medium', active ? 'text-secondary font-bold' : 'text-on-background')}>
            {title}
          </p>
          <p className="text-body-sm text-on-surface-variant">{body}</p>
        </div>
        {time && <p className="text-label-sm text-on-surface-variant shrink-0">{time}</p>}
      </div>
    </div>
  )
}