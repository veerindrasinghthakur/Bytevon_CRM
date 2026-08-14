import { cn } from '@/shared/lib/cn'
import { Link, useRouterState } from '@tanstack/react-router'
import { HEADER_HEIGHT_PX } from './Header'

export interface SecondaryNavItem {
  id: string
  label: string
  icon: string
  to: string
  badge?: number | string
  visible?: boolean
}

export interface SecondaryNavGroup {
  moduleId: string
  title: string
  items: SecondaryNavItem[]
}

export const SECONDARY_NAV: Record<string, SecondaryNavGroup> = {
  dashboard: { moduleId: 'dashboard', title: 'Dashboard', items: [] },
  sales: {
    moduleId: 'sales',
    title: 'Sales',
    items: [
      { id: 'leads', label: 'Leads', icon: 'person_search', to: '/sales/leads' },
      { id: 'clients', label: 'Clients', icon: 'handshake', to: '/sales/clients' },
      { id: 'analytics', label: 'Analytics', icon: 'analytics', to: '/sales/analytics' },
      { id: 'activity', label: 'Activity', icon: 'timeline', to: '/sales/activity' },
    ],
  },
  projects: {
    moduleId: 'projects',
    title: 'Projects',
    items: [
      { id: 'all-projects', label: 'All Projects', icon: 'account_tree', to: '/projects' },
      { id: 'teams', label: 'Teams', icon: 'groups', to: '/projects/teams' },
      { id: 'tasks', label: 'Tasks', icon: 'assignment', to: '/projects/tasks' },
    ],
  },
  workforce: {
    moduleId: 'workforce',
    title: 'Workforce',
    items: [
      { id: 'employees', label: 'Employees', icon: 'badge', to: '/workforce/employees' },
      { id: 'departments', label: 'Departments', icon: 'domain', to: '/workforce/departments' },
      { id: 'attendance', label: 'Attendance', icon: 'calendar_today', to: '/workforce/attendance' },
    ],
  },
  'my-work': {
    moduleId: 'my-work',
    title: 'My Work',
    items: [
      { id: 'overview', label: 'Overview', icon: 'dashboard', to: '/my-work' },
      { id: 'my-attendance', label: 'My Attendance', icon: 'calendar_today', to: '/my-work/attendance' },
      // {
      //   id: 'attendance-corrections',
      //   label: 'Corrections',
      //   icon: 'edit_calendar',
      //   to: '/my-work/attendance/corrections',
      // },
      { id: 'my-leave', label: 'My Leave', icon: 'event_busy', to: '/my-work/leave' },
      { id: 'my-tasks', label: 'My Tasks', icon: 'task_alt', to: '/my-work/tasks' },
      { id: 'my-approvals', label: 'My Approvals', icon: 'fact_check', to: '/my-work/approvals' },
    ],
  },
  approvals: {
    moduleId: 'approvals',
    title: 'Approvals',
    items: [
      { id: 'pending', label: 'Pending Approvals', icon: 'pending_actions', to: '/approvals/pending' },
      { id: 'my-requests', label: 'My Requests', icon: 'request_page', to: '/approvals/my-requests' },
    ],
  },
  admin: {
    moduleId: 'admin',
    title: 'Administration',
    items: [
      { id: 'users', label: 'Users', icon: 'manage_accounts', to: '/admin/users' },
      { id: 'roles', label: 'Roles & Permissions', icon: 'qr_code_2', to: '/admin/roles' },
      { id: 'settings', label: 'Settings', icon: 'settings', to: '/admin/settings' },
      { id: 'audit', label: 'Audit Logs', icon: 'receipt_long', to: '/admin/audit' },
      { id: 'notifications', label: 'Notifications', icon: 'notifications', to: '/admin/notifications' },
    ],
  },
}

function getActiveModule(pathname: string): string {
  if (pathname.startsWith('/sales')) return 'sales'
  if (pathname.startsWith('/projects')) return 'projects'
  if (pathname.startsWith('/workforce')) return 'workforce'
  if (pathname.startsWith('/my-work')) return 'my-work'
  if (pathname.startsWith('/approvals')) return 'approvals'
  if (pathname.startsWith('/admin')) return 'admin'
  return 'dashboard'
}

export const SECONDARY_COLLAPSED_WIDTH = 64
export const SECONDARY_EXPANDED_WIDTH = 240

interface SecondarySidebarProps {
  isCollapsed: boolean
  onToggle: () => void
}

export function SecondarySidebar({ isCollapsed, onToggle }: SecondarySidebarProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const moduleId = getActiveModule(pathname)
  const group = SECONDARY_NAV[moduleId]
  const items = (group?.items ?? []).filter((i) => i.visible !== false)

  if (items.length === 0) return null

  const isItemActive = (to: string) => {
    if (to === '/projects') return pathname === '/projects'
    if (to === '/my-work') return pathname === '/my-work'
    if (to === '/my-work/attendance') {
      return pathname === '/my-work/attendance' || pathname.startsWith('/my-work/attendance/mark') || pathname.match(/^\/my-work\/attendance\/[^/]+$/)
    }
    if (to === '/my-work/attendance/corrections') {
      return pathname.startsWith('/my-work/attendance/corrections')
    }
    return pathname === to || pathname.startsWith(to + '/')
  }

  return (
    <nav
      className={cn(
        'h-full bg-surface-container-lowest border-r border-outline-variant flex flex-col',
        'overflow-hidden shrink-0',
        isCollapsed ? 'w-16' : 'w-60'
      )}
      aria-label="Secondary navigation"
    >
      <div
        className={cn(
          'shrink-0 flex items-center border-b border-outline-variant',
          isCollapsed ? 'justify-center px-0' : 'justify-between px-3'
        )}
        style={{ height: HEADER_HEIGHT_PX }}
      >
        {!isCollapsed && (
          <h2 className="text-body-md font-semibold text-on-background leading-none truncate min-w-0 flex-1 pr-2">
            {group?.title ?? 'Workspace'}
          </h2>
        )}
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            'flex items-center justify-center rounded-lg text-on-surface-variant',
            'hover:bg-surface-container hover:text-on-surface',
            'w-8 h-8'
          )}
          aria-label={isCollapsed ? 'Expand secondary sidebar' : 'Collapse secondary sidebar'}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <span className="material-symbols-outlined text-xl">
            {isCollapsed ? 'menu' : 'menu_open'}
          </span>
        </button>
      </div>

      <div
        className={cn(
          'flex-1 overflow-y-auto scrollbar-hide',
          isCollapsed ? 'pt-3 flex flex-col items-center' : 'pt-3 px-1'
        )}
      >
        <ul className={cn('flex flex-col gap-1', isCollapsed ? 'w-full items-center' : 'w-full')}>
          {items.map((item) => {
            const active = isItemActive(item.to)
            return (
              <li key={item.id} className={isCollapsed ? 'w-full flex justify-center' : 'w-full'}>
                <Link
                  to={item.to}
                  title={isCollapsed ? item.label : undefined}
                  className={cn(
                    'flex items-center group relative border-l-4',
                    isCollapsed
                      ? 'w-10 h-[52px] justify-center rounded-lg border-transparent'
                      : 'w-full px-3 py-3.5 rounded-r-lg gap-3',
                    active
                      ? isCollapsed
                        ? 'bg-[#e8f1ff] text-secondary border-transparent'
                        : 'bg-[#e8f1ff] text-secondary font-semibold border-secondary'
                      : isCollapsed
                        ? 'text-on-surface-variant hover:bg-surface-container border-transparent'
                        : 'text-on-surface-variant hover:bg-surface-container hover:text-on-background border-transparent'
                  )}
                >
                  <span
                    className={cn(
                      'material-symbols-outlined text-2xl shrink-0',
                      active ? 'text-secondary' : ''
                    )}
                    style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    {item.icon}
                  </span>
                  {!isCollapsed && (
                    <>
                      <span className="text-nav-item flex-1 truncate">{item.label}</span>
                      {item.badge != null && (
                        <span
                          className={cn(
                            'text-[10px] font-bold px-1.5 py-0.5 rounded',
                            active
                              ? 'bg-secondary/15 text-secondary'
                              : 'bg-surface-container-highest text-on-surface-variant'
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                  {isCollapsed && item.badge != null && (
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-secondary" />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
