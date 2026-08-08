import { useState, useMemo } from 'react'
import { Outlet } from '@tanstack/react-router'
import { IconRail } from '@/shared/components/layout/IconRail'
import { SecondarySidebar } from '@/shared/components/layout/SecondarySidebar'
import { Header } from '@/shared/components/layout/Header'

/**
 * AppShell – main authenticated layout.
 * Icon Rail + Secondary Sidebar (both collapsed by default) + Header + Outlet.
 * Follows locked decisions from 04_AppShell_and_Layout_Components.md
 */
export function AppShell() {
  const [isRailExpanded, setIsRailExpanded] = useState(false)
  const [isSecondaryCollapsed, setIsSecondaryCollapsed] = useState(true)

  const railWidth = isRailExpanded ? 220 : 80
  const secondaryWidth = isSecondaryCollapsed ? 0 : 240
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
    }),
    [totalSidebarWidth]
  )

  return (
    <div className="h-screen overflow-hidden flex bg-background">
      {/* Dual navigation */}
      <div className="fixed left-0 top-0 h-full flex z-50">
        <IconRail
          isExpanded={isRailExpanded}
          onToggleExpand={() => setIsRailExpanded((v) => !v)}
          onLogout={() => {
            // Placeholder – wire to Auth later
            console.info('Logout clicked')
          }}
        />
        <SecondarySidebar
          isCollapsed={isSecondaryCollapsed}
          onToggle={() => setIsSecondaryCollapsed((v) => !v)}
          railWidth={railWidth}
        />
      </div>

      {/* Header */}
      <Header style={headerStyle} />

      {/* Main content */}
      <main
        className="mt-16 flex-1 bg-background overflow-y-auto p-margin-desktop h-[calc(100vh-64px)] transition-all duration-300 ease-in-out"
        style={mainStyle}
      >
        <Outlet />
      </main>
    </div>
  )
}