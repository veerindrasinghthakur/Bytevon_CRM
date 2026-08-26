import { useCallback, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useListControls } from '@/shared/hooks/useListControls'
import { queryKeys, invalidate } from '@/shared/lib/query-keys'
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

  const { data: candidates = [] } = useQuery({
    queryKey: [...queryKeys.myWork.corrections.all, 'candidates'] as const,
    queryFn: listCorrectionCandidates,
  })

  const { data: approvers = [] } = useQuery({
    queryKey: queryKeys.myWork.approvers(),
    queryFn: listApproverDirectory,
  })

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
    },
  })

  const submit = useCallback(() => {
    const row = candidates.find((c) => c.id === selectedDateId)
    const approver = approvers.find((a) => a.id === approverId)
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
  }, [candidates, selectedDateId, reason, approverId, checkIn, checkOut, mutation, approvers])

  return {
    isLoading,
    refetch,
    visible,
    total: listData?.total ?? visible.length,
    candidates,
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
