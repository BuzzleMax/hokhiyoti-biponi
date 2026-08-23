import { useState, useEffect } from 'react'
import ProductGrid from '../common/ProductGrid'
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

        // Fetch candidate products from Supabase using real database queries
        const [sameCategoryProds, sameCollectionProds, generalProds] = await Promise.all([
          categorySlug ? supabaseProductService.getProductsByCategory(categorySlug, 24) : Promise.resolve([]),
          collectionSlug ? supabaseProductService.getProductsByCollection(collectionSlug, 24) : Promise.resolve([]),
          supabaseProductService.getProducts({ includeInactive: false, limit: 48 }),
        ])

        const seenIds = new Set<string>()

        // Exclude current product and invalid/inactive products
        const isExcluded = (p: Product) =>
          !p ||
          !p.id ||
          p.id === currentProduct.id ||
          p.slug === currentProduct.slug ||
          p.active === false ||
          p.archived === true

        const result: Product[] = []

        // P1: Products matching both category and collection
        if (collectionSlug && categorySlug) {
          for (const p of sameCollectionProds) {
            if (!isExcluded(p) && !seenIds.has(p.id) && p.category?.slug === categorySlug) {
              seenIds.add(p.id)
              result.push(p)
            }
          }
        }

        // P2: Products from same category or collection
        for (const p of [...sameCategoryProds, ...sameCollectionProds]) {
          if (!isExcluded(p) && !seenIds.has(p.id)) {
            seenIds.add(p.id)
            result.push(p)
          }
        }

        // P3: Other published products from database
        for (const p of generalProds) {
          if (result.length >= 24) break
          if (!isExcluded(p) && !seenIds.has(p.id)) {
            seenIds.add(p.id)
            result.push(p)
          }
        }

        if (active) {
          setProducts(result)
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

  if (!loading && products.length === 0) return null

  return (
    <section className="pt-16 border-t border-[rgba(0,0,0,0.06)] space-y-8 select-none">
      {/* Heading & Subtitle */}
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

      {/* Responsive Marketplace Product Grid */}
      <ProductGrid
        products={products}
        loading={loading}
        skeletonCount={6}
        emptyMessage="No additional recommendations found."
      />
    </section>
  )
}
