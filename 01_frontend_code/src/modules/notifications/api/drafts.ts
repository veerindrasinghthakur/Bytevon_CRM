/**
 * Notification drafts — real GET/POST/PUT/DELETE /notifications/drafts.
 */
import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { delay } from '@/shared/mock/db'

export interface NotificationDraft {
  id: number
  title: string
  body: string
  priority: string
  module_ctx: string
  broadcast_all: boolean
  roles: string[]
  employment_ids: number[]
  channels: Record<string, unknown>
  template_code: string | null
  schedule_mode: string
  schedule_at: string | null
  created_at: string
  updated_at: string
}

export interface DraftInput {
  title?: string
  body?: string
  priority?: string
  module_ctx?: string
  broadcast_all?: boolean
  roles?: string[]
  employment_ids?: number[]
  channels?: Record<string, unknown>
  template_code?: string | null
  schedule_mode?: string
  schedule_at?: string | null
}

let mockDrafts: NotificationDraft[] = []
let mockSeq = 1

function toSnake(input: DraftInput): Record<string, unknown> {
  return {
    title: input.title ?? '',
    body: input.body ?? '',
    priority: input.priority ?? 'Normal',
    module_ctx: input.module_ctx ?? '',
    broadcast_all: input.broadcast_all ?? false,
    roles: input.roles ?? [],
    employment_ids: input.employment_ids ?? [],
    channels: input.channels ?? {},
    template_code: input.template_code ?? null,
    schedule_mode: input.schedule_mode ?? 'now',
    schedule_at: input.schedule_at ?? null,
  }
}

function toCamel(row: NotificationDraft): DraftInput & { id: number } {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    priority: row.priority,
    module_ctx: row.module_ctx,
    broadcast_all: row.broadcast_all,
    roles: row.roles,
    employment_ids: row.employment_ids,
    channels: row.channels,
    template_code: row.template_code,
    schedule_mode: row.schedule_mode,
    schedule_at: row.schedule_at,
  }
}

export async function listDrafts(): Promise<NotificationDraft[]> {
  if (env.useMockApi) {
    await delay(120)
    return mockDrafts.map((d) => ({ ...d }))
  }
  const { data } = await apiClient.get<NotificationDraft[]>('/notifications/drafts')
  return data
}

export async function createDraft(input: DraftInput): Promise<NotificationDraft> {
  if (env.useMockApi) {
    await delay(150)
    const now = new Date().toISOString()
    const row: NotificationDraft = {
      id: mockSeq++,
      title: input.title ?? '',
      body: input.body ?? '',
      priority: input.priority ?? 'Normal',
      module_ctx: input.module_ctx ?? '',
      broadcast_all: input.broadcast_all ?? false,
      roles: input.roles ?? [],
      employment_ids: input.employment_ids ?? [],
      channels: (input.channels ?? {}) as Record<string, unknown>,
      template_code: input.template_code ?? null,
      schedule_mode: input.schedule_mode ?? 'now',
      schedule_at: input.schedule_at ?? null,
      created_at: now,
      updated_at: now,
    }
    mockDrafts = [row, ...mockDrafts]
    return { ...row }
  }
  const { data } = await apiClient.post<NotificationDraft>('/notifications/drafts', toSnake(input))
  return data
}

export async function deleteDraft(id: number): Promise<void> {
  if (env.useMockApi) {
    await delay(120)
    mockDrafts = mockDrafts.filter((d) => d.id !== id)
    return
  }
  await apiClient.delete(`/notifications/drafts/${id}`)
}

export { toCamel as draftToForm }
