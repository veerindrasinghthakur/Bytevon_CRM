import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys, invalidate } from '@/shared/lib/query-keys'
import { getBankDetails, saveBankDetails } from '../api/bank'
import { emptyBankForm, bankFormSchema } from '../schemas/bank-form'
import type { BankDetails, BankFormValues } from '../types'

export function useBankDetails() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.myWork.bankDetails(),
    queryFn: getBankDetails,
  })

  const save = useMutation({
    mutationFn: (values: BankFormValues) => saveBankDetails(values as BankDetails),
    onSuccess: () => {
      void invalidate.myWorkBank(qc)
    },
  })

  return {
    isLoading,
    saved: data ?? null,
    save,
    isSaving: save.isPending,
    emptyForm: emptyBankForm(),
    formSchema: bankFormSchema,
  }
}
