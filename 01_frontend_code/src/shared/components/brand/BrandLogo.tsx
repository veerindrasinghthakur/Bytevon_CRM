import { cn } from '@/shared/lib/cn'

/**
 * Brand mark rendered as inline SVG so it always displays (no public-path / binary issues).
 * Keep this the single source of truth for logo usage across the app.
 */
export function BrandMark({
  className,
  title = 'Bytevon',
}: {
  className?: string
  title?: string
}) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={cn('shrink-0 rounded-lg', className)}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      {/* Deep navy rounded square */}
      <rect width="40" height="40" rx="8" fill="#0B1C30" />
      {/* Soft electric-blue accent glow */}
      <circle cx="28" cy="12" r="10" fill="#3B82F6" opacity="0.25" />
      {/* Stylized lowercase "b" mark */}
      <path
        d="M14 10v20c0 0.6 0.4 1 1 1h6.5c4.2 0 7.5-2.8 7.5-6.5 0-2.6-1.5-4.7-3.8-5.7 1.7-1 2.8-2.8 2.8-4.9 0-3.4-2.9-5.9-6.7-5.9H15c-0.6 0-1 0.4-1 1zm4 1.8h4.2c2.2 0 3.7 1.3 3.7 3.3S24.4 18.4 22.2 18.4H18V11.8zm0 8.4h4.8c2.5 0 4.2 1.5 4.2 3.8s-1.7 3.8-4.2 3.8H18v-7.6z"
        fill="#FFFFFF"
      />
    </svg>
  )
}

interface BrandLogoProps {
  className?: string
  /** Mark size classes, e.g. w-10 h-10 */
  sizeClassName?: string
  /** Show wordmark next to mark — only when rail is expanded / auth headers */
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
      <BrandMark className={sizeClassName} title={alt} />
      {withWordmark && (
        <span
          className={cn(
            'text-sm font-semibold truncate',
            wordmarkClassName ?? 'text-on-primary/90'
          )}
        >
          Bytevon
        </span>
      )}
    </div>
  )
}

/** @deprecated path kept for any leftover references — prefer BrandLogo SVG */
export const BRAND_LOGO_SRC = '/brand/bytevon-logo.jpg'
