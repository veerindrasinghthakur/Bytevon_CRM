import { cn } from '@/shared/lib/cn'

export function PageLoadingSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-6 animate-pulse', className)} aria-busy aria-label="Loading">
      <div className="h-8 w-56 rounded bg-surface-container" />
      <div className="h-4 w-80 rounded bg-surface-container-low" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-surface-container-low border border-outline-variant" />
        ))}
      </div>
      <div className="h-64 rounded-xl bg-surface-container-low border border-outline-variant" />
    </div>
  )
}
