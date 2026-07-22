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

export const supabaseCategoryService = {
  async listCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error
    return (data || []).map(rowToCategory)
  },

  async getCategoryBySlug(slug: string): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) throw error
    if (!data) throw new Error(`Category not found: ${slug}`)
    return rowToCategory(data)
  },

  async createCategory(category: Partial<Category>): Promise<Category> {
    const row = categoryToRow(category)
    const { data, error } = await supabase
      .from('categories')
      .insert(row)
      .select()
      .single()

    if (error) throw error
    if (!data) throw new Error('Failed to create category')
    return rowToCategory(data)
  },

  async updateCategory(id: string, category: Partial<Category>): Promise<Category> {
    const row = categoryToRow(category)
    const { data, error } = await supabase
      .from('categories')
      .update(row)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    if (!data) throw new Error('Failed to update category')
    return rowToCategory(data)
  },

  async deleteCategory(id: string): Promise<void> {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}

