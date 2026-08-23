import { useState, useEffect, useRef, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import ProductCard from '../home/ProductCard'
import { supabaseProductService } from '../../services/supabase/product.service'
import type { Product } from '../../types/product.types'

interface ExploreMoreSectionProps {
  currentProduct: Product
}

/**
 * Reusable function to distribute valid products into logical rows.
 * Defaults to chunking by 6 products per row as per e-commerce discovery patterns.
 */
export function distributeProductsIntoRows(products: Product[], chunkSize = 6): Product[][] {
  if (!products || products.length === 0) return []
  const rows: Product[][] = []
  for (let i = 0; i < products.length; i += chunkSize) {
    rows.push(products.slice(i, i + chunkSize))
  }
  return rows
}

interface ExploreMoreRowProps {
  products: Product[]
  rowIndex: number
}

function ExploreMoreRow({ products, rowIndex }: ExploreMoreRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    setCanScrollLeft(scrollLeft > 4)
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    checkScroll()

    const handleResize = () => checkScroll()
    window.addEventListener('resize', handleResize)
    el.addEventListener('scroll', checkScroll, { passive: true })

    return () => {
      window.removeEventListener('resize', handleResize)
      el.removeEventListener('scroll', checkScroll)
    }
  }, [checkScroll, products])

  const handleScroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    const scrollAmount = el.clientWidth * 0.75
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
  }

  return (
    <div className="relative group/row">
      {/* Desktop Left Navigation Arrow */}
      {canScrollLeft && (
        <button
          onClick={() => handleScroll('left')}
          className="hidden md:flex absolute -left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/95 border border-black/10 shadow-lg text-[#0a0a0a] hover:bg-[#0a0a0a] hover:text-white items-center justify-center transition-all duration-300 backdrop-blur-sm opacity-0 group-hover/row:opacity-100 hover:scale-110"
          aria-label={`Scroll row ${rowIndex + 1} left`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      {/* Desktop Right Navigation Arrow */}
      {canScrollRight && (
        <button
          onClick={() => handleScroll('right')}
          className="hidden md:flex absolute -right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/95 border border-black/10 shadow-lg text-[#0a0a0a] hover:bg-[#0a0a0a] hover:text-white items-center justify-center transition-all duration-300 backdrop-blur-sm opacity-0 group-hover/row:opacity-100 hover:scale-110"
          aria-label={`Scroll row ${rowIndex + 1} right`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* Independently Scrollable Horizontal Track */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-3 sm:gap-4 md:gap-5 overflow-x-auto scroll-smooth scrollbar-none py-2 px-1 snap-x snap-mandatory"
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="flex-shrink-0 w-[calc(50%-6px)] sm:w-[calc(33.333%-11px)] md:w-[calc(25%-15px)] lg:w-[calc(20%-16px)] xl:w-[calc(16.666%-17px)] snap-start"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ExploreMoreSection({ currentProduct }: ExploreMoreSectionProps) {
  const [productRows, setProductRows] = useState<Product[][]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function loadExploreProducts() {
      try {
        setLoading(true)
        const categorySlug = currentProduct.category?.slug
        const collectionSlug = currentProduct.collection?.slug

        // Fetch candidate products from Supabase using existing service methods
        const [sameCategoryProds, sameCollectionProds, generalProds] = await Promise.all([
          categorySlug ? supabaseProductService.getProductsByCategory(categorySlug, 24) : Promise.resolve([]),
          collectionSlug ? supabaseProductService.getProductsByCollection(collectionSlug, 24) : Promise.resolve([]),
          supabaseProductService.getProducts({ includeInactive: false, limit: 48 }),
        ])

        const seenIds = new Set<string>()

        const isExcluded = (p: Product) =>
          !p ||
          !p.id ||
          p.id === currentProduct.id ||
          p.slug === currentProduct.slug ||
          p.active === false ||
          p.archived === true ||
          p.availabilityStatus === 'out_of_stock'

        const result: Product[] = []

        // Priority 1: Products matching both category and collection
        if (collectionSlug && categorySlug) {
          for (const p of sameCollectionProds) {
            if (!isExcluded(p) && !seenIds.has(p.id) && p.category?.slug === categorySlug) {
              seenIds.add(p.id)
              result.push(p)
            }
          }
        }

        // Priority 2: Products from same category or collection
        for (const p of [...sameCategoryProds, ...sameCollectionProds]) {
          if (!isExcluded(p) && !seenIds.has(p.id)) {
            seenIds.add(p.id)
            result.push(p)
          }
        }

        // Priority 3: Other valid published products to fill recommendation slots up to 30 items
        for (const p of generalProds) {
          if (result.length >= 30) break
          if (!isExcluded(p) && !seenIds.has(p.id)) {
            seenIds.add(p.id)
            result.push(p)
          }
        }

        const rows = distributeProductsIntoRows(result, 6)

        if (active) {
          setProductRows(rows)
          setLoading(false)
        }
      } catch (err) {
        console.warn('Failed to load Explore More products:', err)
        if (active) {
          setProductRows([])
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
        <div className="h-4 w-44 bg-gray-200 rounded" />
        <div className="h-8 w-64 bg-gray-200 rounded" />
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="flex-shrink-0 w-[calc(50%-6px)] sm:w-[calc(25%-12px)] aspect-[4/5] bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (productRows.length === 0) return null

  return (
    <section className="pt-16 border-t border-[rgba(0,0,0,0.06)] space-y-8 select-none">
      {/* Clean Heading & Subtitle */}
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

      {/* Multi-Row Recommendation Rows */}
      <div className="space-y-6 md:space-y-10">
        {productRows.map((rowProducts, rowIndex) => (
          <ExploreMoreRow key={`explore-row-${rowIndex}`} products={rowProducts} rowIndex={rowIndex} />
        ))}
      </div>
    </section>
  )
}
