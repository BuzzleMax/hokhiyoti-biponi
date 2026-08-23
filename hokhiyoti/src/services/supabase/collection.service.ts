import { supabase } from '../../lib/supabase'
import type { Collection } from '../../types/collection.types'

type CollectionRow = {
  id: string
  created_at: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  featured: boolean
}

function rowToCollection(row: CollectionRow): Collection {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description || undefined,
    featured: row.featured,
    imageUrl: row.image_url || undefined,
  }
}

function collectionToRow(collection: Partial<Collection>): Partial<CollectionRow> {
  const row: Partial<CollectionRow> = {}
  if (collection.name !== undefined) row.name = collection.name
  if (collection.slug !== undefined) row.slug = collection.slug
  if (collection.description !== undefined) row.description = collection.description || null
  if (collection.imageUrl !== undefined) row.image_url = collection.imageUrl || null
  if (collection.featured !== undefined) row.featured = Boolean(collection.featured)
  return row
}

let cachedCollections: Collection[] | null = null

export const supabaseCollectionService = {
  async listCollections(bypassCache = false): Promise<Collection[]> {
    if (cachedCollections && !bypassCache) {
      return cachedCollections
    }
    const { data, error } = await supabase
      .from('collections')
      .select('id, name, slug, description, featured, image_url, created_at')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })

    if (error) throw error
    const result = (data || []).map(rowToCollection)
    cachedCollections = result
    return result
  },

  async getFeaturedCollections(bypassCache = false): Promise<Collection[]> {
    const all = await this.listCollections(bypassCache)
    return all.filter(c => Boolean(c.featured))
  },

  async getCollectionBySlug(slug: string): Promise<Collection> {
    const res = await this.getCollectionBySlugOrId(slug)
    if (!res) throw new Error(`Collection not found: ${slug}`)
    return res
  },

  async getCollectionBySlugOrId(identifier: string): Promise<Collection | null> {
    if (!identifier) return null
    if (cachedCollections) {
      const cached = cachedCollections.find(c => c.slug === identifier || c.id === identifier)
      if (cached) return cached
    }
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier)
    let query = supabase
      .from('collections')
      .select('id, name, slug, description, featured, image_url, created_at')

    if (isUuid) {
      query = query.or(`id.eq.${identifier},slug.eq.${identifier}`)
    } else {
      query = query.eq('slug', identifier)
    }

    const { data, error } = await query.maybeSingle()
    if (error) {
      console.error('Error fetching collection by identifier:', error)
      return null
    }
    if (!data) return null
    return rowToCollection(data)
  },

  async uploadCollectionCoverImage(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop()
    const fileName = `col_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`

    let bucketName = 'collection-images'
    let { error } = await supabase.storage.from(bucketName).upload(fileName, file)

    if (error) {
      // Fallback to product-images bucket if collection-images is not available yet
      bucketName = 'product-images'
      const fallbackUpload = await supabase.storage.from(bucketName).upload(fileName, file)
      if (fallbackUpload.error) throw fallbackUpload.error
    }

    const { data } = supabase.storage.from(bucketName).getPublicUrl(fileName)
    return data.publicUrl
  },

  async createCollection(collection: Partial<Collection>): Promise<Collection> {
    cachedCollections = null
    const row = collectionToRow(collection)
    const { data, error } = await supabase
      .from('collections')
      .insert(row)
      .select('id, name, slug, description, featured, image_url, created_at')
      .single()

    if (error) throw error
    if (!data) throw new Error('Failed to create collection')
    return rowToCollection(data)
  },

  async updateCollection(id: string, collection: Partial<Collection>): Promise<Collection> {
    cachedCollections = null
    const row = collectionToRow(collection)
    const { data, error } = await supabase
      .from('collections')
      .update(row)
      .eq('id', id)
      .select('id, name, slug, description, featured, image_url, created_at')
      .single()

    if (error) throw error
    if (!data) throw new Error('Failed to update collection')
    return rowToCollection(data)
  },

  async deleteCollection(id: string): Promise<void> {
    cachedCollections = null
    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}

