import type { Collection } from '../../types/collection.types'
import { fetchJsonCached } from './http.client'

const COLLECTIONS_URL = '/data/collections.json'

let collectionsCache: Collection[] | null = null

export const collectionService = {
  async listCollections(): Promise<Collection[]> {
    if (collectionsCache === null) {
      collectionsCache = await fetchJsonCached<Collection[]>(COLLECTIONS_URL)
    }
    return [...collectionsCache]
  },

  async getCollectionBySlug(slug: string): Promise<Collection> {
    const all = await this.listCollections()
    const found = all.find((c) => c.slug === slug)
    if (!found) throw new Error(`Collection not found: ${slug}`)
    return found
  },

  async getCollectionsByCategory(categorySlug?: string): Promise<Collection[]> {
    const all = await this.listCollections()
    if (!categorySlug) return all

    // Best-effort filtering for forward compatibility.
    // If Collection later includes `categorySlug`, this will filter correctly.
    return all.filter((c) => (c as Record<string, unknown>).categorySlug === categorySlug)
  },
}


