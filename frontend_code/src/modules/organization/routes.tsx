/**
 * Organization module routes.
 * - Settings tree: parent = admin settings layout route (paths relative: locations, shifts, …)
 * - Workforce shift aliases: parent = app layout
 * All pages lazy-loaded so a single page failure does not block the router tree.
 */
import { createRoute } from '@tanstack/react-router'
import { lazyPage } from '@/shared/lib/lazyPage'

const LocationsListPage = lazyPage(() => import('./pages/LocationsListPage'), 'LocationsListPage')
const LocationDetailPage = lazyPage(() => import('./pages/LocationDetailPage'), 'LocationDetailPage')
const ShiftsListPage = lazyPage(() => import('./pages/ShiftsListPage'), 'ShiftsListPage')
const ShiftDetailPage = lazyPage(() => import('./pages/ShiftDetailPage'), 'ShiftDetailPage')
const WorkingWeeksPage = lazyPage(() => import('./pages/WorkingWeeksPage'), 'WorkingWeeksPage')
const HolidayCalendarsPage = lazyPage(() => import('./pages/HolidayCalendarsPage'), 'HolidayCalendarsPage')
const HolidaysListPage = lazyPage(() => import('./pages/HolidaysListPage'), 'HolidaysListPage')
const PositionsListPage = lazyPage(() => import('./pages/PositionsListPage'), 'PositionsListPage')

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createOrganizationSettingsRoutes(settingsLayoutRoute: any) {
  return [
    createRoute({
      getParentRoute: () => settingsLayoutRoute,
      path: '/locations',
      component: LocationsListPage,
    }),
    createRoute({
      getParentRoute: () => settingsLayoutRoute,
      path: '/locations/$locationId',
      component: LocationDetailPage,
    }),
    createRoute({
      getParentRoute: () => settingsLayoutRoute,
      path: '/shifts',
      component: ShiftsListPage,
    }),
    createRoute({
      getParentRoute: () => settingsLayoutRoute,
      path: '/shifts/new',
      component: ShiftDetailPage,
    }),
    createRoute({
      getParentRoute: () => settingsLayoutRoute,
      path: '/shifts/$shiftId',
      component: ShiftDetailPage,
    }),
    createRoute({
      getParentRoute: () => settingsLayoutRoute,
      path: '/working-weeks',
      component: WorkingWeeksPage,
    }),
    createRoute({
      getParentRoute: () => settingsLayoutRoute,
      path: '/holidays',
      component: HolidayCalendarsPage,
    }),
    createRoute({
      getParentRoute: () => settingsLayoutRoute,
      path: '/holidays/$calendarId',
      component: HolidaysListPage,
    }),
    createRoute({
      getParentRoute: () => settingsLayoutRoute,
      path: '/positions',
      component: PositionsListPage,
    }),
  ]
}

/** Workforce-facing shift routes (same pages). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createWorkforceShiftRoutes(appLayoutRoute: any) {
  return [
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/workforce/shifts',
      component: ShiftsListPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/workforce/shifts/new',
      component: ShiftDetailPage,
    }),
    createRoute({
      getParentRoute: () => appLayoutRoute,
      path: '/workforce/shifts/$shiftId',
      component: ShiftDetailPage,
    }),
  ]
}
