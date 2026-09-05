import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/shared/components/ui/Button'
import { Select } from '@/shared/components/ui/Select'
import { ExportButton } from '@/shared/components/export/ExportButton'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { myWorkRoutes } from '../../routes'
import { statusStyles, LEAVE_STATUS_OPTIONS, LEAVE_TYPE_OPTIONS } from '../../schemas/enums'
import {LeaveHistoryRow} from '../../types'



export function LeaveHistoryTab({
  filtered,
  loading,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  typeFilter,
  setTypeFilter,
}: {
  filtered: LeaveHistoryRow[]
  loading: boolean
  search: string
  setSearch: (v: string) => void
  statusFilter: string
  setStatusFilter: (v: string) => void
  typeFilter: string
  setTypeFilter: (v: string) => void
}) {
  const navigate = useNavigate()

  return (
    <div className="space-y-4">
      <div className="bv-surface p-4 flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
          <label className="text-label-sm text-on-surface-variant">Search</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
              search
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-body-sm outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 transition-colors"
              placeholder="Request ID or reason..."
            />
          </div>
        </div>
        <div className="flex flex-col gap-1 min-w-[140px]">
          <label className="text-label-sm text-on-surface-variant">Status</label>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            minWidthClass="min-w-[140px]"
            options={[...LEAVE_STATUS_OPTIONS]}
          />
        </div>
        <div className="flex flex-col gap-1 min-w-[140px]">
          <label className="text-label-sm text-on-surface-variant">Leave Type</label>
          <Select
            value={typeFilter}
            onChange={setTypeFilter}
            minWidthClass="min-w-[140px]"
            options={[...LEAVE_TYPE_OPTIONS]}
          />
        </div>
        <ExportButton
          resource="leave_request"
          filters={{
            status: statusFilter !== 'All' ? statusFilter : undefined,
            type: typeFilter !== 'All' ? typeFilter : undefined,
          }}
          query={search || undefined}
          filenameStem="leave-history"
          label="Export"
        />
      </div>

      {loading ? (
        <div className="bv-surface p-12 flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-4xl text-secondary animate-spin">
            progress_activity
          </span>
          <p className="text-body-md text-on-surface-variant">Loading leave history…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bv-surface p-12 flex flex-col items-center gap-3 text-center">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant">event_busy</span>
          <p className="text-title-lg font-semibold text-on-background">No leave requests found</p>
          <Button
            variant="primary"
            className="mt-2"
            onClick={() => safeNavigate(navigate, { to: myWorkRoutes.leaveApply })}
          >
            Apply for Leave
          </Button>
        </div>
      ) : (
        <div className="bv-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-container-low text-on-surface-variant text-label-sm uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 font-semibold">Type</th>
                  <th className="px-6 py-3 font-semibold">From</th>
                  <th className="px-6 py-3 font-semibold">To</th>
                  <th className="px-6 py-3 font-semibold">Days</th>
                  <th className="px-6 py-3 font-semibold">Reason</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Applied</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {filtered.map((req) => (
                  <tr
                    key={req.id}
                    className="zebra-row cursor-pointer"
                    onClick={() =>
                      safeNavigate(navigate, { to: myWorkRoutes.leaveDetail(req.id) })
                    }
                  >
                    <td className="px-6 py-4 text-label-md font-semibold text-secondary">
                      {req.type}
                    </td>
                    <td className="px-6 py-4 text-label-md text-on-surface-variant">{req.from}</td>
                    <td className="px-6 py-4 text-label-md text-on-surface-variant">{req.to}</td>
                    <td className="px-6 py-4 text-label-md text-on-surface-variant">{req.days}</td>
                    <td className="px-6 py-4 text-label-md text-on-surface-variant max-w-[200px] truncate">
                      {req.reason}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-label-sm font-semibold ${
                          statusStyles[req.status]
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-label-md text-on-surface-variant">
                      {req.appliedOn}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
