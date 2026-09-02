import { useState, useCallback } from 'react'
import type { OfficeLocationSchema } from '../schemas/offices'

export function useHeadOfficePicker(offices: OfficeLocationSchema[]) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [headId, setHeadId] = useState<string | number>('')

  const head = offices.find((o) => String(o.id) === String(headId)) ?? offices[0]

  const openPicker = useCallback(() => setPickerOpen(true), [])
  const closePicker = useCallback(() => setPickerOpen(false), [])
  const selectOffice = useCallback((id: string | number) => {
    setHeadId(id)
    setPickerOpen(false)
  }, [])

  return {
    pickerOpen,
    headId,
    head,
    openPicker,
    closePicker,
    selectOffice,
    setHeadId,
  }
}