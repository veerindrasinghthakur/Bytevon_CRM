import { useCallback, useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth/context/AuthContext'
import { useListControls } from '@/shared/hooks/useListControls'
import { queryKeys, invalidate } from '@/shared/lib/query-keys'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { toast } from '@/shared/hooks/use-toast'
import {
  listAttendanceCorrections,
  listApproverDirectory,
  listCorrectionCandidates,
  submitAttendanceCorrection,
} from '../api/my-work'
import type { AttendanceCorrectionRequest } from '../types'

const FILTER_DEFAULTS = {
  status: 'All',
}

export function useAttendanceCorrections() {
  const qc = useQueryClient()
  const controls = useListControls({
    filterDefaults: FILTER_DEFAULTS,
    pageSize: 50,
  })

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedDateId, setSelectedDateId] = useState('')
  const [checkIn, setCheckIn] = useState('09:00 AM')
  const [checkOut, setCheckOut] = useState('06:00 PM')
  const [reason, setReason] = useState('')
  const [approverId, setApproverId] = useState('')
  const [approverQuery, setApproverQuery] = useState('')
  const [localExtra, setLocalExtra] = useState<AttendanceCorrectionRequest[]>([])

  const statusParam =
    controls.filters.status && controls.filters.status !== 'All'
      ? controls.filters.status
      : undefined

  const listParams = {
    search: controls.debouncedSearch || undefined,
    status: statusParam,
    page: controls.page,
    pageSize: controls.pageSize,
  }

  const {
    data: listData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: queryKeys.myWork.corrections.list(listParams),
    queryFn: () => listAttendanceCorrections(listParams),
    placeholderData: (prev) => prev,
  })

  const { employmentId: selfEmploymentId } = useAuth()

  const {
    data: candidates = [],
    isLoading: candidatesLoading,
    isError: candidatesError,
  } = useQuery({
    queryKey: [...queryKeys.myWork.corrections.all, 'candidates'] as const,
    queryFn: listCorrectionCandidates,
  })

  const {
    data: approverDirectory = [],
    isLoading: approversLoading,
    isError: approversError,
  } = useQuery({
    queryKey: queryKeys.myWork.approvers(),
    queryFn: listApproverDirectory,
  })

  // Server order: requester's department head, then HR, then admin fallback.
  // Exclude self so department heads are routed to HR/admin (self-approval is
  // rejected server-side). Prefer department-head titles, then HR titles.
  const approvers = useMemo(() => {
    const withoutSelf = approverDirectory.filter((a) =>
      selfEmploymentId != null && a.employmentId != null
        ? a.employmentId !== selfEmploymentId
        : true,
    )
    const rank = (a: { title: string }) => {
      const t = a.title.toLowerCase()
      if (t.includes('department head')) return 0
      if (t === 'hr' || t.includes('hr ') || t.includes('human')) return 1
      if (t.includes('admin')) return 3
      return 2
    }
    return [...withoutSelf].sort((a, b) => rank(a) - rank(b))
  }, [approverDirectory, selfEmploymentId])

  // Default to the department head (first ordered approver) once the directory
  // loads, so the submit button is never stuck disabled on an empty selection.
  useEffect(() => {
    if (approvers.length > 0) {
      setApproverId((prev) =>
        prev && approvers.some((a) => a.id === prev) ? prev : (approvers[0]?.id ?? ''),
      )
    } else {
      setApproverId('')
    }
  }, [approvers])

  const requests = listData?.items ?? []
  const allRequests = useMemo(() => [...localExtra, ...requests], [localExtra, requests])

  const filteredApprovers = useMemo(() => {
    const q = approverQuery.trim().toLowerCase()
    if (!q) return approvers
    return approvers.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.title.toLowerCase().includes(q) ||
        (a.department ?? '').toLowerCase().includes(q),
    )
  }, [approvers, approverQuery])

  const visible = allRequests

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
      setApproverId(approvers[0]?.id ?? '')
      setApproverQuery('')
      setModalOpen(true)
    },
    [candidates, approvers],
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
    mutationFn: submitAttendanceCorrection,
    onSuccess: (created) => {
      setLocalExtra((prev) => [created, ...prev])
      void invalidate.myWorkCorrections(qc)
      setModalOpen(false)
      setReason('')
      toast.success('Correction submitted to your department head / HR')
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Could not submit the correction'))
    },
  })

  const submit = useCallback(() => {
    const row = candidates.find((c) => c.id === selectedDateId)
    const approver = approvers.find((a) => a.id === approverId)
    if (candidatesLoading) {
      toast.error('Attendance days are still loading — please wait')
      return
    }
    if (!row) {
      toast.error(
        candidates.length === 0
          ? 'No attendance days are eligible for correction'
          : 'Select an attendance day for the correction',
      )
      return
    }
    if (!reason.trim()) {
      toast.error('A reason is required to submit the correction')
      return
    }
    if (approversLoading) {
      toast.error('Approver list is still loading — please wait')
      return
    }
    if (!approver) {
      toast.error(
        approvers.length === 0
          ? 'No approvers available — your department head or HR is not configured'
          : 'Select your department head or HR as the approver',
      )
      return
    }
    if (
      selfEmploymentId != null &&
      approver.employmentId != null &&
      approver.employmentId === selfEmploymentId
    ) {
      toast.error('You cannot approve your own correction — pick your department head or HR')
      return
    }
    mutation.mutate({
      attendanceDayId: row.id,
      date: row.date,
      originalStatus: row.status,
      requestedCheckIn: checkIn,
      requestedCheckOut: checkOut,
      reason: reason.trim(),
      approver: approver.name,
      approverId: approver.id,
      targetDepartmentId: approver.departmentId,
    })
  }, [candidates, candidatesLoading, selectedDateId, reason, approverId, checkIn, checkOut, mutation, approvers, approversLoading, selfEmploymentId])

  return {
    isLoading,
    refetch,
    visible,
    total: listData?.total ?? visible.length,
    candidates,
    candidatesLoading,
    candidatesError,
    approversLoading,
    approversError,
    search: controls.search,
    setSearch: controls.setSearch,
    statusFilter: controls.filters.status,
    setStatusFilter: (v: string) => controls.setFilter('status', v),
    filtersActive: controls.anyActive,
    resetFilters: controls.resetAll,
    page: controls.page,
    setPage: controls.setPage,
    pageSize: controls.pageSize,
    setPageSize: controls.setPageSize,
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
