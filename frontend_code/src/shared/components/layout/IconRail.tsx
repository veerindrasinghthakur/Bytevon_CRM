import { cn } from '@/shared/lib/cn'
import { Link } from '@tanstack/react-router'
import { BrandLogo } from '@/shared/components/brand/BrandLogo'
import { useIconRail } from '@/shared/hooks/useIconRail'
import { useTheme } from '@/shared/theme/ThemeProvider'
import { DEFAULT_RAIL_ITEMS, IconRailProps, type RailItem } from '@/shared/types'

export type { RailItem }

/** Collapsed / expanded rail widths (2px narrower than original 80 / 220) */
export const RAIL_COLLAPSED_WIDTH = 70
export const RAIL_EXPANDED_WIDTH = 218


export function IconRail({
  isExpanded,
  onToggleExpand,
  items = DEFAULT_RAIL_ITEMS,
  onLogout,
}: IconRailProps) {
  const { visibleItems, isActive } = useIconRail(items)
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <nav
      className={cn(
        'relative h-full bg-deep-navy flex flex-col items-center py-4 border-r border-sidebar-item-active/30 z-20',
        'transition-all duration-300 ease-in-out shrink-0 overflow-visible',
      )}
      style={{ width: isExpanded ? RAIL_EXPANDED_WIDTH : RAIL_COLLAPSED_WIDTH }}
      aria-label="Primary navigation"
    >
      <div
        className={cn(
          'group relative w-full shrink-0 mb-3 flex items-center',
          isExpanded ? 'px-4 justify-start' : 'justify-center px-2',
        )}
      >
        <BrandLogo
          sizeClassName="w-10 h-10"
          className="shrink-0"
          withWordmark={isExpanded}
          wordmarkClassName="text-on-primary/90"
        />
        <button
          type="button"
          onClick={onToggleExpand}
          className={cn(
            'absolute top-1/2 -translate-y-1/2 -right-3.5 z-30',
            'w-7 h-7 rounded-full flex items-center justify-center',
            'text-on-primary bg-deep-navy border border-sidebar-item-active',
            'shadow-md',
            'opacity-0 group-hover:opacity-100 focus:opacity-100',
            'transition-opacity duration-150',
            'hover:bg-sidebar-item-active hover:text-on-primary',
          )}
          aria-label={isExpanded ? 'Collapse navigation' : 'Expand navigation'}
          title={isExpanded ? 'Collapse' : 'Expand'}
        >
          <span className="material-symbols-outlined text-[16px] leading-none">
            {isExpanded ? 'chevron_left' : 'chevron_right'}
          </span>
        </button>
      </div>

      <div className="flex-1 w-full flex flex-col gap-1 overflow-y-auto scrollbar-hide">
        {visibleItems.map((item) => {
          const active = isActive(item.to)
          return (
            <Link
              key={item.id}
              to={item.to}
              className={cn(
                'w-full flex items-center gap-4 border-l-4',
                isExpanded ? 'px-5 py-3.5' : 'px-0 py-3.5 justify-center',
                active
                  ? 'bg-sidebar-item-active text-on-primary border-electric-blue'
                  : 'text-white/80 hover:bg-sidebar-item-active/50 hover:text-white border-transparent',
              )}
              title={!isExpanded ? item.label : undefined}
            >
              <span className="material-symbols-outlined text-2xl shrink-0">{item.icon}</span>
              {isExpanded && (
                <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
              )}
            </Link>
          )
        })}
      </div>

      <div className="mt-auto pt-3 flex flex-col items-center gap-1 border-t border-sidebar-item-active/30 w-full shrink-0">
        {/* Theme toggle — immediately above Logout */}
        <button
          type="button"
          onClick={toggleTheme}
          className={cn(
            'text-white/80 hover:text-white hover:bg-sidebar-item-active/50 flex items-center gap-4 w-full transition-colors',
            isExpanded ? 'px-5 py-3 justify-start' : 'py-3 justify-center',
          )}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-pressed={isDark}
        >
          <span className="material-symbols-outlined text-xl">
            {isDark ? 'light_mode' : 'dark_mode'}
          </span>
          {isExpanded && (
            <span className="text-sm font-medium whitespace-nowrap">
              {isDark ? 'Light mode' : 'Dark mode'}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={onLogout}
          className={cn(
            'text-white/80 hover:text-white flex items-center gap-4 w-full',
            isExpanded ? 'px-5 py-3 justify-start' : 'py-3 justify-center',
          )}
          title="Logout"
          aria-label="Logout"
        >
          <span className="material-symbols-outlined text-xl">logout</span>
          {isExpanded && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </nav>
  )
}
