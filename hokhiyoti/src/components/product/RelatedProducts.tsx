import { useState, useEffect } from 'react'
import ProductCard from '../home/ProductCard'
import { supabaseProductService } from '../../services/supabase/product.service'
import type { Product } from '../../types/product.types'

interface RelatedProductsProps {
  currentProductId: string
  categorySlug?: string
  collectionSlug?: string
}

export default function RelatedProducts({
  currentProductId,
  categorySlug,
  collectionSlug,
}: RelatedProductsProps) {
  const [related, setRelated] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function fetchRelated() {
      try {
        let items: Product[] = []
        if (categorySlug) {
          items = await supabaseProductService.getProductsByCategory(categorySlug, 8)
        } else if (collectionSlug) {
          items = await supabaseProductService.getProductsByCollection(collectionSlug, 8)
        } else {
          items = await supabaseProductService.getFeaturedProducts(8)
        }

        // Filter out current product
        const filtered = items.filter((p) => p.id !== currentProductId && p.slug !== currentProductId).slice(0, 4)

        if (active) {
          setRelated(filtered)
          setLoading(false)
        }
      } catch (err) {
        console.warn('Failed to load related products:', err)
        if (active) setLoading(false)
      }
    }

    fetchRelated()

    return () => {
      active = false
    }
  }, [currentProductId, categorySlug, collectionSlug])

  if (loading || related.length === 0) return null

  return (
    <div className="pt-16 border-t border-[rgba(0,0,0,0.06)] space-y-8">
      <div>
        <span className="font-sans text-[11px] font-medium tracking-[0.25em] text-[#B08D57] uppercase block mb-1">
          CURATED FOR YOU
        </span>
        <h2 className="font-heading text-2xl md:text-3xl font-medium text-[#111111]">
          You May Also Like
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {related.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}
