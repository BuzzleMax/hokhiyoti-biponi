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
  return {
    name: collection.name,
    slug: collection.slug,
    description: collection.description || null,
    image_url: collection.imageUrl || null,
    featured: collection.featured || false,
  }
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
    if (cachedCollections && !bypassCache) {
      return cachedCollections.filter(c => c.featured)
    }
    const { data, error } = await supabase
      .from('collections')
      .select('id, name, slug, description, featured, image_url, created_at')
      .eq('featured', true)
      .order('sort_order', { ascending: true })

    if (error) throw error
    return (data || []).map(rowToCollection)
  },

  async getCollectionBySlug(slug: string): Promise<Collection> {
    if (cachedCollections) {
      const cached = cachedCollections.find(c => c.slug === slug)
      if (cached) return cached
    }
    const { data, error } = await supabase
      .from('collections')
      .select('id, name, slug, description, featured, image_url, created_at')
      .eq('slug', slug)
      .single()

    if (error) throw error
    if (!data) throw new Error(`Collection not found: ${slug}`)
    return rowToCollection(data)
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

