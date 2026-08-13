import { cn } from '@/shared/lib/cn'

/** Canonical brand asset — served from public/brand */
export const BRAND_LOGO_SRC = '/brand/bytevon-logo.jpg'

interface BrandLogoProps {
  className?: string
  /** Image size classes, e.g. w-10 h-10 */
  sizeClassName?: string
  /** Show wordmark next to mark — only use when rail is expanded */
  withWordmark?: boolean
  wordmarkClassName?: string
  alt?: string
}

export function BrandLogo({
  className,
  sizeClassName = 'w-10 h-10',
  withWordmark = false,
  wordmarkClassName,
  alt = 'Bytevon',
}: BrandLogoProps) {
  return (
    <div className={cn('flex items-center gap-3 min-w-0', className)}>
      <img
        src={BRAND_LOGO_SRC}
        alt={alt}
        width={40}
        height={40}
        className={cn('rounded-lg object-cover shrink-0 block', sizeClassName)}
        draggable={false}
        decoding="async"
      />
      {withWordmark && (
        <span
          className={cn(
            'text-sm font-semibold text-on-primary/90 truncate',
            wordmarkClassName
          )}
        >
          Bytevon
        </span>
      )}
    </div>
  )
}
