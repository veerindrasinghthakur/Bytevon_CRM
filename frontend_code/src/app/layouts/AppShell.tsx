import { useState, useMemo } from 'react'
import { Outlet, useRouterState } from '@tanstack/react-router'
import { IconRail } from '@/shared/components/layout/IconRail'
import {
  SecondarySidebar,
  SECONDARY_COLLAPSED_WIDTH,
  SECONDARY_EXPANDED_WIDTH,
  SECONDARY_NAV,
} from '@/shared/components/layout/SecondarySidebar'
import { Header, HEADER_HEIGHT_PX } from '@/shared/components/layout/Header'

function getActiveModule(pathname: string): string {
  if (pathname.startsWith('/sales')) return 'sales'
  if (pathname.startsWith('/projects')) return 'projects'
  if (pathname.startsWith('/workforce')) return 'workforce'
  if (pathname.startsWith('/my-work')) return 'my-work'
  if (pathname.startsWith('/approvals')) return 'approvals'
  if (pathname.startsWith('/admin')) return 'admin'
  if (pathname.startsWith('/profile')) return 'dashboard'
  return 'dashboard'
}

export function AppShell() {
  const [isRailExpanded, setIsRailExpanded] = useState(false)
  const [isSecondaryCollapsed, setIsSecondaryCollapsed] = useState(true)

  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const moduleId = getActiveModule(pathname)
  const hasSecondaryItems = (SECONDARY_NAV[moduleId]?.items?.length ?? 0) > 0

  const railWidth = isRailExpanded ? 220 : 80
  const secondaryWidth = !hasSecondaryItems
    ? 0
    : isSecondaryCollapsed
      ? SECONDARY_COLLAPSED_WIDTH
      : SECONDARY_EXPANDED_WIDTH
  const totalSidebarWidth = railWidth + secondaryWidth

  const headerStyle = useMemo(
    () => ({
      marginLeft: `${totalSidebarWidth}px`,
      width: `calc(100% - ${totalSidebarWidth}px)`,
    }),
    [totalSidebarWidth]
  )

  const mainStyle = useMemo(
    () => ({
      marginLeft: `${totalSidebarWidth}px`,
      marginTop: HEADER_HEIGHT_PX,
      height: `calc(100vh - ${HEADER_HEIGHT_PX}px)`,
    }),
    [totalSidebarWidth]
  )

  return (
    <div className="h-screen overflow-hidden flex bg-background">
      <div className="fixed left-0 top-0 h-full flex z-50">
        <IconRail
          isExpanded={isRailExpanded}
          onToggleExpand={() => setIsRailExpanded((v) => !v)}
          onLogout={() => {
            console.info('Logout clicked')
          }}
        />
        <SecondarySidebar
          isCollapsed={isSecondaryCollapsed}
          onToggle={() => setIsSecondaryCollapsed((v) => !v)}
        />
      </div>

      {/* Header search stays full for now (no collapse) */}
      <Header style={headerStyle} />

      <main className="flex-1 bg-background overflow-y-auto p-margin-desktop" style={mainStyle}>
        <Outlet />
      </main>
    </div>
  )
}
