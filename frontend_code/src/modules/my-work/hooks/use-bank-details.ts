import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEditMode } from '@/shared/hooks/useEditMode'
import { getBankDetails, saveBankDetails } from '../api/bank'
import { currentUser } from '../data/mock'
import type { BankDetails } from '../types'

const EMPTY: BankDetails = {
  accountHolderName: '',
  bankName: '',
  accountNumber: '',
  confirmAccountNumber: '',
  ifscOrRouting: '',
  branchName: '',
  accountType: 'Salary',
  country: 'India',
  currency: 'INR',
}

export function useBankDetails() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['my-work', 'bank-details'],
    queryFn: getBankDetails,
  })

  const { isEditing, startEditing, cancelEditing, finishEditing } = useEditMode(false)
  const [draft, setDraft] = useState<BankDetails>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof BankDetails, string>>>({})
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (data) setDraft({ ...data, confirmAccountNumber: data.accountNumber })
  }, [data])

  const save = useMutation({
    mutationFn: () => saveBankDetails(draft),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-work', 'bank-details'] })
      finishEditing()
      setToast(data ? 'Bank details updated successfully.' : 'Bank details saved successfully.')
      window.setTimeout(() => setToast(null), 2800)
    },
  })

  const validate = (form: BankDetails) => {
    const next: Partial<Record<keyof BankDetails, string>> = {}
    if (!form.accountHolderName.trim()) next.accountHolderName = 'Required'
    if (!form.bankName.trim()) next.bankName = 'Required'
    if (!form.accountNumber.trim()) next.accountNumber = 'Required'
    if (form.accountNumber !== form.confirmAccountNumber) {
      next.confirmAccountNumber = 'Account numbers do not match'
    }
    if (!form.ifscOrRouting.trim()) next.ifscOrRouting = 'Required'
    if (!form.branchName.trim()) next.branchName = 'Required'
    return next
  }

  const beginEdit = () => {
    setDraft(
      data
        ? { ...data, confirmAccountNumber: data.accountNumber }
        : { ...EMPTY, accountHolderName: currentUser.name },
    )
    setErrors({})
    startEditing()
  }

  const onCancel = () => {
    if (data) setDraft({ ...data, confirmAccountNumber: data.accountNumber })
    else setDraft(EMPTY)
    setErrors({})
    cancelEditing()
  }

  const onSave = () => {
    const next = validate(draft)
    setErrors(next)
    if (Object.keys(next).length > 0) return
    save.mutate()
  }

  return {
    isLoading,
    saved: data ?? null,
    draft,
    setDraft,
    errors,
    toast,
    isEditing,
    isCreate: !data,
    beginEdit,
    onCancel,
    onSave,
    isSaving: save.isPending,
  }
}
