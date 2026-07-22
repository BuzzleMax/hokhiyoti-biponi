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

export const supabaseCollectionService = {
  async listCollections(): Promise<Collection[]> {
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })

    if (error) throw error
    return (data || []).map(rowToCollection)
  },

  async getFeaturedCollections(): Promise<Collection[]> {
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .eq('featured', true)
      .order('sort_order', { ascending: true })

    if (error) throw error
    return (data || []).map(rowToCollection)
  },

  async getCollectionBySlug(slug: string): Promise<Collection> {
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) throw error
    if (!data) throw new Error(`Collection not found: ${slug}`)
    return rowToCollection(data)
  },

  async createCollection(collection: Partial<Collection>): Promise<Collection> {
    const row = collectionToRow(collection)
    const { data, error } = await supabase
      .from('collections')
      .insert(row)
      .select()
      .single()

    if (error) throw error
    if (!data) throw new Error('Failed to create collection')
    return rowToCollection(data)
  },

  async updateCollection(id: string, collection: Partial<Collection>): Promise<Collection> {
    const row = collectionToRow(collection)
    const { data, error } = await supabase
      .from('collections')
      .update(row)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    if (!data) throw new Error('Failed to update collection')
    return rowToCollection(data)
  },

  async deleteCollection(id: string): Promise<void> {
    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}

