import { useCallback, useState } from 'react'
import type { PaginationCursor } from '../types/pagination.types'

type UseCursorPaginationOptions<T> = {
  limit: number
  fetchPage: (cursor: PaginationCursor | null, limit: number) => Promise<T[]>
  getItemId: (item: T) => string
}

export function useCursorPagination<T>({
  limit,
  fetchPage,
  getItemId,
}: UseCursorPaginationOptions<T>) {
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [cursors, setCursors] = useState<Array<PaginationCursor | null>>([null])
  const [error, setError] = useState<string | null>(null)

  const loadMore = useCallback(
    async (isInitial = false) => {
      if (loading) return
      setLoading(true)
      setError(null)
      const activeCursor = isInitial ? null : cursors[cursors.length - 1]

      try {
        const res = await fetchPage(activeCursor ?? null, limit)

        if (res.length > 0) {
          setItems((prev) => {
            const prevIds = new Set(prev.map(getItemId))
            const filtered = res.filter((item) => !prevIds.has(getItemId(item)))
            return isInitial ? filtered : [...prev, ...filtered]
          })

          const lastItem = res[res.length - 1]
          if (!lastItem) return
          const lastCreatedAt =
            (lastItem as { createdAt?: string }).createdAt ??
            (lastItem as { lastOrderAt?: string }).lastOrderAt
          const nextCursor = lastCreatedAt
            ? { createdAt: lastCreatedAt, id: getItemId(lastItem) }
            : null

          setCursors((prev) => (isInitial ? [null, nextCursor] : [...prev, nextCursor]))
          setHasMore(res.length >= limit)
        } else {
          if (isInitial) setItems([])
          setHasMore(false)
        }
      } catch (err) {
        console.error('Cursor pagination load failed:', err)
        setError('Failed to load data.')
      } finally {
        setLoading(false)
      }
    },
    [loading, cursors, fetchPage, limit, getItemId]
  )

  const reset = useCallback(() => {
    setItems([])
    setCursors([null])
    setHasMore(true)
    setError(null)
  }, [])

  const showLess = useCallback(() => {
    if (items.length <= limit) return
    setItems((prev) => prev.slice(0, prev.length - limit))
    setCursors((prev) => prev.slice(0, prev.length - 1))
    setHasMore(true)
  }, [items.length, limit])

  return {
    items,
    setItems,
    loading,
    hasMore,
    error,
    loadMore,
    reset,
    showLess,
    canShowLess: items.length > limit,
  }
}
