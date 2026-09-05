import { Outlet } from '@tanstack/react-router'
import { IconRail } from '@/shared/components/layout/IconRail'
import { SecondarySidebar } from '@/shared/components/layout/SecondarySidebar'
import { Header } from '@/shared/components/layout/Header'
import {
  QuickOverviewProvider,
  QuickOverviewPanel,
} from '@/shared/components/layout/QuickOverview'
import { useAppShell } from '@/shared/hooks/useAppShell'

export function AppShell() {
  const {
    isRailExpanded,
    toggleRail,
    isSecondaryCollapsed,
    toggleSecondary,
    headerStyle,
    mainStyle,
    handleLogout,
  } = useAppShell()

  return (
    <QuickOverviewProvider>
      <div className="h-screen overflow-hidden flex bg-background">
        <div className="fixed left-0 top-0 h-full flex z-50 overflow-visible">
          <IconRail
            isExpanded={isRailExpanded}
            onToggleExpand={toggleRail}
            onLogout={() => {
              void handleLogout()
            }}
          />
          <SecondarySidebar isCollapsed={isSecondaryCollapsed} onToggle={toggleSecondary} />
        </div>

        <Header style={headerStyle} />

        <main className="flex-1 bg-background overflow-y-auto p-margin-desktop" style={mainStyle}>
          <Outlet />
        </main>

        <QuickOverviewPanel />
      </div>
    </QuickOverviewProvider>
  )
}
