import type { PaginationCursor, CursorPage } from '../types/pagination.types'

/** Apply keyset cursor filter for DESC ordering on (created_at, id). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
export function applyCursorFilter(query: any, cursor?: PaginationCursor | null): any {
  if (!cursor) return query
  const { createdAt, id } = cursor
  return query.or(`created_at.lt."${createdAt}",and(created_at.eq."${createdAt}",id.lt."${id}")`)
}

export function buildCursorPage<T extends { createdAt: string; id: string }>(
  items: T[],
  limit: number
): CursorPage<T> {
  const hasMore = items.length >= limit
  const last = items.length > 0 ? items[items.length - 1] : null
  return {
    items,
    hasMore,
    nextCursor: last ? { createdAt: last.createdAt, id: last.id } : null,
  }
}

/** Fetch all pages via cursor — avoids OFFSET while loading complete datasets (e.g. CSV export). */
export async function fetchAllWithCursor<T extends { createdAt: string; id: string }>(
  fetchPage: (cursor: PaginationCursor | null, limit: number) => Promise<T[]>,
  pageSize = 100
): Promise<T[]> {
  const all: T[] = []
  const seen = new Set<string>()
  let cursor: PaginationCursor | null = null

  for (;;) {
    const page = await fetchPage(cursor, pageSize)
    if (page.length === 0) break

    for (const item of page) {
      if (!seen.has(item.id)) {
        seen.add(item.id)
        all.push(item)
      }
    }

    if (page.length < pageSize) break
    const last = page[page.length - 1]
    if (!last) break
    cursor = { createdAt: last.createdAt, id: last.id }
  }

  return all
}
