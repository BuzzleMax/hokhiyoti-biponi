import { useEffect, useState } from 'react'
import type { Product } from '../types/product.types'
import { supabaseProductService } from '../services/supabase/product.service'
import ProductCard from '../components/home/ProductCard'

export default function CollectionPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [activeCollection, setActiveCollection] = useState<string>('all')

  useEffect(() => {
    supabaseProductService
      .getProducts()
      .then((res) => setProducts(res))
      .catch(() => setProducts([]))
  }, [])

  const collections = [
    { slug: 'all', name: 'ALL COLLECTIONS' },
    ...Array.from(new Map(
      products
        .filter((p) => p.collection?.slug && p.collection?.name)
        .map((p) => [p.collection!.slug, { slug: p.collection!.slug, name: p.collection!.name.toUpperCase() }]),
    ).values()),
  ]

  const filteredProducts = activeCollection === 'all'
    ? products
    : products.filter((p) => p.collection?.slug === activeCollection)

  return (
    <div className="bg-[#FAF9F6] min-h-screen py-16 px-6 md:px-12 max-w-[1400px] mx-auto">
      {/* Title */}
      <div className="text-center max-w-[600px] mx-auto mb-16 space-y-3">
        <span className="font-sans text-[11px] font-medium tracking-[0.25em] text-[#B08D57] uppercase">
          CURATED STYLING
        </span>
        <h1 className="font-heading text-4xl md:text-5xl font-medium text-[#111111] leading-tight">
          Shop by Collection
        </h1>
        <p className="font-sans text-sm text-[#666666] leading-relaxed font-light">
          Thoughtfully grouped edits. Materials, fit, and forms built to complement each other seamlessly.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap justify-center gap-2 mb-16">
        {collections.map((col) => (
          <button
            key={col.slug}
            onClick={() => setActiveCollection(col.slug)}
            className={`h-11 px-6 rounded-full font-sans text-[10px] tracking-widest font-semibold transition-colors ${
              activeCollection === col.slug
                ? 'bg-[#111111] text-[#FAF9F6]'
                : 'border border-[rgba(0,0,0,0.06)] text-[#111111] hover:border-[#111111] bg-white'
            }`}
          >
            {col.name}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center text-sm font-sans text-[#666666] tracking-wide">
          No curations match the selected collection filter.
        </div>
      )}
    </div>
  )
}
