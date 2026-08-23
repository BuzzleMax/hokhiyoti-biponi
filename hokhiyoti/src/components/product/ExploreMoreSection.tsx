import { useState, useEffect } from 'react'
import ProductCard from '../home/ProductCard'
import { supabaseProductService } from '../../services/supabase/product.service'
import type { Product } from '../../types/product.types'

interface ExploreMoreSectionProps {
  currentProduct: Product
}

export default function ExploreMoreSection({ currentProduct }: ExploreMoreSectionProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function loadExploreProducts() {
      try {
        setLoading(true)
        const categorySlug = currentProduct.category?.slug
        const collectionSlug = currentProduct.collection?.slug

        // Fetch candidate lists in parallel using existing Supabase service methods
        const [sameCategoryProds, sameCollectionProds, generalProds] = await Promise.all([
          categorySlug ? supabaseProductService.getProductsByCategory(categorySlug, 12) : Promise.resolve([]),
          collectionSlug ? supabaseProductService.getProductsByCollection(collectionSlug, 12) : Promise.resolve([]),
          supabaseProductService.getProducts({ includeInactive: false, limit: 16 }),
        ])

        const seenIds = new Set<string>()
        const isExcluded = (p: Product) =>
          p.id === currentProduct.id ||
          p.slug === currentProduct.slug ||
          p.active === false ||
          p.archived === true ||
          p.availabilityStatus === 'out_of_stock'

        const result: Product[] = []

        // Priority 1: Products from same collection & category
        if (collectionSlug && categorySlug) {
          for (const p of sameCollectionProds) {
            if (!isExcluded(p) && !seenIds.has(p.id) && p.category?.slug === categorySlug) {
              seenIds.add(p.id)
              result.push(p)
            }
          }
        }

        // Priority 2: Other products from same category or collection
        for (const p of [...sameCategoryProds, ...sameCollectionProds]) {
          if (!isExcluded(p) && !seenIds.has(p.id)) {
            seenIds.add(p.id)
            result.push(p)
          }
        }

        // Priority 3: Other active published products if not enough
        for (const p of generalProds) {
          if (result.length >= 8) break
          if (!isExcluded(p) && !seenIds.has(p.id)) {
            seenIds.add(p.id)
            result.push(p)
          }
        }

        const finalProducts = result.slice(0, 8)

        if (active) {
          setProducts(finalProducts)
          setLoading(false)
        }
      } catch (err) {
        console.warn('Failed to load Explore More products:', err)
        if (active) {
          setProducts([])
          setLoading(false)
        }
      }
    }

    loadExploreProducts()

    return () => {
      active = false
    }
  }, [currentProduct])

  if (loading) {
    return (
      <div className="pt-16 border-t border-[rgba(0,0,0,0.06)] space-y-6 animate-pulse">
        <div className="h-4 w-36 bg-gray-200 rounded" />
        <div className="h-8 w-64 bg-gray-200 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="aspect-[4/5] bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (products.length === 0) return null

  return (
    <section className="pt-16 border-t border-[rgba(0,0,0,0.06)] space-y-8 select-none">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="font-sans text-[11px] font-semibold tracking-[0.25em] text-[#B08D57] uppercase block mb-1">
            Discover More from Hokhiyoti Biponi
          </span>
          <h2 className="font-heading text-2xl md:text-3xl font-medium text-[#0a0a0a]">
            Explore More
          </h2>
        </div>
        <p className="font-sans text-xs text-[#8a8a8a] font-light max-w-sm">
          Handpicked luxury handloom & silk curations tailored to complement your style.
        </p>
      </div>

      {/* Grid for Desktop / Responsive Horizontal Scroll for Mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 overflow-x-auto pb-4 scrollbar-none">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}
