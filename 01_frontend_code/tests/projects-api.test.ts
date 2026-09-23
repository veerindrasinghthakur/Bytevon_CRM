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
  it('lists empty notes (backend not ready) and rejects createNote', async () => {
    const notes = await listNotes()
    expect(notes).toMatchObject({ items: [], total: 0 })
    await expect(
      createNote({ body: 't-note', referenceType: 'PROJECT', referenceId: 1 }),
    ).rejects.toThrow(/not implemented/i)
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
