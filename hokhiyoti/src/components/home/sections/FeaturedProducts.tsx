import { useEffect, useState } from 'react'
import type { Product } from '../../../types/product.types'
import { supabaseProductService } from '../../../services/supabase/product.service'
import ProductCard from '../ProductCard'

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[] | null>(null)

  useEffect(() => {
    let cancelled = false
    supabaseProductService
      .getFeaturedProducts()
      .then((res) => {
        if (!cancelled) {
          setProducts(res.length > 0 ? res : [])
        }
      })
      .catch(() => {
        if (!cancelled) setProducts([])
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="bg-[#FAF9F6] py-24 px-6 md:px-12 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <span className="font-sans text-[11px] font-medium tracking-[0.25em] text-[#B08D57] uppercase">
            MOST COVETED
          </span>
          <h2 className="mt-3 font-heading text-3xl md:text-4xl font-medium text-[#111111] leading-tight">
            Featured Products
          </h2>
        </div>
      </div>

      {/* Grid of Product Cards */}
      {products && products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center text-sm font-sans text-[#666666] tracking-wide">
          Curating featured items. Please check back shortly.
        </div>
      )}
    </section>
  )
}
