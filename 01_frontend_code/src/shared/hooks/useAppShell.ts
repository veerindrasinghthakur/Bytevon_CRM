import { useMemo, useState } from 'react'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { RAIL_COLLAPSED_WIDTH, RAIL_EXPANDED_WIDTH } from '@/shared/components/layout/IconRail'
import { RAIL_MOBILE_COLLAPSED_WIDTH } from '@/shared/components/layout/IconRail'
import {
  SECONDARY_COLLAPSED_WIDTH,
  SECONDARY_EXPANDED_WIDTH,
  SECONDARY_NAV,
} from '@/shared/components/layout/SecondarySidebar'
import { HEADER_HEIGHT_PX } from '@/shared/components/layout/Header'
import { getActiveModule } from './useSecondaryNav'
import { useIsMobile } from './useMediaQuery'
import { useAuth } from '@/modules/auth'
import { authRoutes } from '@/modules/auth/routes'
import { safeNavigate } from '@/shared/lib/safeNavigate'

export function useAppShell() {
  const [isRailExpanded, setIsRailExpanded] = useState(false)
  const [isSecondaryCollapsed, setIsSecondaryCollapsed] = useState(true)
  const { logout } = useAuth()
  const navigate = useNavigate()

  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const moduleId = getActiveModule(pathname)
  const hasSecondaryItems = (SECONDARY_NAV[moduleId]?.items?.length ?? 0) > 0
  const isMobile = useIsMobile()

  const railWidth = isMobile
    ? RAIL_MOBILE_COLLAPSED_WIDTH
    : isRailExpanded
      ? RAIL_EXPANDED_WIDTH
      : RAIL_COLLAPSED_WIDTH
  // On mobile the secondary sidebar becomes an overlay (no layout margin).
  const secondaryWidth =
    isMobile || !hasSecondaryItems
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
    [totalSidebarWidth],
  )

  const mainStyle = useMemo(
    () => ({
      marginLeft: `${totalSidebarWidth}px`,
      marginTop: HEADER_HEIGHT_PX,
      height: `calc(100vh - ${HEADER_HEIGHT_PX}px)`,
    }),
    [totalSidebarWidth],
  )

  const handleLogout = async () => {
    await logout()
    // Use React Router navigation instead of hard reload for instant redirect
    // Include redirect to current path so user returns here after login
    const redirect = encodeURIComponent(window.location.pathname + window.location.search)
    safeNavigate(navigate, { to: authRoutes.login, search: { redirect }, replace: true })
  }

  return {
    isRailExpanded,
    setIsRailExpanded,
    toggleRail: () => setIsRailExpanded((v) => !v),
    isSecondaryCollapsed,
    setIsSecondaryCollapsed,
    toggleSecondary: () => setIsSecondaryCollapsed((v) => !v),
    hasSecondaryItems,
    isMobile,
    headerStyle,
    mainStyle,
    handleLogout,
  }
}
