import { cn } from '@/shared/lib/cn'
import { Link, useRouterState } from '@tanstack/react-router'

export interface RailItem {
  id: string
  icon: string
  label: string
  to: string
  /** If false, item is hidden (permission) */
  visible?: boolean
}

const DEFAULT_RAIL_ITEMS: RailItem[] = [
  { id: 'dashboard', icon: 'dashboard', label: 'Dashboard', to: '/dashboard', visible: true },
  { id: 'sales', icon: 'trending_up', label: 'Sales', to: '/sales', visible: true },
  { id: 'projects', icon: 'folder_managed', label: 'Projects', to: '/projects', visible: true },
  { id: 'workforce', icon: 'groups', label: 'Workforce', to: '/workforce', visible: true },
  { id: 'my-work', icon: 'person', label: 'My Work', to: '/my-work', visible: true },
  { id: 'approvals', icon: 'fact_check', label: 'Approvals', to: '/approvals', visible: true },
  { id: 'admin', icon: 'admin_panel_settings', label: 'Administration', to: '/admin', visible: true },
]

interface IconRailProps {
  isExpanded: boolean
  onToggleExpand: () => void
  items?: RailItem[]
  onLogout?: () => void
}

export function IconRail({
  isExpanded,
  onToggleExpand,
  items = DEFAULT_RAIL_ITEMS,
  onLogout,
}: IconRailProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  const visibleItems = items.filter((i) => i.visible !== false)

  const isActive = (to: string) => {
    if (to === '/dashboard') return pathname === '/dashboard' || pathname === '/'
    return pathname === to || pathname.startsWith(to + '/')
  }

  return (
    <nav
      className={cn(
        'h-full bg-deep-navy flex flex-col items-center py-6 border-r border-sidebar-item-active/30 z-20',
        'transition-all duration-300 ease-in-out shrink-0',
        isExpanded ? 'w-[220px]' : 'w-[80px]'
      )}
      aria-label="Primary navigation"
    >
      {/* Expand / collapse toggle */}
      <button
        type="button"
        onClick={onToggleExpand}
        className="w-10 h-10 mb-4 flex items-center justify-center text-inverse-primary/60 hover:text-on-primary transition-colors"
        aria-label={isExpanded ? 'Collapse navigation' : 'Expand navigation'}
      >
        <span className="material-symbols-outlined">
          {isExpanded ? 'menu_open' : 'menu'}
        </span>
      </button>

      {/* Logo */}
      <div className="w-10 h-10 bg-electric-blue rounded-lg flex items-center justify-center text-on-primary shadow-sm shadow-black/20 mb-8 shrink-0">
        <span
          className="material-symbols-outlined text-2xl filled"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          dataset
        </span>
      </div>

      {/* Rail items */}
      <div className="flex-1 w-full flex flex-col gap-1 overflow-y-auto scrollbar-hide">
        {visibleItems.map((item) => {
          const active = isActive(item.to)
          return (
            <Link
              key={item.id}
              to={item.to}
              className={cn(
                'w-full flex items-center gap-4 transition-all duration-200 border-l-4',
                isExpanded ? 'px-5 py-3.5' : 'px-0 py-3.5 justify-center',
                active
                  ? 'bg-sidebar-item-active text-on-primary border-electric-blue'
                  : 'text-inverse-primary/60 hover:bg-sidebar-item-active/50 hover:text-on-primary border-transparent'
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

      {/* Bottom: Logout */}
      <div className="mt-auto pt-4 flex flex-col items-center gap-3 border-t border-sidebar-item-active/30 w-full shrink-0">
        <button
          type="button"
          onClick={onLogout}
          className={cn(
            'text-inverse-primary/60 hover:text-on-primary transition-colors flex items-center gap-4 w-full',
            isExpanded ? 'px-5 py-3 justify-start' : 'py-3 justify-center'
          )}
          title="Logout"
        >
          <span className="material-symbols-outlined text-xl">logout</span>
          {isExpanded && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </nav>
  )
}
