import { useState, useCallback, useEffect, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/query-keys'
import { listHeadOfficeOptions, type HeadOfficeOption } from '../api/offices'
import {
  getOrganizationSettings,
  updateOrganizationSettings,
} from '../api/organization'

export function useHeadOfficePicker() {
  const queryClient = useQueryClient()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const locationsQuery = useQuery({
    queryKey: queryKeys.admin.offices.headOptions(),
    queryFn: listHeadOfficeOptions,
  })

  const settingsQuery = useQuery({
    queryKey: queryKeys.organization.settings(),
    queryFn: getOrganizationSettings,
  })

  const offices = locationsQuery.data ?? []
  const settings = settingsQuery.data

  useEffect(() => {
    const hid = settings?.head_office_location_id
    if (hid != null && Number(hid) > 0) {
      setSelectedId(String(hid))
    }
  }, [settings?.head_office_location_id])

  const head: HeadOfficeOption | null = useMemo(() => {
    if (!offices.length) return null
    if (selectedId) {
      const match = offices.find((o) => String(o.id) === String(selectedId))
      if (match) return match
    }
    const fromSettings = settings?.head_office_location_id
    if (fromSettings != null) {
      const match = offices.find((o) => String(o.id) === String(fromSettings))
      if (match) return match
    }
    return null
  }, [offices, selectedId, settings?.head_office_location_id])

  const saveMutation = useMutation({
    mutationFn: (locationId: number) =>
      updateOrganizationSettings({ head_office_location_id: locationId }),
    onSuccess: (data) => {
      setError(null)
      setSelectedId(
        data.head_office_location_id != null ? String(data.head_office_location_id) : null,
      )
      void queryClient.invalidateQueries({ queryKey: queryKeys.organization.settings() })
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.offices.headOptions() })
      setPickerOpen(false)
    },
    onError: (e: Error) => {
      setError(e?.message || 'Could not update head office')
    },
  })

  const openPicker = useCallback(() => {
    setError(null)
    setPickerOpen(true)
  }, [])
  const closePicker = useCallback(() => {
    setPickerOpen(false)
    setError(null)
  }, [])

  const selectOffice = useCallback(
    (id: string | number) => {
      const num = Number(id)
      if (!Number.isFinite(num) || num <= 0) {
        setError('Invalid location')
        return
      }
      setSelectedId(String(id))
      saveMutation.mutate(num)
    },
    [saveMutation],
  )

  return {
    offices,
    pickerOpen,
    headId: selectedId,
    head,
    isLoading: locationsQuery.isLoading || settingsQuery.isLoading,
    isError: locationsQuery.isError || settingsQuery.isError,
    isSaving: saveMutation.isPending,
    error:
      error ||
      (locationsQuery.isError ? 'Could not load locations' : null) ||
      (settingsQuery.isError ? 'Could not load organization settings' : null),
    openPicker,
    closePicker,
    selectOffice,
    refetch: () => {
      void locationsQuery.refetch()
      void settingsQuery.refetch()
    },
  }
}
