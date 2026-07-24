import { supabase } from '../../lib/supabase'
import type { Category } from '../../types/category.types'

type CategoryRow = {
  id: string
  created_at: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
}

function rowToCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description || undefined,
  }
}

function categoryToRow(category: Partial<Category>): Partial<CategoryRow> {
  return {
    name: category.name,
    slug: category.slug,
    description: category.description || null,
    image_url: null,
  }
}

let cachedCategories: Category[] | null = null

export const supabaseCategoryService = {
  async listCategories(bypassCache = false): Promise<Category[]> {
    if (cachedCategories && !bypassCache) {
      return cachedCategories
    }
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug, description, created_at, image_url')
      .order('name', { ascending: true })

    if (error) throw error
    const result = (data || []).map(rowToCategory)
    cachedCategories = result
    return result
  },

  async getCategories(bypassCache = false): Promise<Category[]> {
    return this.listCategories(bypassCache)
  },

  async getCategoryBySlug(slug: string): Promise<Category> {
    // Check cache first
    if (cachedCategories) {
      const cached = cachedCategories.find(c => c.slug === slug)
      if (cached) return cached
    }
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug, description, created_at, image_url')
      .eq('slug', slug)
      .single()

    if (error) throw error
    if (!data) throw new Error(`Category not found: ${slug}`)
    return rowToCategory(data)
  },

  async createCategory(category: Partial<Category>): Promise<Category> {
    cachedCategories = null
    const row = categoryToRow(category)
    const { data, error } = await supabase
      .from('categories')
      .insert(row)
      .select('id, name, slug, description, created_at, image_url')
      .single()

    if (error) throw error
    if (!data) throw new Error('Failed to create category')
    return rowToCategory(data)
  },

  async updateCategory(id: string, category: Partial<Category>): Promise<Category> {
    cachedCategories = null
    const row = categoryToRow(category)
    const { data, error } = await supabase
      .from('categories')
      .update(row)
      .eq('id', id)
      .select('id, name, slug, description, created_at, image_url')
      .single()

    if (error) throw error
    if (!data) throw new Error('Failed to update category')
    return rowToCategory(data)
  },

  async deleteCategory(id: string): Promise<void> {
    cachedCategories = null
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}
