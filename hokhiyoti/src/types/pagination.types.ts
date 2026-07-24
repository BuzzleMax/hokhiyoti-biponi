/** Stable cursor for keyset (seek) pagination — ordered by created_at DESC, id DESC */
export type PaginationCursor = {
  createdAt: string
  id: string
}

export type CursorPage<T> = {
  items: T[]
  nextCursor: PaginationCursor | null
  hasMore: boolean
}

export type CursorQueryParams = {
  limit?: number
  cursor?: PaginationCursor | null
}
