import { useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { BackButton } from '@/shared/components/layout/BackButton'
import { Button } from '@/shared/components/ui/Button'
import { Select } from '@/shared/components/ui/Select'
import { ExportButton } from '@/shared/components/export/ExportButton'
import { ListToolbar } from '@/shared/components/layout/ListToolbar'
import { handleEnterAdvance } from '@/shared/lib/enter-advance'
import { cn } from '@/shared/lib/cn'
import { safeNavigate } from '@/shared/lib/safeNavigate'
import { useAttendanceCorrections } from '../../hooks/use-attendance-corrections'
import { myWorkRoutes } from '../../routes'
import { CORRECTION_STATUS_OPTIONS, correctionStatusStyles } from '../../schemas/enums'

export function AttendanceCorrectionsPage() {
  const navigate = useNavigate()
  const c = useAttendanceCorrections()

  const goAttendance = () => safeNavigate(navigate, { to: myWorkRoutes.attendance })
  const goApprovals = () => safeNavigate(navigate, { to: myWorkRoutes.approvals })

  return (
    <div className="space-y-8 animate-fade-in">
      <BackButton to={myWorkRoutes.attendance} label="Back to attendance" />
      <PageHeader
        title="Attendance corrections"
        description="Request changes to past attendance records when punch times or status need adjustment."
        actions={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<span className="material-symbols-outlined text-[18px]">add</span>}
            onClick={() => c.openNew()}
          >
            New correction
          </Button>
        }
      />

      <ListToolbar
        search={c.search}
        onSearchChange={c.setSearch}
        searchPlaceholder="Search by date, reason, or approver…"
        filtersActive={c.filtersActive}
        onResetFilters={c.resetFilters}
        onRefresh={() => void c.refetch()}
        actionsSlot={
          <ExportButton
            resource="ATTENDANCE_CORRECTION"
            filters={{
              status: c.statusFilter !== 'All' ? c.statusFilter : undefined,
            }}
            query={c.search || undefined}
            filenameStem="attendance-corrections"
          />
        }
      >
        <Select
          value={c.statusFilter}
          onChange={c.setStatusFilter}
          placeholder="All statuses"
          aria-label="Filter by status"
          options={[...CORRECTION_STATUS_OPTIONS]}
          minWidthClass="min-w-[10rem] max-w-[14rem]"
        />
      </ListToolbar>

      <section className="bv-surface overflow-hidden">
        <div className="px-5 py-4 border-b border-outline-variant/30">
          <h3 className="text-title-lg text-on-background">Suggested days</h3>
          <p className="text-body-sm text-on-surface-variant mt-0.5">
            Half-days or records with notes are good candidates for a correction.
          </p>
        </div>
        {c.candidates.length === 0 ? (
          <p className="p-6 text-body-md text-on-surface-variant">No correction candidates.</p>
        ) : (
          <ul className="divide-y divide-outline-variant/40">
            {c.candidates.map((r) => (
              <li
                key={r.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center gap-3 justify-between hover:bg-surface-container/40 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-body-md font-semibold text-on-background">{r.date}</p>
                  <p className="text-label-sm text-on-surface-variant mt-0.5">
                    {r.status}
                    {r.checkIn && r.checkIn !== '—' ? ` · In ${r.checkIn}` : ''}
                    {r.checkOut && r.checkOut !== '—' ? ` · Out ${r.checkOut}` : ''}
                    {r.note ? ` · ${r.note}` : ''}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => c.openNew(r.id)}>
                  Request correction
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bv-surface overflow-hidden">
        <div className="px-5 py-4 border-b border-outline-variant/30">
          <h3 className="text-title-lg text-on-background">Your requests</h3>
        </div>
        {c.isLoading ? (
          <p className="p-6 text-on-surface-variant">Loading…</p>
        ) : c.visible.length === 0 ? (
          <div className="p-10 text-center">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">
              edit_calendar
            </span>
            <p className="text-body-md text-on-surface-variant">No correction requests yet.</p>
            <Button className="mt-4" variant="primary" size="sm" onClick={() => c.openNew()}>
              New correction
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[820px]">
              <thead>
                <tr className="border-b border-outline-variant/30 bg-surface-container-low/50">
                  <th className="py-3 px-5 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Date</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Original</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Requested times</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Approver</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Reason</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Status</th>
                  <th className="py-3 px-5 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider text-right">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {c.visible.map((r) => (
                  <tr key={r.id} className="h-16 zebra-row">
                    <td className="py-2 px-5 text-body-md font-semibold text-on-background">{r.date}</td>
                    <td className="py-2 px-4 text-body-md text-on-surface-variant">{r.originalStatus}</td>
                    <td className="py-2 px-4 text-body-md text-on-background">{r.requestedCheckIn} – {r.requestedCheckOut}</td>
                    <td className="py-2 px-4 text-body-md text-on-background">{r.approver}</td>
                    <td className="py-2 px-4 text-body-sm text-on-surface-variant max-w-[200px] truncate">{r.reason}</td>
                    <td className="py-2 px-4">
                      <span className={cn('inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider', correctionStatusStyles[r.status])}>{r.status}</span>
                    </td>
                    <td className="py-2 px-5 text-body-sm text-on-surface-variant text-right">{r.submittedOn}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-body-sm text-on-surface-variant">
        Related:{' '}
        <button type="button" onClick={goAttendance} className="text-secondary hover:underline font-medium">My attendance</button>
        {' · '}
        <button type="button" onClick={goApprovals} className="text-secondary hover:underline font-medium">My approvals</button>
      </p>

      {c.modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-background/40 backdrop-blur-sm">
          <div className="bv-surface w-full max-w-lg executive-shadow flex flex-col max-h-[90vh] overflow-hidden" role="dialog" aria-labelledby="corr-title">
            <div className="flex items-start justify-between p-5 border-b border-outline-variant">
              <div>
                <h2 id="corr-title" className="text-title-lg text-on-background font-bold">New attendance correction</h2>
                <p className="text-body-sm text-on-surface-variant mt-1">Default approver is your department head; search hierarchy to change.</p>
              </div>
              <button type="button" className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors" aria-label="Close" onClick={() => c.setModalOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <Select label="Day" value={c.selectedDateId} onChange={(v) => c.onSelectDay(v)} options={c.candidates.map((day) => ({ value: day.id, label: `${day.date} · ${day.status}` }))} minWidthClass="w-full max-w-none" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-label-sm text-on-surface-variant block mb-1" htmlFor="corr-in">Requested check-in</label>
                  <input id="corr-in" value={c.checkIn} onChange={(e) => c.setCheckIn(e.target.value)} onKeyDown={(e) => handleEnterAdvance(e)} className="w-full px-3 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-body-md focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-colors" placeholder="09:00 AM" />
                </div>
                <div>
                  <label className="text-label-sm text-on-surface-variant block mb-1" htmlFor="corr-out">Requested check-out</label>
                  <input id="corr-out" value={c.checkOut} onChange={(e) => c.setCheckOut(e.target.value)} onKeyDown={(e) => handleEnterAdvance(e)} className="w-full px-3 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-body-md focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-colors" placeholder="06:00 PM" />
                </div>
              </div>
              <div>
                <label className="text-label-sm text-on-surface-variant block mb-1" htmlFor="corr-approver-q">Approver <span className="text-error">*</span></label>
                <input id="corr-approver-q" value={c.approverQuery} onChange={(e) => c.setApproverQuery(e.target.value)} placeholder="Search department head or upper hierarchy…" className="w-full px-3 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-body-md focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-colors mb-2" />
                <Select value={c.approverId} onChange={c.setApproverId} options={c.filteredApprovers.map((o) => ({ value: o.id, label: `${o.name} (${o.title})` }))} minWidthClass="w-full max-w-none" placeholder="Select approver" />
              </div>
              <div>
                <label className="text-label-sm text-on-surface-variant block mb-1" htmlFor="corr-reason">Reason <span className="text-error">*</span></label>
                <textarea id="corr-reason" rows={3} value={c.reason} onChange={(e) => c.setReason(e.target.value)} onKeyDown={(e) => handleEnterAdvance(e)} className="w-full px-3 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-body-md resize-none focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-colors" placeholder="Explain why the record needs correction…" />
              </div>
            </div>
            <div className="p-5 border-t border-outline-variant flex justify-end gap-3">
              <Button variant="ghost" size="sm" onClick={() => c.setModalOpen(false)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={c.submit} isLoading={c.isSubmitting} disabled={!c.reason.trim() || !c.selectedDateId || !c.approverId}>Submit request</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
