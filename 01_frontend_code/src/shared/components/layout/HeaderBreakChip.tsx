import { Link } from '@tanstack/react-router'
import { cn } from '@/shared/lib/cn'
import { useHeaderBreak } from '@/shared/hooks/useHeaderBreak'
import { HeaderBreakChipProps } from '@/shared/types'



export function HeaderBreakChip({ active }: HeaderBreakChipProps) {
  const { runningLabel, isOnBreak } = useHeaderBreak()

  return (
    <Link
      to={"/my-work/break" as any}
      title={isOnBreak ? `On break · ${runningLabel}` : 'Break'}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-label-sm font-semibold',
        'border transition-colors select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40',
        isOnBreak || active
          ? 'bg-secondary/10 border-secondary/40 text-secondary'
          : 'bg-surface-container-low border-outline-variant text-on-surface-variant hover:border-secondary/40 hover:text-secondary'
      )}
    >
      <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
        coffee
      </span>
      <span className="hidden md:inline">{isOnBreak ? runningLabel : 'Break'}</span>
      {isOnBreak && (
        <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse md:hidden" aria-hidden />
      )}
    </Link>
  )
}
