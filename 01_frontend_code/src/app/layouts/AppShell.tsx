import { Outlet } from '@tanstack/react-router'
import { IconRail } from '@/shared/components/layout/IconRail'
import { SecondarySidebar } from '@/shared/components/layout/SecondarySidebar'
import { Header } from '@/shared/components/layout/Header'
import {
  QuickOverviewPanel,
} from '@/shared/components/layout/QuickOverview'
import { useAppShell } from '@/shared/hooks/useAppShell'
import { SessionExpiryHost } from '@/modules/auth/components/SessionExpiryHost'

export function AppShell() {
  const {
    isRailExpanded,
    toggleRail,
    isSecondaryCollapsed,
    toggleSecondary,
    isMobile,
    headerStyle,
    mainStyle,
    handleLogout,
  } = useAppShell()

  return (
    <div className="h-screen overflow-hidden flex bg-background">
      <SessionExpiryHost />
      <div className="fixed left-0 top-0 h-full flex z-50 overflow-visible">
        <IconRail
          isExpanded={isRailExpanded}
          onToggleExpand={toggleRail}
          onLogout={() => {
            void handleLogout()
          }}
        />
        <SecondarySidebar
          isCollapsed={isSecondaryCollapsed}
          onToggle={toggleSecondary}
          overlay={isMobile}
        />
      </div>

      <Header style={headerStyle} onMenu={isMobile ? toggleSecondary : undefined} />

      <main className="flex-1 bg-background overflow-y-auto p-4 sm:p-6 lg:p-margin-desktop" style={mainStyle}>
        <Outlet />
      </main>

      <QuickOverviewPanel />
    </div>
  )
}
