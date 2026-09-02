import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { LeaveAccrualPolicy } from '../types'

const leaveTypeSchema = z.object({
  name: z.string().min(1, 'Leave type name is required'),
  days: z.coerce.number().min(0),
  eligibility: z.string().min(1, 'Eligibility is required'),
})

type LeaveTypeForm = z.infer<typeof leaveTypeSchema>

const accrualSchema: z.ZodType<LeaveAccrualPolicy> = z.object({
  maxCarryOverDays: z.number().min(0),
  minimumNoticeDays: z.number().min(0),
})

export function useLeaveSettingsModal() {
  const [modalOpen, setModalOpen] = useState(false)

  const leaveTypeForm = useForm<LeaveTypeForm>({
    resolver: zodResolver(leaveTypeSchema),
    defaultValues: {
      name: '',
      days: 10,
      eligibility: 'All Employees',
    },
  })

  const openModal = useCallback(() => {
    leaveTypeForm.reset({ name: '', days: 10, eligibility: 'All Employees' })
    setModalOpen(true)
  }, [leaveTypeForm])

  const closeModal = useCallback(() => {
    setModalOpen(false)
  }, [])

  return {
    modalOpen,
    leaveTypeForm,
    openModal,
    closeModal,
  }
}

export function useAccrualForm(initialData?: LeaveAccrualPolicy) {
  const form = useForm<LeaveAccrualPolicy>({
    resolver: zodResolver(accrualSchema),
    defaultValues: initialData ?? {
      maxCarryOverDays: 0,
      minimumNoticeDays: 0,
    },
  })

  return form
}