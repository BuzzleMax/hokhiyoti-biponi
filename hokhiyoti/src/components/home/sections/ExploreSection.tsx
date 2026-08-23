import { useEffect, useState } from 'react'
import type { Product } from '../../../types/product.types'
import { supabaseProductService } from '../../../services/supabase/product.service'
import ProductCard from '../ProductCard'

export default function ExploreSection() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [cursors, setCursors] = useState<Array<{ createdAt: string; id: string } | null>>([null])

  const limit = 12

  const loadMore = async (isInitial = false) => {
    if (loading && !isInitial) return
    setLoading(true)
    const activeCursor = isInitial ? null : cursors[cursors.length - 1]
    try {
      const res = await supabaseProductService.getExploreProducts(limit, activeCursor)
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
      console.error('Failed to load explore products:', err)
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

  // Hide section entirely if no explore products are tagged and loading has completed
  if (!loading && products.length === 0) {
    return null
  }

  return (
    <section className="bg-[#FAF9F6] py-20 px-4 sm:px-6 md:px-12 max-w-[1600px] mx-auto overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <span className="font-sans text-[11px] font-medium tracking-[0.25em] text-[#B08D57] uppercase block">
            DISCOVERY
          </span>
          <h2 className="mt-2 font-heading text-2xl sm:text-3xl md:text-4xl font-medium text-[#111111] leading-tight">
            EXPLORE
          </h2>
          <p className="mt-1 font-sans text-xs sm:text-sm text-[#8a8a8a] font-light">
            Explore more handpicked pieces from Hokhiyoti Biponi.
          </p>
        </div>
      </div>

      {/* Loading Skeletons */}
      {loading && products.length === 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={`skel-exp-${idx}`}
              className="flex flex-col bg-white rounded-xl overflow-hidden border border-[rgba(0,0,0,0.04)] animate-pulse"
            >
              <div className="aspect-[4/5] bg-gray-200 w-full" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Mobile Horizontal Touch-Scroll Container (~2 cards visible per view) */}
          <div className="block md:hidden">
            <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-none -mx-4 px-4">
              {products.map((product) => (
                <div
                  key={`mob-exp-${product.id}`}
                  className="snap-start shrink-0 w-[44vw] max-w-[200px]"
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>

          {/* Desktop Grid Layout (4-6 cards per row) */}
          <div className="hidden md:grid md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 lg:gap-5">
            {products.map((product) => (
              <ProductCard key={`dt-exp-${product.id}`} product={product} />
            ))}
          </div>
        </>
      )}

      {/* Pagination Controls */}
      {products.length > 0 && (
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
              ✨ You've reached the end of our explore selection.
            </span>
          )}
        </div>
      )}
    </section>
  )
}
