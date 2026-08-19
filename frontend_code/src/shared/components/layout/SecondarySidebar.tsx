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
  dashboard: {
    moduleId: 'dashboard',
    title: 'Dashboard',
    items: [{ id: 'executive', label: 'Overview', icon: 'monitoring', to: '/dashboard' }],
  },
  sales: {
    moduleId: 'sales',
    title: 'Sales',
    items: [
      { id: 'leads', label: 'Leads', icon: 'person_search', to: '/sales' },
      { id: 'clients', label: 'Clients', icon: 'handshake', to: '/sales/clients' },
      { id: 'case-studies', label: 'Case Studies', icon: 'library_books', to: '/sales/case-studies' },
      { id: 'analytics', label: 'Analytics', icon: 'analytics', to: '/sales/analytics' },
      { id: 'activity', label: 'Activity', icon: 'timeline', to: '/sales/activity' },
      { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', to: '/sales/dashboard' },
    ],
  },
  projects: {
    moduleId: 'projects',
    title: 'Projects',
    items: [
      { id: 'all-projects', label: 'All Projects', icon: 'account_tree', to: '/projects' },
      { id: 'teams', label: 'Teams', icon: 'groups', to: '/projects/teams' },
      { id: 'tasks', label: 'Tasks', icon: 'assignment', to: '/projects/tasks' },
      { id: 'documents', label: 'Documents', icon: 'folder', to: '/projects/documents' },
    ],
  },
  workforce: {
    moduleId: 'workforce',
    title: 'Workforce',
    items: [
      { id: 'employees', label: 'Employees', icon: 'badge', to: '/workforce/employees' },
      { id: 'departments', label: 'Departments', icon: 'domain', to: '/workforce/departments' },
      { id: 'teams', label: 'Teams', icon: 'groups', to: '/workforce/teams' },
      { id: 'shifts', label: 'Shifts', icon: 'schedule', to: '/workforce/shifts' },
      { id: 'attendance', label: 'Attendance roster', icon: 'calendar_today', to: '/workforce/attendance' },
    ],
  },
  payroll: {
    moduleId: 'payroll',
    title: 'Payroll',
    items: [
      { id: 'overview', label: 'Overview', icon: 'payments', to: '/payroll' },
      { id: 'monthly', label: 'Monthly Payroll', icon: 'calendar_month', to: '/payroll/monthly' },
      { id: 'run', label: 'Run Payroll', icon: 'play_arrow', to: '/payroll/run' },
      { id: 'salary', label: 'Salary Management', icon: 'manage_accounts', to: '/payroll/salary' },
      { id: 'history', label: 'History', icon: 'history', to: '/payroll/history' },
    ],
  },
  'my-work': {
    moduleId: 'my-work',
    title: 'My Work',
    items: [
      { id: 'overview', label: 'Overview', icon: 'dashboard', to: '/my-work' },
      { id: 'my-attendance', label: 'My Attendance', icon: 'calendar_today', to: '/my-work/attendance' },
      { id: 'my-leave', label: 'My Leave', icon: 'event_busy', to: '/my-work/leave' },
      { id: 'my-tasks', label: 'My Tasks', icon: 'task_alt', to: '/my-work/tasks' },
      { id: 'my-requests', label: 'My Requests', icon: 'request_page', to: '/my-work/requests' },
      { id: 'bank-details', label: 'Bank Details', icon: 'account_balance', to: '/my-work/bank-details' },
    ],
  },
  approvals: {
    moduleId: 'approvals',
    title: 'Approvals',
    items: [
      { id: 'center', label: 'Approval Center', icon: 'fact_check', to: '/approvals' },
      { id: 'pending', label: 'Pending Approvals', icon: 'pending_actions', to: '/approvals/pending' },
    ],
  },
  notifications: {
    moduleId: 'notifications',
    title: 'Notifications',
    items: [
      { id: 'center', label: 'Notification Center', icon: 'notifications', to: '/notifications' },
      { id: 'sent', label: 'Sent', icon: 'send', to: '/notifications/sent' },
      { id: 'compose', label: 'Compose', icon: 'edit_notifications', to: '/notifications/compose' },
      { id: 'settings', label: 'Settings', icon: 'settings', to: '/notifications/settings' },
    ],
  },
  admin: {
    moduleId: 'admin',
    title: 'Administration',
    items: [
      { id: 'users', label: 'Users', icon: 'manage_accounts', to: '/admin/users' },
      { id: 'roles', label: 'Roles & Permissions', icon: 'qr_code_2', to: '/admin/roles' },
      { id: 'settings', label: 'Settings', icon: 'settings', to: '/admin/settings' },
      { id: 'attendance-settings', label: 'Attendance Settings', icon: 'timer', to: '/admin/attendance-settings' },
      { id: 'leave-settings', label: 'Leave Settings', icon: 'event_busy', to: '/admin/leave-settings' },
      { id: 'audit', label: 'Audit Logs', icon: 'receipt_long', to: '/admin/audit' },
      { id: 'security', label: 'Security Center', icon: 'security', to: '/admin/security' },
    ],
  },
}

function getActiveModule(pathname: string): string {
  if (pathname.startsWith('/sales')) return 'sales'
  if (pathname.startsWith('/projects')) return 'projects'
  if (pathname.startsWith('/workforce')) return 'workforce'
  if (pathname.startsWith('/payroll')) return 'payroll'
  if (pathname.startsWith('/my-work')) return 'my-work'
  if (pathname.startsWith('/approvals')) return 'approvals'
  if (pathname.startsWith('/notifications')) return 'notifications'
  if (pathname.startsWith('/admin')) return 'admin'
  if (pathname.startsWith('/dashboard')) return 'dashboard'
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
    if (to === '/sales') {
      return (
        pathname === '/sales' ||
        pathname === '/sales/leads' ||
        pathname.startsWith('/sales/leads/')
      )
    }
    if (to === '/projects') return pathname === '/projects'
    if (to === '/projects/documents') return pathname === '/projects/documents'
    if (to === '/my-work') return pathname === '/my-work'
    if (to === '/approvals') return pathname === '/approvals'
    if (to === '/notifications') {
      return pathname === '/notifications' || pathname === '/notifications/center'
    }
    if (to === '/admin/users') {
      return pathname === '/admin' || pathname === '/admin/users' || pathname.startsWith('/admin/users/')
    }
    if (to === '/admin/settings') {
      return pathname === '/admin/settings' || pathname.startsWith('/admin/settings/')
    }
    if (to === '/admin/leave-settings') {
      return pathname.startsWith('/admin/leave-settings')
    }
    if (to === '/admin/attendance-settings') {
      return pathname.startsWith('/admin/attendance-settings')
    }
    if (to === '/dashboard') return pathname === '/dashboard'
    if (to === '/payroll') return pathname === '/payroll'
    if (to === '/payroll/history') {
      return pathname === '/payroll/history'
    }
    if (to === '/workforce/teams') {
      return pathname.startsWith('/workforce/teams') || pathname.startsWith('/projects/teams')
    }
    if (to === '/workforce/shifts') {
      return pathname.startsWith('/workforce/shifts') || pathname.startsWith('/admin/settings/shifts')
    }
    if (to === '/my-work/attendance') {
      return (
        pathname === '/my-work/attendance' ||
        pathname.startsWith('/my-work/attendance/mark') ||
        !!pathname.match(/^\/my-work\/attendance\/[^/]+$/)
      )
    }
    if (to === '/my-work/attendance/corrections') {
      return pathname.startsWith('/my-work/attendance/corrections')
    }
    if (to === '/my-work/requests') {
      return pathname === '/my-work/requests' || pathname.startsWith('/my-work/requests/')
    }
    if (to === '/my-work/bank-details') {
      return pathname === '/my-work/bank-details' || pathname.startsWith('/my-work/bank-details/')
    }
    return pathname === to || pathname.startsWith(to + '/')
  }

  return (
    <nav
      className={cn(
        'h-full bg-surface-container-lowest border-r border-outline-variant flex flex-col',
        'overflow-hidden shrink-0 transition-sidebar',
        isCollapsed ? 'w-16' : 'w-60',
      )}
      aria-label="Secondary navigation"
    >
      <div
        className={cn(
          'shrink-0 flex items-center border-b border-outline-variant',
          isCollapsed ? 'justify-center px-0' : 'justify-between px-3',
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
            'hover:bg-surface-container hover:text-on-surface transition-colors duration-200',
            'w-8 h-8 cursor-pointer',
          )}
          aria-label={isCollapsed ? 'Expand secondary sidebar' : 'Collapse secondary sidebar'}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <span className="material-symbols-outlined text-xl" aria-hidden="true">
            {isCollapsed ? 'menu' : 'menu_open'}
          </span>
        </button>
      </div>

      <div
        className={cn(
          'flex-1 overflow-y-auto scrollbar-hide',
          isCollapsed ? 'pt-3 flex flex-col items-center' : 'pt-3 px-1',
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
                    'flex items-center group relative border-l-4 bv-nav-press cursor-pointer',
                    'transition-colors duration-200 ease-out',
                    isCollapsed
                      ? 'w-10 h-[52px] justify-center rounded-lg border-transparent'
                      : 'w-full px-3 py-3.5 rounded-r-lg gap-3',
                    active
                      ? isCollapsed
                        ? 'bg-[#e8f1ff] text-secondary border-transparent'
                        : 'bg-[#e8f1ff] text-secondary font-semibold border-secondary'
                      : isCollapsed
                        ? 'text-on-surface-variant hover:bg-surface-container border-transparent'
                        : 'text-on-surface-variant hover:bg-surface-container hover:text-on-background border-transparent',
                  )}
                >
                  <span
                    className={cn(
                      'material-symbols-outlined text-2xl shrink-0',
                      active ? 'text-secondary' : '',
                    )}
                    style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
                    aria-hidden="true"
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
                              : 'bg-surface-container-highest text-on-surface-variant',
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
