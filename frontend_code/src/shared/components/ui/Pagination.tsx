import { cn } from '@/shared/lib/cn'
import { Button } from './Button'

export const DEFAULT_PAGE_SIZE = 10

interface PaginationProps {
  page: number
  pageSize?: number
  total: number
  onPageChange: (page: number) => void
  itemLabel?: string
  className?: string
}

/**
 * Only renders when total > pageSize.
 * Shows "Showing a–b of total" + prev/next + page chips.
 */
export function Pagination({
  page,
  pageSize = DEFAULT_PAGE_SIZE,
  total,
  onPageChange,
  itemLabel = 'items',
  className,
}: PaginationProps) {
  if (total <= pageSize) return null

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const from = (safePage - 1) * pageSize + 1
  const to = Math.min(safePage * pageSize, total)

  const pages = buildPageList(safePage, totalPages)

  return (
    <div
      className={cn(
        'border-t border-outline-variant/30 p-4 flex flex-col sm:flex-row items-center justify-between gap-3',
        className
      )}
    >
      <p className="text-[11px] text-on-surface-variant">
        Showing{' '}
        <span className="font-semibold text-on-background">
          {from}-{to}
        </span>{' '}
        of <span className="font-semibold text-on-background">{total}</span> {itemLabel}
      </p>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          aria-label="Previous page"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
        </Button>
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`e-${i}`} className="px-2 text-on-surface-variant text-label-sm">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p as number)}
              className={cn(
                'min-w-8 h-8 px-2 rounded-lg text-label-sm font-semibold',
                p === safePage
                  ? 'bg-electric-blue text-white'
                  : 'text-on-background hover:bg-surface-container'
              )}
            >
              {p}
            </button>
          )
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          aria-label="Next page"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
        </Button>
      </div>
    </div>
  )
}

function buildPageList(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const set = new Set<number>([1, total, current, current - 1, current + 1, 2, total - 1])
  const sorted = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b)
  const out: (number | '…')[] = []
  let prev = 0
  for (const n of sorted) {
    if (prev && n - prev > 1) out.push('…')
    out.push(n)
    prev = n
  }
  return out
}

/** Client-side slice helper */
export function paginate<T>(items: T[], page: number, pageSize = DEFAULT_PAGE_SIZE): T[] {
  const start = (Math.max(1, page) - 1) * pageSize
  return items.slice(start, start + pageSize)
}
