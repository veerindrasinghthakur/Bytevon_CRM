import { useCallback, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import {
  attendanceHistory,
  approverDirectory,
  correctionRequestsSeed,
} from '../data/mock'
import type { AttendanceCorrectionRequest, ApproverOption } from '../types'

function delay(ms = 200) {
  return new Promise((r) => setTimeout(r, ms))
}

async function listCorrections(): Promise<AttendanceCorrectionRequest[]> {
  if (env.useMockApi) {
    await delay()
    return correctionRequestsSeed.map((c) => ({ ...c }))
  }
  const { data } = await apiClient.get<AttendanceCorrectionRequest[]>('/my-work/attendance/corrections')
  return data
}

async function submitCorrection(
  body: Omit<AttendanceCorrectionRequest, 'id' | 'submittedOn' | 'status'>,
): Promise<AttendanceCorrectionRequest> {
  if (env.useMockApi) {
    await delay()
    return {
      ...body,
      id: `corr-${Date.now()}`,
      status: 'Pending',
      submittedOn: new Date().toISOString().slice(0, 10),
    }
  }
  const { data } = await apiClient.post<AttendanceCorrectionRequest>(
    '/my-work/attendance/corrections',
    body,
  )
  return data
}

export function useAttendanceCorrections() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedDateId, setSelectedDateId] = useState('')
  const [checkIn, setCheckIn] = useState('09:00 AM')
  const [checkOut, setCheckOut] = useState('06:00 PM')
  const [reason, setReason] = useState('')
  const [approverId, setApproverId] = useState(approverDirectory[0]?.id ?? '')
  const [approverQuery, setApproverQuery] = useState('')

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['my-work', 'attendance-corrections'],
    queryFn: listCorrections,
  })

  const [localExtra, setLocalExtra] = useState<AttendanceCorrectionRequest[]>([])

  const allRequests = useMemo(() => [...localExtra, ...requests], [localExtra, requests])

  const candidates = useMemo(
    () =>
      attendanceHistory.filter(
        (r) => r.status === 'Half Day' || r.status === 'Absent' || Boolean(r.note),
      ),
    [],
  )

  const filteredApprovers: ApproverOption[] = useMemo(() => {
    const q = approverQuery.trim().toLowerCase()
    if (!q) return approverDirectory
    return approverDirectory.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.title.toLowerCase().includes(q) ||
        (a.department ?? '').toLowerCase().includes(q),
    )
  }, [approverQuery])

  const visible = useMemo(() => {
    let list = allRequests
    if (statusFilter) list = list.filter((r) => r.status === statusFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (r) =>
          r.date.includes(q) ||
          r.reason.toLowerCase().includes(q) ||
          r.originalStatus.toLowerCase().includes(q) ||
          r.approver.toLowerCase().includes(q),
      )
    }
    return list
  }, [allRequests, search, statusFilter])

  const openNew = useCallback(
    (preselectId?: string) => {
      const id = preselectId ?? candidates[0]?.id ?? ''
      setSelectedDateId(id)
      const row = candidates.find((c) => c.id === id)
      const inTime = row?.checkIn && row.checkIn !== '—' ? row.checkIn : '09:00 AM'
      const outTime = row?.checkOut && row.checkOut !== '—' ? row.checkOut : '06:00 PM'
      setCheckIn(inTime)
      setCheckOut(outTime)
      setReason(row?.note ?? '')
      setApproverId(approverDirectory[0]?.id ?? '')
      setApproverQuery('')
      setModalOpen(true)
    },
    [candidates],
  )

  const onSelectDay = useCallback(
    (id: string) => {
      setSelectedDateId(id)
      const row = candidates.find((c) => c.id === id)
      if (!row) return
      setCheckIn(row.checkIn && row.checkIn !== '—' ? row.checkIn : '09:00 AM')
      setCheckOut(row.checkOut && row.checkOut !== '—' ? row.checkOut : '06:00 PM')
    },
    [candidates],
  )

  const mutation = useMutation({
    mutationFn: submitCorrection,
    onSuccess: (created) => {
      setLocalExtra((prev) => [created, ...prev])
      qc.invalidateQueries({ queryKey: ['my-work', 'attendance-corrections'] })
      setModalOpen(false)
      setReason('')
    },
  })

  const submit = useCallback(() => {
    const row = candidates.find((c) => c.id === selectedDateId)
    const approver = approverDirectory.find((a) => a.id === approverId)
    if (!row || !reason.trim() || !approver) return
    mutation.mutate({
      date: row.date,
      originalStatus: row.status,
      requestedCheckIn: checkIn,
      requestedCheckOut: checkOut,
      reason: reason.trim(),
      approver: approver.name,
      approverId: approver.id,
    })
  }, [candidates, selectedDateId, reason, approverId, checkIn, checkOut, mutation])

  return {
    isLoading,
    visible,
    candidates,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    filtersActive: Boolean(search || statusFilter),
    resetFilters: () => {
      setSearch('')
      setStatusFilter('')
    },
    modalOpen,
    setModalOpen,
    openNew,
    selectedDateId,
    onSelectDay,
    checkIn,
    setCheckIn,
    checkOut,
    setCheckOut,
    reason,
    setReason,
    approverId,
    setApproverId,
    approverQuery,
    setApproverQuery,
    filteredApprovers,
    submit,
    isSubmitting: mutation.isPending,
  }
}
