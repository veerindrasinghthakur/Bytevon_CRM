import { describe, expect, it } from 'vitest'
import { formatFileSize, listDocuments } from '@/modules/projects/api/document'
import { createNote, listNotes } from '@/modules/projects/api/note'
import { getProjects } from '@/modules/projects/api/project'
import { getTasks } from '@/modules/projects/api/task'

describe('formatFileSize', () => {
  it('formats bytes/kb/mb and dashes empty input', () => {
    expect(formatFileSize(0)).toBe('—')
    expect(formatFileSize(512)).toBe('512 B')
    expect(formatFileSize(2048)).toMatch(/KB/i)
    expect(formatFileSize(5 * 1024 * 1024)).toMatch(/MB/i)
  })
})

describe('projects mock API', () => {
  it('lists seed notes filtered by reference and creates a note', async () => {
    const notes = await listNotes({ referenceType: 'TASK', referenceId: 1042 })
    expect(notes.total).toBe(3)
    const all = await listNotes()
    expect(all.total).toBeGreaterThanOrEqual(3)
    const created = await createNote({
      title: 't-title',
      body: 't-note',
      referenceType: 'TASK',
      referenceId: 1042,
    })
    expect(created).toMatchObject({
      title: 't-title',
      body: 't-note',
      referenceType: 'TASK',
      referenceId: 1042,
    })
  })
  it('lists documents, projects and tasks', async () => {
    const docs = await listDocuments()
    expect(Array.isArray(docs.items ?? docs)).toBe(true)
    const projects = await getProjects()
    expect(Array.isArray(projects.items ?? projects)).toBe(true)
    const tasks = await getTasks()
    expect(Array.isArray(tasks.items ?? tasks)).toBe(true)
  })
})
