/**
 * Merged payroll hooks — pages import from this module
 * (thin re-export files keep old import paths working).
 */
import { useMemo, useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys, invalidate } from '@/shared/lib/query-keys'
import { useListControls } from '@/shared/hooks/useListControls'
import {
  approvePayrollEmployee,
  getMonthlyPayrollSummary,
  getPayrollEmployee,
  getPayrollKpis,
  getPayrollPeriodMeta,
  getPayrollReview,
  getPayslip,
  getRunPayrollChecks,
  getRunPayrollPreview,
  getSalaryStructure,
  listEmployeePayrollHistory,
  listPayrollActivity,
  listPayrollEmployees,
  payPayrollEmployee,
  saveSalaryStructure,
} from '../api/payroll'
import { formatMoney, formatMoneyShort, structureGross } from '@/shared/mock/data/payroll'
import type { SalaryItem } from '../types'

export function usePayrollDashboard() {
  const kpisQuery = useQuery({ queryKey: queryKeys.payroll.kpis(), queryFn: getPayrollKpis })
  const periodQuery = useQuery({ queryKey: queryKeys.payroll.period(), queryFn: getPayrollPeriodMeta })
  const activityQuery = useQuery({
    queryKey: queryKeys.payroll.activity(),
    queryFn: listPayrollActivity,
  })
  const employeesQuery = useQuery({
    queryKey: queryKeys.payroll.employees.list({ scope: 'dashboard', page: 1, pageSize: 20 }),
    queryFn: () => listPayrollEmployees({ page: 1, pageSize: 20 }),
  })

  return {
    kpis: kpisQuery.data,
    period: periodQuery.data,
    activity: activityQuery.data ?? [],
    employees: employeesQuery.data?.items ?? [],
    formatMoney,
    formatMoneyShort,
    isLoading:
      kpisQuery.isLoading ||
      periodQuery.isLoading ||
      activityQuery.isLoading ||
      employeesQuery.isLoading,
  }
}

export function useMonthlyPayroll() {
  const controls = useListControls({
    filterDefaults: { status: 'All' },
    pageSize: 20,
  })

  const params = {
    search: controls.search || undefined,
    status: controls.filters.status || undefined,
    page: controls.page,
    pageSize: controls.pageSize,
  }

  const employeesQuery = useQuery({
    queryKey: queryKeys.payroll.employees.list(params),
    queryFn: () => listPayrollEmployees(params),
    placeholderData: (prev) => prev,
  })

  const summaryQuery = useQuery({
    queryKey: queryKeys.payroll.monthlySummary(),
    queryFn: getMonthlyPayrollSummary,
  })

  const filtered = employeesQuery.data?.items ?? []
  const total = employeesQuery.data?.total ?? 0
  const metrics = employeesQuery.data?.metrics ?? summaryQuery.data

  const totals = useMemo(() => {
    const gross = filtered.reduce((s, e) => s + e.gross, 0)
    const net = filtered.reduce((s, e) => s + e.net, 0)
    const earnings = filtered.reduce((s, e) => s + e.earnings, 0)
    const deductions = filtered.reduce((s, e) => s + e.deductions, 0)
    return { gross, net, earnings, deductions, count: filtered.length }
  }, [filtered])

  return {
    filtered,
    total,
    totals,
    summary: metrics,
    search: controls.search,
    setSearch: controls.setSearch,
    statusFilter: controls.filters.status,
    setStatusFilter: (v: string) => controls.setFilter('status', v),
    page: controls.page,
    setPage: controls.setPage,
    pageSize: controls.pageSize,
    setPageSize: controls.setPageSize,
    formatMoney,
    allCount: total,
    isLoading: employeesQuery.isLoading || summaryQuery.isLoading,
    isError: employeesQuery.isError || summaryQuery.isError,
    refetch: () => {
      void employeesQuery.refetch()
      void summaryQuery.refetch()
    },
  }
}

export function usePayrollReview() {
  const { employeeId } = useParams({ strict: false }) as { employeeId?: string }
  const id = employeeId ?? ''
  const qc = useQueryClient()
  const [showPayModal, setShowPayModal] = useState(false)
  const [paymentRef, setPaymentRef] = useState('')

  const query = useQuery({
    queryKey: queryKeys.payroll.review(id),
    queryFn: () => getPayrollReview(id),
    enabled: Boolean(id),
  })

  const review = query.data
  const emp = review?.employee

  const approveMut = useMutation({
    mutationFn: () => approvePayrollEmployee(id),
    onSuccess: () => invalidate.payroll(qc),
  })
  const payMut = useMutation({
    mutationFn: (ref?: string) => payPayrollEmployee(id, ref),
    onSuccess: () => invalidate.payroll(qc),
  })

  const attendanceSummary: [string, string][] = review
    ? [
        ['Working Days', String(review.attendance.workingDays)],
        ['Present Days', String(review.attendance.presentDays)],
        ['Paid Leave', String(review.attendance.paidLeave)],
        ['LOP Days', String(review.attendance.lopDays)],
        ['Working Hours', `${review.attendance.workingHours}h`],
        ['Overtime Hours', `${review.attendance.overtimeHours}h`],
      ]
    : []

  return {
    emp: emp ?? null,
    review,
    showPayModal,
    setShowPayModal,
    paymentRef,
    setPaymentRef,
    gross: review?.gross ?? 0,
    totalEarnings: review?.totalEarnings ?? 0,
    totalDeductions: review?.totalDeductions ?? 0,
    netAdj: review?.netAdjustments ?? 0,
    netPayable: review?.netPayable ?? 0,
    attendanceSummary,
    earnings: review?.earnings ?? [],
    deductions: review?.deductions ?? [],
    adjustments: review?.adjustments ?? [],
    formatMoney,
    periodLabel: review?.periodLabel ?? '',
    isLoading: query.isLoading,
    isError: query.isError || (!query.isLoading && !review),
    refetch: query.refetch,
    approveMut,
    payMut,
  }
}

export function usePayslip() {
  const { employeeId } = useParams({ strict: false }) as { employeeId?: string }
  const id = employeeId ?? ''

  const query = useQuery({
    queryKey: queryKeys.payroll.payslip(id),
    queryFn: () => getPayslip(id),
    enabled: Boolean(id),
  })

  return {
    payslip: query.data ?? null,
    emp: query.data?.employee ?? null,
    formatMoney,
    isLoading: query.isLoading,
    isError: query.isError || (!query.isLoading && !query.data),
  }
}

export function useSalaryList() {
  const controls = useListControls({ filterDefaults: {}, pageSize: 20 })
  const params = {
    search: controls.search || undefined,
    page: controls.page,
    pageSize: controls.pageSize,
  }

  const query = useQuery({
    queryKey: queryKeys.payroll.employees.list({ ...params, scope: 'salary' }),
    queryFn: () => listPayrollEmployees(params),
    placeholderData: (prev) => prev,
  })

  return {
    rows: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    search: controls.search,
    setSearch: controls.setSearch,
    page: controls.page,
    setPage: controls.setPage,
    pageSize: controls.pageSize,
    setPageSize: controls.setPageSize,
    formatMoney,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  }
}

export function useSalaryDetail() {
  const { employeeId } = useParams({ strict: false }) as { employeeId?: string }
  const id = employeeId ?? ''

  const empQuery = useQuery({
    queryKey: queryKeys.payroll.employees.detail(id),
    queryFn: () => getPayrollEmployee(id),
    enabled: Boolean(id),
  })
  const structureQuery = useQuery({
    queryKey: queryKeys.payroll.salary(id),
    queryFn: () => getSalaryStructure(id),
    enabled: Boolean(id),
  })

  const structure = structureQuery.data
  const gross = structure ? structureGross(structure) : empQuery.data?.gross ?? 0

  return {
    emp: empQuery.data ?? null,
    structure,
    gross,
    formatMoney,
    isLoading: empQuery.isLoading || structureQuery.isLoading,
  }
}

export function useReviseSalary() {
  const { employeeId } = useParams({ strict: false }) as { employeeId?: string }
  const id = employeeId ?? ''
  const qc = useQueryClient()

  const empQuery = useQuery({
    queryKey: queryKeys.payroll.employees.detail(id),
    queryFn: () => getPayrollEmployee(id),
    enabled: Boolean(id),
  })
  const structureQuery = useQuery({
    queryKey: queryKeys.payroll.salary(id),
    queryFn: () => getSalaryStructure(id),
    enabled: Boolean(id),
  })

  const structure = structureQuery.data
  const [rows, setRows] = useState<SalaryItem[] | null>(null)
  const [effectiveFrom, setEffectiveFrom] = useState('')

  if (structure && rows === null) {
    setRows(structure.items.map((i) => ({ ...i })))
    setEffectiveFrom(structure.effectiveFrom)
  }

  const draft = rows ?? []
  const totalEarnings = draft.filter((r) => r.type === 'EARNING').reduce((s, r) => s + r.amount, 0)
  const totalDeductions = draft.filter((r) => r.type === 'DEDUCTION').reduce((s, r) => s + r.amount, 0)
  const net = totalEarnings - totalDeductions

  const saveMut = useMutation({
    mutationFn: () =>
      saveSalaryStructure(id, {
        effectiveFrom: effectiveFrom || new Date().toISOString().slice(0, 10),
        items: draft,
      }),
    onSuccess: (saved) => {
      qc.setQueryData(queryKeys.payroll.salary(id), saved)
      invalidate.payrollEmployees(qc)
    },
  })

  const addRow = () => {
    setRows((prev) => [
      ...(prev ?? []),
      { id: `new-${Date.now()}`, name: '', type: 'EARNING', amount: 0 },
    ])
  }

  const removeRow = (rowId: string) => setRows((prev) => (prev ?? []).filter((r) => r.id !== rowId))

  const updateRow = (rowId: string, patch: Partial<SalaryItem>) => {
    setRows((prev) => (prev ?? []).map((r) => (r.id === rowId ? { ...r, ...patch } : r)))
  }

  return {
    emp: empQuery.data ?? null,
    rows: draft,
    effectiveFrom,
    setEffectiveFrom,
    totalEarnings,
    totalDeductions,
    net,
    formatMoney,
    addRow,
    removeRow,
    updateRow,
    saveMut,
    isLoading: empQuery.isLoading || structureQuery.isLoading,
  }
}

export function useEmployeePayrollHistory() {
  const { employeeId } = useParams({ strict: false }) as { employeeId?: string }
  const id = employeeId ?? ''

  const empQuery = useQuery({
    queryKey: queryKeys.payroll.employees.detail(id),
    queryFn: () => getPayrollEmployee(id),
    enabled: Boolean(id),
  })
  const historyQuery = useQuery({
    queryKey: queryKeys.payroll.history(id),
    queryFn: () => listEmployeePayrollHistory(id),
    enabled: Boolean(id),
  })
  const structureQuery = useQuery({
    queryKey: queryKeys.payroll.salary(id),
    queryFn: () => getSalaryStructure(id),
    enabled: Boolean(id),
  })

  const historyRows = historyQuery.data ?? []
  const ytdNet = historyRows.filter((r) => r.year === 2026).reduce((s, r) => s + r.net, 0)
  const currentGross = structureQuery.data
    ? structureGross(structureQuery.data)
    : empQuery.data?.gross ?? 0
  const avgNet =
    historyRows.length > 0
      ? Math.round(historyRows.reduce((s, r) => s + r.net, 0) / historyRows.length)
      : 0

  const summaryCards = [
    {
      id: 'gross',
      label: 'Current Gross Salary',
      icon: 'payments',
      value: formatMoney(currentGross),
      subtitle: 'Per pay period',
    },
    {
      id: 'net',
      label: 'Average Net (history)',
      icon: 'account_balance_wallet',
      value: formatMoney(avgNet),
      subtitle: 'From paid periods',
    },
    {
      id: 'ytd',
      label: 'Total Paid This Year (YTD)',
      icon: 'insights',
      value: formatMoney(ytdNet),
      subtitle: 'YTD 2026',
    },
  ]

  return {
    emp: empQuery.data ?? null,
    historyRows,
    summaryCards,
    totalResults: historyRows.length,
    pageSize: historyRows.length,
    formatMoney,
    isLoading: empQuery.isLoading || historyQuery.isLoading,
  }
}

export function useRunPayroll() {
  const checksQuery = useQuery({
    queryKey: queryKeys.payroll.runChecks(),
    queryFn: getRunPayrollChecks,
  })
  const previewQuery = useQuery({
    queryKey: queryKeys.payroll.runPreview(),
    queryFn: getRunPayrollPreview,
  })

  const preview = previewQuery.data
  const previewMetrics = preview
    ? [
        { label: 'Total Employees', value: String(preview.employees.length) },
        { label: 'Gross Salary', value: formatMoney(preview.totalGross) },
        {
          label: 'Total Additions',
          value: `+${formatMoney(preview.totalEarnings)}`,
          valueClass: 'text-success-emerald',
        },
        {
          label: 'Total Deductions',
          value: `-${formatMoney(preview.totalDeductions)}`,
          valueClass: 'text-error',
        },
      ]
    : []

  return {
    checks: checksQuery.data ?? [],
    previewMetrics,
    previewRows: (preview?.employees ?? []).slice(0, 4),
    estimatedNet: preview ? formatMoney(preview.estimatedNet) : formatMoney(0),
    employeeCount: preview?.employees.length ?? 0,
    formatMoney,
    isLoading: checksQuery.isLoading || previewQuery.isLoading,
  }
}
