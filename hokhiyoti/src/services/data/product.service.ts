import type { Product } from '../../types/product.types'
import { fetchJsonCached } from './http.client'

const PRODUCTS_URL = '/data/products.json'

let productsCache: Product[] | null = null

// Deprecated: kept only to avoid breaking older imports if any exist.
// New contract uses getProducts()/getProductsByCategory().
export type ProductListParams = Record<string, never>

export const productService = {
  async getProducts(): Promise<Product[]> {
    if (productsCache === null) {
      productsCache = await fetchJsonCached<Product[]>(PRODUCTS_URL)
    }
    return productsCache
  },

  async getProductBySlug(slug: string): Promise<Product> {
    const all = await this.getProducts()
    const found = all.find((p) => p.slug === slug)
    if (!found) throw new Error(`Product not found: ${slug}`)
    return found
  },

  async getFeaturedProducts(limit = 24): Promise<Product[]> {
    const all = await this.getProducts()
    const featured = all.filter((p) => p.featured)

    // Stable, deterministic ordering for JSON data.
    return featured.slice(0, limit)
  },

  async getProductsByCategory(categorySlug: string, limit?: number): Promise<Product[]> {
    const all = await this.getProducts()
    const filtered = all.filter((p) => p.category?.slug === categorySlug)
    return typeof limit === 'number' ? filtered.slice(0, limit) : filtered
  },

  async searchProducts(query: string, limit = 24): Promise<Product[]> {
    const all = await this.getProducts()
    const q = query.trim().toLowerCase()
    if (q.length === 0) return all.slice(0, limit)

    const scored = all
      .map((p) => {
        const hay = `${p.name} ${p.description}`.toLowerCase()
        const idx = hay.indexOf(q)
        return { p, score: idx === -1 ? Number.POSITIVE_INFINITY : idx }
      })
      .filter((x) => x.score !== Number.POSITIVE_INFINITY)
      .sort((a, b) => a.score - b.score)
      .map((x) => x.p)

    return scored.slice(0, limit)
  },
}


