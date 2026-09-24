/**
 * Notifications — template domain (real API: GET/POST/PATCH /notifications/templates).
 * Templates have no delete endpoint (referenced by notifications); use is_active toggle.
 */
import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { delay } from '@/shared/mock/db'

export type NotificationTemplate = {
  id: number
  code: string
  title_template: string
  body_template: string
  variables: Record<string, unknown> | null
  is_active: boolean
  created_at?: string | null
  updated_at?: string | null
  changed_by?: number | null
}

export type TemplateCreateInput = {
  code: string
  title_template: string
  body_template: string
  variables?: Record<string, unknown> | null
  is_active?: boolean
}

export type TemplateUpdateInput = Partial<
  Pick<NotificationTemplate, 'title_template' | 'body_template' | 'variables' | 'is_active'>
>

let mockTemplates: NotificationTemplate[] = [
  {
    id: 1,
    code: 'WELCOME',
    title_template: 'Welcome {{name}}',
    body_template: 'Hello {{name}}, welcome aboard.',
    variables: { name: 'string' },
    is_active: true,
  },
  {
    id: 2,
    code: 'LEAVE_APPROVED',
    title_template: 'Leave approved',
    body_template: 'Your leave {{dates}} was approved.',
    variables: { dates: 'string' },
    is_active: true,
  },
]

function mapRow(r: Record<string, unknown>): NotificationTemplate {
  return {
    id: Number(r.id),
    code: String(r.code ?? ''),
    title_template: String(r.title_template ?? ''),
    body_template: String(r.body_template ?? ''),
    variables: (r.variables as Record<string, unknown> | null) ?? null,
    is_active: Boolean(r.is_active ?? true),
    created_at: (r.created_at as string | null) ?? null,
    updated_at: (r.updated_at as string | null) ?? null,
    changed_by: r.changed_by != null ? Number(r.changed_by) : null,
  }
}

export async function listTemplates(opts?: {
  activeOnly?: boolean
}): Promise<NotificationTemplate[]> {
  if (env.useMockApi) {
    await delay()
    return mockTemplates
      .filter((t) => !opts?.activeOnly || t.is_active)
      .map((t) => ({ ...t }))
  }
  const { data } = await apiClient.get<unknown>('/notifications/templates', {
    params: { active_only: opts?.activeOnly ?? false },
  })
  const rows = Array.isArray(data)
    ? data
    : ((data as { items?: unknown[] }).items ?? [])
  return (rows as Record<string, unknown>[]).map(mapRow)
}

export async function getTemplate(id: number): Promise<NotificationTemplate | null> {
  if (env.useMockApi) {
    await delay()
    return mockTemplates.find((t) => t.id === id) ?? null
  }
  try {
    const { data } = await apiClient.get<Record<string, unknown>>(
      `/notifications/templates/${id}`,
    )
    return mapRow(data)
  } catch {
    return null
  }
}

export async function createTemplate(input: TemplateCreateInput): Promise<NotificationTemplate> {
  if (env.useMockApi) {
    await delay(300)
    const row: NotificationTemplate = {
      id: Math.max(0, ...mockTemplates.map((t) => t.id)) + 1,
      code: input.code.trim(),
      title_template: input.title_template,
      body_template: input.body_template,
      variables: input.variables ?? null,
      is_active: input.is_active ?? true,
    }
    mockTemplates = [row, ...mockTemplates]
    return row
  }
  const { data } = await apiClient.post<Record<string, unknown>>('/notifications/templates', input)
  return mapRow(data)
}

export async function updateTemplate(
  id: number,
  input: TemplateUpdateInput,
): Promise<NotificationTemplate> {
  if (env.useMockApi) {
    await delay(300)
    const idx = mockTemplates.findIndex((t) => t.id === id)
    if (idx < 0) throw new Error('Template not found')
    mockTemplates[idx] = { ...mockTemplates[idx], ...input }
    return mockTemplates[idx]
  }
  const { data } = await apiClient.patch<Record<string, unknown>>(
    `/notifications/templates/${id}`,
    input,
  )
  return mapRow(data)
}
