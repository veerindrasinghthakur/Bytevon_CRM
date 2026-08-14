import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { Select } from '@/shared/components/ui/Select'
import { ListToolbar } from '@/shared/components/layout/ListToolbar'
import { handleEnterAdvance } from '@/shared/lib/enter-advance'
import { cn } from '@/shared/lib/cn'
import { attendanceHistory, myApprovals } from '../data/mock'

type CorrectionStatus = 'Pending' | 'Approved' | 'Rejected' | 'Draft'

interface CorrectionRequest {
  id: string
  date: string
  originalStatus: string
  requestedCheckIn: string
  requestedCheckOut: string
  reason: string
  status: CorrectionStatus
  submittedOn: string
}

const seedFromApprovals: CorrectionRequest[] = myApprovals
  .filter((a) => a.type === 'Attendance Correction')
  .map((a) => ({
    id: a.id,
    date: '2026-08-08',
    originalStatus: 'Half Day',
    requestedCheckIn: '09:15 AM',
    requestedCheckOut: '06:00 PM',
    reason: a.summary,
    status: a.status as CorrectionStatus,
    submittedOn: a.submittedOn,
  }))

const STATUS_STYLES: Record<CorrectionStatus, string> = {
  Pending: 'bg-amber-100 text-amber-800',
  Approved: 'bg-emerald-100 text-emerald-800',
  Rejected: 'bg-red-100 text-red-800',
  Draft: 'bg-surface-container-high text-on-surface-variant',
}

export function AttendanceCorrectionsPage() {
  const [requests, setRequests] = useState<CorrectionRequest[]>(seedFromApprovals)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedDateId, setSelectedDateId] = useState('')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [reason, setReason] = useState('')

  const candidates = attendanceHistory.filter(
    (r) => r.status === 'Half Day' || r.status === 'Absent' || Boolean(r.note)
  )

  const filtersActive = Boolean(search || statusFilter)

  const visible = useMemo(() => {
    let list = requests
    if (statusFilter) list = list.filter((r) => r.status === statusFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (r) =>
          r.date.includes(q) ||
          r.reason.toLowerCase().includes(q) ||
          r.originalStatus.toLowerCase().includes(q)
      )
    }
    return list
  }, [requests, search, statusFilter])

  const openNew = (preselectId?: string) => {
    setSelectedDateId(preselectId ?? candidates[0]?.id ?? '')
    const row = candidates.find((c) => c.id === (preselectId ?? candidates[0]?.id))
    setCheckIn(row?.checkIn && row.checkIn !== '—' ? row.checkIn : '09:00 AM')
    setCheckOut(row?.checkOut && row.checkOut !== '—' ? row.checkOut : '06:00 PM')
    setReason(row?.note ?? '')
    setModalOpen(true)
  }

  const submit = () => {
    const row = candidates.find((c) => c.id === selectedDateId)
    if (!row || !reason.trim()) return
    const next: CorrectionRequest = {
      id: `corr-${Date.now()}`,
      date: row.date,
      originalStatus: row.status,
      requestedCheckIn: checkIn,
      requestedCheckOut: checkOut,
      reason: reason.trim(),
      status: 'Pending',
      submittedOn: new Date().toISOString().slice(0, 10),
    }
    setRequests((prev) => [next, ...prev])
    setModalOpen(false)
    setReason('')
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Attendance corrections"
        description="Request changes to past attendance records when punch times or status need adjustment."
        showBack
        backTo="/my-work/attendance"
        backLabel="Back to attendance"
        actions={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<span className="material-symbols-outlined text-[18px]">add</span>}
            onClick={() => openNew()}
          >
            New correction
          </Button>
        }
      />

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by date or reason…"
        filtersActive={filtersActive}
        onResetFilters={() => {
          setSearch('')
          setStatusFilter('')
        }}
      >
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          placeholder="All statuses"
          options={[
            { value: 'Pending', label: 'Pending' },
            { value: 'Approved', label: 'Approved' },
            { value: 'Rejected', label: 'Rejected' },
          ]}
        />
      </ListToolbar>

      {/* Candidates */}
      <section className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-outline-variant/30 flex items-center justify-between">
          <div>
            <h3 className="text-title-lg text-on-background">Suggested days</h3>
            <p className="text-body-sm text-on-surface-variant mt-0.5">
              Half-days or records with notes are good candidates for a correction.
            </p>
          </div>
        </div>
        {candidates.length === 0 ? (
          <p className="p-6 text-body-md text-on-surface-variant">No correction candidates in mock data.</p>
        ) : (
          <ul className="divide-y divide-outline-variant/40">
            {candidates.map((r) => (
              <li
                key={r.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center gap-3 justify-between hover:bg-surface-container/40 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-body-md font-semibold text-on-background">{r.date}</p>
                  <p className="text-label-sm text-on-surface-variant mt-0.5">
                    {r.status}
                    {r.checkIn !== '—' ? ` · In ${r.checkIn}` : ''}
                    {r.checkOut !== '—' ? ` · Out ${r.checkOut}` : ''}
                    {r.note ? ` · ${r.note}` : ''}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => openNew(r.id)}>
                  Request correction
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Submitted requests */}
      <section className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-outline-variant/30">
          <h3 className="text-title-lg text-on-background">Your requests</h3>
        </div>
        {visible.length === 0 ? (
          <div className="p-10 text-center">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">
              edit_calendar
            </span>
            <p className="text-body-md text-on-surface-variant">No correction requests yet.</p>
            <Button className="mt-4" variant="primary" size="sm" onClick={() => openNew()}>
              New correction
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[720px]">
              <thead>
                <tr className="border-b border-outline-variant/30 bg-surface/50">
                  <th className="py-3 px-5 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                    Date
                  </th>
                  <th className="py-3 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                    Original
                  </th>
                  <th className="py-3 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                    Requested times
                  </th>
                  <th className="py-3 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="py-3 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                    Status
                  </th>
                  <th className="py-3 px-5 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider text-right">
                    Submitted
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {visible.map((r) => (
                  <tr key={r.id} className="h-16 hover:bg-surface-container/40 transition-colors">
                    <td className="py-2 px-5 text-body-md font-semibold text-on-background">{r.date}</td>
                    <td className="py-2 px-4 text-body-md text-on-surface-variant">{r.originalStatus}</td>
                    <td className="py-2 px-4 text-body-md text-on-background">
                      {r.requestedCheckIn} – {r.requestedCheckOut}
                    </td>
                    <td className="py-2 px-4 text-body-sm text-on-surface-variant max-w-[220px] truncate">
                      {r.reason}
                    </td>
                    <td className="py-2 px-4">
                      <span
                        className={cn(
                          'inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider',
                          STATUS_STYLES[r.status]
                        )}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-2 px-5 text-body-sm text-on-surface-variant text-right">
                      {r.submittedOn}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-body-sm text-on-surface-variant">
        Related:{' '}
        <Link to="/my-work/attendance" className="text-secondary hover:underline">
          My attendance
        </Link>
        {' · '}
        <Link to="/my-work/approvals" className="text-secondary hover:underline">
          My approvals
        </Link>
      </p>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-navy/40 backdrop-blur-sm">
          <div
            className="bg-surface-container-lowest w-full max-w-lg rounded-xl shadow-2xl border border-outline-variant flex flex-col max-h-[90vh] overflow-hidden"
            role="dialog"
            aria-labelledby="corr-title"
          >
            <div className="flex items-start justify-between p-5 border-b border-outline-variant">
              <div>
                <h2 id="corr-title" className="text-title-lg text-on-background font-bold">
                  New attendance correction
                </h2>
                <p className="text-body-sm text-on-surface-variant mt-1">
                  Correct punch times or status for a past day.
                </p>
              </div>
              <button
                type="button"
                className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container"
                aria-label="Close"
                onClick={() => setModalOpen(false)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="text-label-sm text-on-surface-variant block mb-1" htmlFor="corr-day">
                  Day
                </label>
                <select
                  id="corr-day"
                  value={selectedDateId}
                  onChange={(e) => {
                    setSelectedDateId(e.target.value)
                    const row = candidates.find((c) => c.id === e.target.value)
                    if (row) {
                      setCheckIn(row.checkIn !== '—' ? row.checkIn : '09:00 AM')
                      setCheckOut(row.checkOut !== '—' ? row.checkOut : '06:00 PM')
                    }
                  }}
                  className="w-full px-3 py-2.5 rounded-lg border border-outline-variant bg-surface text-body-md text-on-background focus:outline-none focus:ring-2 focus:ring-electric-blue"
                >
                  {candidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.date} · {c.status}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-label-sm text-on-surface-variant block mb-1" htmlFor="corr-in">
                    Requested check-in
                  </label>
                  <input
                    id="corr-in"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    onKeyDown={(e) => handleEnterAdvance(e)}
                    className="w-full px-3 py-2.5 rounded-lg border border-outline-variant bg-surface text-body-md focus:outline-none focus:ring-2 focus:ring-electric-blue"
                    placeholder="09:00 AM"
                  />
                </div>
                <div>
                  <label className="text-label-sm text-on-surface-variant block mb-1" htmlFor="corr-out">
                    Requested check-out
                  </label>
                  <input
                    id="corr-out"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    onKeyDown={(e) => handleEnterAdvance(e)}
                    className="w-full px-3 py-2.5 rounded-lg border border-outline-variant bg-surface text-body-md focus:outline-none focus:ring-2 focus:ring-electric-blue"
                    placeholder="06:00 PM"
                  />
                </div>
              </div>
              <div>
                <label className="text-label-sm text-on-surface-variant block mb-1" htmlFor="corr-reason">
                  Reason <span className="text-error">*</span>
                </label>
                <textarea
                  id="corr-reason"
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  onKeyDown={(e) => handleEnterAdvance(e)}
                  className="w-full px-3 py-2.5 rounded-lg border border-outline-variant bg-surface text-body-md resize-none focus:outline-none focus:ring-2 focus:ring-electric-blue"
                  placeholder="Explain why the record needs correction…"
                />
              </div>
            </div>

            <div className="p-5 border-t border-outline-variant flex justify-end gap-3">
              <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={submit}
                disabled={!reason.trim() || !selectedDateId}
              >
                Submit request
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
