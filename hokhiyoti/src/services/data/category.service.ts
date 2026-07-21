import type { Category } from '../../types/category.types'
import { fetchJsonCached } from './http.client'

const CATEGORIES_URL = '/data/categories.json'

let categoriesCache: Category[] | null = null

export const categoryService = {
  async listCategories(): Promise<Category[]> {
    if (categoriesCache === null) {
      categoriesCache = await fetchJsonCached<Category[]>(CATEGORIES_URL)
    }
    return [...categoriesCache]
  },


  async getCategoryBySlug(slug: string): Promise<Category> {
    const all = await this.listCategories()
    const found = all.find((c) => c.slug === slug)
    if (!found) throw new Error(`Category not found: ${slug}`)
    return found
  },
}


