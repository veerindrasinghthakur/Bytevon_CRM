/** Notes API — backend not ready. Placeholder only. */
// TODO: wire to Notes public service when available
export async function listNotes(_params?: { referenceType?: string; referenceId?: number }) {
  return { items: [] as Array<{ id: string; body: string; author: string; createdAt: string }>, total: 0 }
}
export async function createNote(_input: { body: string; referenceType: string; referenceId: number }) {
  throw new Error('Notes API not implemented yet')
}
