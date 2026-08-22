/**
 * Organization module routes.
 * - Settings tree: parent = admin settings layout route (paths relative: locations, shifts, …)
 * - Workforce shift aliases: parent = app layout
 */
import { createRoute } from '@tanstack/react-router'
import { LocationsListPage } from './pages/LocationsListPage'
import { LocationDetailPage } from './pages/LocationDetailPage'
import { ShiftsListPage } from './pages/ShiftsListPage'
import { ShiftDetailPage } from './pages/ShiftDetailPage'
import { WorkingWeeksPage } from './pages/WorkingWeeksPage'
import { HolidayCalendarsPage } from './pages/HolidayCalendarsPage'
import { HolidaysListPage } from './pages/HolidaysListPage'
import { PositionsListPage } from './pages/PositionsListPage'

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
