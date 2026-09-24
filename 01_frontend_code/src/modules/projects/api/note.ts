/**
 * Notes API — real backend operations under /projects/notes.
 * Backend NoteReferenceType: LEAD | TASK | CLIENT (PROJECT excluded per
 * backend lock); project-level notes ride on a TASK reference carrying the
 * project id (same convention as ProjectNotesPage). Field map (snake_case):
 * title, content, reference_type, reference_id, created_at, updated_at,
 * changed_by.
 */
import { env } from '@/config/env'
import { apiClient } from '@/shared/lib/axios'
import { delay } from '@/shared/mock/db'
import { projectNotes as seedNotes } from '../data/notesMock'

export interface BackendNote {
  id: number
  title: string
  body: string
  author: string
  createdAt: string
  updatedAt?: string
  referenceType: string
  referenceId: number
}

function mapApiNote(row: Record<string, unknown>): BackendNote {
  return {
    id: Number(row.id),
    title: String(row.title ?? ''),
    body: String(row.content ?? row.body ?? ''),
    author:
      (row.author_name as string | undefined) ??
      (row.author as string | undefined) ??
      (row.changed_by != null ? `Emp #${row.changed_by}` : '—'),
    createdAt: String(row.created_at ?? row.createdAt ?? new Date().toISOString()),
    updatedAt:
      (row.updated_at as string | undefined) ??
      (row.updatedAt as string | undefined) ??
      undefined,
    referenceType: String(row.reference_type ?? row.referenceType ?? ''),
    referenceId: Number(row.reference_id ?? row.referenceId ?? 0),
  }
}

export async function listNotes(params?: {
  referenceType?: string
  referenceId?: number
}): Promise<{ items: BackendNote[]; total: number }> {
  if (!env.useMockApi && params?.referenceType && params?.referenceId != null) {
    const { data } = await apiClient.get<Array<Record<string, unknown>>>('/projects/notes', {
      params: {
        reference_type: params.referenceType,
        reference_id: params.referenceId,
      },
    })
    const items = (Array.isArray(data) ? data : []).map(mapApiNote)
    return { items, total: items.length }
  }
  await delay()
  let items = seedNotes.map((n) => ({
    id: Number(n.id),
    title: '',
    body: n.body,
    author: n.author_name,
    createdAt: n.created_at,
    referenceType: String(n.reference_type ?? ''),
    referenceId: Number(n.reference_id ?? 0),
  }))
  if (params?.referenceType) {
    items = items.filter((n) => n.referenceType === params.referenceType)
  }
  if (params?.referenceId != null) {
    items = items.filter((n) => n.referenceId === params.referenceId)
  }
  return { items, total: items.length }
}

export async function createNote(input: {
  title: string
  body: string
  referenceType: string
  referenceId: number
}): Promise<BackendNote> {
  if (!env.useMockApi) {
    const { data } = await apiClient.post<Record<string, unknown>>('/projects/notes', {
      reference_type: input.referenceType,
      reference_id: input.referenceId,
      title: input.title.trim() || 'Note',
      content: input.body.trim(),
    })
    return mapApiNote(data)
  }
  await delay(300)
  return {
    id: Date.now(),
    title: input.title,
    body: input.body,
    author: 'You',
    createdAt: new Date().toISOString(),
    referenceType: input.referenceType,
    referenceId: input.referenceId,
  }
}

export async function updateNote(
  id: number,
  patch: { title?: string; body?: string },
): Promise<BackendNote> {
  if (!env.useMockApi) {
    const body: Record<string, unknown> = {}
    if (patch.title !== undefined) body.title = patch.title
    if (patch.body !== undefined) body.content = patch.body
    const { data } = await apiClient.patch<Record<string, unknown>>(
      `/projects/notes/${id}`,
      body,
    )
    return mapApiNote(data)
  }
  throw new Error('Notes API not implemented yet')
}
