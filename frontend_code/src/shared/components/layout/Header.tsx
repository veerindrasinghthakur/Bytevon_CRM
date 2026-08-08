import { Link } from '@tanstack/react-router'
import { cn } from '@/shared/lib/cn'
import { IconButton } from '@/shared/components/ui/IconButton'

/** Shared shell header height — keep SecondarySidebar top row the same */
export const HEADER_HEIGHT_PX = 56

interface HeaderProps {
  title?: string
  className?: string
  style?: React.CSSProperties
}

export function Header({ title, className, style }: HeaderProps) {
  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-40 h-14 bg-surface border-b border-outline-variant',
        'flex items-center justify-between px-margin-desktop',
        className
      )}
      style={style}
    >
      <div className="flex items-center gap-4 min-w-0">
        {title && (
          <h2 className="text-body-md font-semibold text-on-background truncate hidden md:block">{title}</h2>
        )}
      </div>

      <div className="flex-1 flex justify-center max-w-md mx-4">
        <div className="flex items-center w-full max-w-xs bg-surface-container-low rounded-lg px-3 py-1.5 border border-outline-variant focus-within:border-electric-blue">
          <span className="material-symbols-outlined text-on-surface-variant mr-2 text-lg">search</span>
          <input
            type="search"
            placeholder="Search..."
            className="bg-transparent border-none outline-none text-body-sm w-full text-on-surface placeholder:text-on-surface-variant"
            aria-label="Global search"
          />
        </div>
      </div>

      <div className="flex items-center gap-gutter shrink-0">
        <IconButton label="Notifications">
          <span className="material-symbols-outlined">notifications</span>
        </IconButton>

        <Link
          to="/profile"
          className="flex items-center gap-3 border-l border-outline-variant pl-gutter ml-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-blue"
          aria-label="Open profile"
        >
          <div className="w-7 h-7 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface">
            <span className="material-symbols-outlined text-base">person</span>
          </div>
          <span className="text-label-md font-semibold text-on-surface hidden sm:inline">Profile</span>
        </Link>
      </div>
    </header>
  )
}
