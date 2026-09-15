import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  leaveAccrualPolicySchema,
  leaveTypeFormSchema,
  type LeaveAccrualPolicyInput,
  type LeaveTypeForm,
} from '../../schemas/leave'

export function useLeaveSettingsModal() {
  const [modalOpen, setModalOpen] = useState(false)

  const leaveTypeForm = useForm<LeaveTypeForm>({
    resolver: zodResolver(leaveTypeFormSchema),
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

export function useAccrualForm(initialData?: LeaveAccrualPolicyInput) {
  const form = useForm<LeaveAccrualPolicyInput>({
    resolver: zodResolver(leaveAccrualPolicySchema),
    defaultValues: initialData ?? {
      maxCarryOverDays: 0,
      minimumNoticeDays: 0,
    },
  })

  return form
}
