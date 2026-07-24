import { useEffect, useState } from 'react'
import type { Product } from '../../../types/product.types'
import { supabaseProductService } from '../../../services/supabase/product.service'
import ProductCard from '../ProductCard'

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [cursors, setCursors] = useState<Array<{ createdAt: string; id: string } | null>>([null])

  const limit = 9

  const loadMore = async (isInitial = false) => {
    if (loading) return
    setLoading(true)
    const activeCursor = isInitial ? null : cursors[cursors.length - 1]
    try {
      const res = await supabaseProductService.getFeaturedProducts(limit, activeCursor)
      if (res.length > 0) {
        setProducts((prev) => {
          const prevIds = new Set(prev.map((p) => p.id))
          const filtered = res.filter((p) => !prevIds.has(p.id))
          return isInitial ? filtered : [...prev, ...filtered]
        })
        const lastItem = res[res.length - 1]
        const nextCursor = lastItem ? { createdAt: lastItem.createdAt, id: lastItem.id } : null
        setCursors((prev) => [...prev, nextCursor])
        if (res.length < limit) {
          setHasMore(false)
        }
      } else {
        setHasMore(false)
      }
    } catch (err) {
      console.error('Failed to load featured products:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleShowLess = () => {
    if (products.length <= limit) return
    setProducts((prev) => prev.slice(0, prev.length - limit))
    setCursors((prev) => prev.slice(0, prev.length - 1))
    setHasMore(true)
  }

  useEffect(() => {
    loadMore(true)
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
      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        !loading && (
          <div className="py-12 text-center text-sm font-sans text-[#666666] tracking-wide">
            Curating featured items. Please check back shortly.
          </div>
        )
      )}

      {/* Loading Spinner */}
      {loading && (
        <div className="py-8 flex justify-center items-center">
          <div className="w-6 h-6 border border-[#B08D57]/20 border-t-[#B08D57] rounded-full animate-spin" />
        </div>
      )}

      {/* Show More / Show Less Controls */}
      <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
        {hasMore && !loading && (
          <button
            onClick={() => loadMore(false)}
            className="h-11 px-8 rounded-full bg-[#111111] hover:bg-[#B08D57] text-[#FAF9F6] font-sans text-xs font-semibold tracking-widest uppercase transition-colors cursor-pointer"
          >
            Show More
          </button>
        )}
        
        {products.length > limit && (
          <button
            onClick={handleShowLess}
            className="h-11 px-8 rounded-full border border-[#111111] hover:bg-[#111111] hover:text-[#FAF9F6] text-[#111111] font-sans text-xs font-semibold tracking-widest uppercase transition-colors cursor-pointer"
          >
            Show Less
          </button>
        )}

        {!hasMore && products.length > 0 && (
          <span className="font-sans text-xs text-[#B08D57] tracking-widest font-medium">
            ✨ You've reached the end of our collection.
          </span>
        )}
      </div>
    </section>
  )
}
