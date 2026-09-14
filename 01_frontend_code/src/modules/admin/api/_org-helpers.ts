/**
 * Shared list normalizer for organization domain APIs.
 */
export function asList<T>(data: T[] | { items?: T[]; total?: number } | null | undefined): {
  items: T[]
  total: number
} {
  if (Array.isArray(data)) return { items: data, total: data.length }
  if (data && typeof data === 'object' && Array.isArray((data as { items?: T[] }).items)) {
    const items = (data as { items: T[] }).items
    return { items, total: (data as { total?: number }).total ?? items.length }
  }
  return { items: [], total: 0 }
}
