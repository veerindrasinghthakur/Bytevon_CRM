import { useState } from 'react'
import { Outlet, useRouterState } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { LeaveSettingsNav } from '../components/LeaveSettingsNav'
import { LeaveEditContext } from '../context/LeaveEditContext'

/** Layout for /admin/leave-settings/* — edit above nav; hidden on policies */
export function LeaveSettingsLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const [editing, setEditing] = useState(false)
  const isPolicies =
    pathname.includes('/policies') || pathname.includes('/ledger')

  return (
    <LeaveEditContext.Provider value={{ editing: isPolicies ? false : editing, setEditing }}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <PageHeader
            title="Leave Settings"
            description="Leave types, entitlements, policies, and employee leave ledgers."
          />
          {!isPolicies &&
            (editing ? (
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                  Discard
                </Button>
                <Button variant="primary" size="sm" onClick={() => setEditing(false)}>
                  Save
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                leftIcon={<span className="material-symbols-outlined text-[18px]">edit</span>}
                onClick={() => setEditing(true)}
              >
                Edit
              </Button>
            ))}
        </div>
        <LeaveSettingsNav />
        <div className="min-w-0 w-full">
          <Outlet />
        </div>
      </div>
    </LeaveEditContext.Provider>
  )
}
