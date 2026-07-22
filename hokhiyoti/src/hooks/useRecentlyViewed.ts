import { useState, useEffect } from 'react'
import type { Product } from '../types/product.types'

const RECENTLY_VIEWED_KEY = 'hb_recently_viewed_products'

export function useRecentlyViewed() {
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENTLY_VIEWED_KEY)
      if (stored) {
        setRecentlyViewed(JSON.parse(stored))
      }
    } catch {
      // Ignore parse errors
    }
  }, [])

  const addRecentlyViewed = (product: Product) => {
    if (!product || !product.id) return
    try {
      const stored = localStorage.getItem(RECENTLY_VIEWED_KEY)
      let list: Product[] = stored ? JSON.parse(stored) : []

      // Filter out duplicate
      list = list.filter((p) => p.id !== product.id && p.slug !== product.slug)

      // Add to front
      list.unshift(product)

      // Cap at 10 items
      if (list.length > 10) {
        list = list.slice(0, 10)
      }

      localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(list))
      setRecentlyViewed(list)
    } catch (e) {
      console.warn('Failed to save recently viewed product:', e)
    }
  }

  return { recentlyViewed, addRecentlyViewed }
}
