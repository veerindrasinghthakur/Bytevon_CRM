import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/query-keys'
import {
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  type TemplateCreateInput,
  type TemplateUpdateInput,
} from '../../api/template'

export const TEMPLATES_KEY = [...queryKeys.notifications.all, 'templates'] as const

/** Single coherent templates hook: list/detail + create/update + active toggle. */
export function useTemplates(opts?: { activeOnly?: boolean }) {
  const qc = useQueryClient()
  const activeOnly = opts?.activeOnly ?? false

  const query = useQuery({
    queryKey: [...TEMPLATES_KEY, { activeOnly }],
    queryFn: () => listTemplates({ activeOnly }),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: TEMPLATES_KEY })
    void qc.invalidateQueries({ queryKey: queryKeys.notifications.triggers() })
  }

  const createMut = useMutation({
    mutationFn: (input: TemplateCreateInput) => createTemplate(input),
    onSuccess: () => invalidate(),
  })
  const updateMut = useMutation({
    mutationFn: ({ id, input }: { id: number; input: TemplateUpdateInput }) =>
      updateTemplate(id, input),
    onSuccess: () => invalidate(),
  })
  const toggleMut = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      updateTemplate(id, { is_active }),
    onSuccess: () => invalidate(),
  })

  const items = query.data ?? []

  return {
    items,
    total: items.length,
    active: items.filter((t) => t.is_active).length,
    inactive: items.filter((t) => !t.is_active).length,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    createTemplate: createMut.mutateAsync,
    updateTemplate: updateMut.mutateAsync,
    toggleActive: toggleMut.mutateAsync,
    isMutating: createMut.isPending || updateMut.isPending || toggleMut.isPending,
  }
}

export function useTemplate(id: number | undefined) {
  return useQuery({
    queryKey: [...TEMPLATES_KEY, 'detail', id ?? 0],
    queryFn: () => getTemplate(id!),
    enabled: id != null && Number.isFinite(id),
  })
}
