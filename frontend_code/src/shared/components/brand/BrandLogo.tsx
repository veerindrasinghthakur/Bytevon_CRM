import { cn } from '@/shared/lib/cn'

/** Canonical brand asset — use everywhere logos appear. */
export const BRAND_LOGO_SRC = '/brand/bytevon-logo.jpg'

interface BrandLogoProps {
  className?: string
  /** Image size classes, e.g. w-10 h-10 */
  sizeClassName?: string
  /** Show wordmark next to mark */
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
        className={cn('rounded-lg object-cover shrink-0', sizeClassName)}
        draggable={false}
      />
      {withWordmark && (
        <span className={cn('text-title-lg font-bold text-on-background truncate', wordmarkClassName)}>
          Bytevon
        </span>
      )}
    </div>
  )
}
