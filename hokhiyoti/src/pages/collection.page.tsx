import { useEffect, useState } from 'react'
import type { Product } from '../types/product.types'
import type { Collection } from '../types/collection.types'
import { supabaseProductService } from '../services/supabase/product.service'
import { supabaseCollectionService } from '../services/supabase/collection.service'
import ProductCard from '../components/home/ProductCard'

export default function CollectionPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [activeCollection, setActiveCollection] = useState<string>('all')
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [cursors, setCursors] = useState<Array<{ createdAt: string; id: string } | null>>([null])

  const limit = 9

  useEffect(() => {
    supabaseCollectionService
      .listCollections()
      .then((res) => setCollections(res))
      .catch(() => setCollections([]))
  }, [])

  const loadMore = async (isInitial = false, collection = activeCollection) => {
    if (loading) return
    setLoading(true)
    const activeCursor = isInitial ? null : cursors[cursors.length - 1]
    try {
      let res: Product[] = []
      if (collection === 'all') {
        res = await supabaseProductService.getProducts({ limit, cursor: activeCursor })
      } else {
        res = await supabaseProductService.getProductsByCollection(collection, limit, activeCursor)
      }

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
      console.error('Failed to load collection products:', err)
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

  const handleCollectionChange = (slug: string) => {
    setActiveCollection(slug)
    setProducts([])
    setCursors([null])
    setHasMore(true)
    loadMore(true, slug)
  }

  useEffect(() => {
    loadMore(true, 'all')
  }, [])

  const collectionTabs = [
    { slug: 'all', name: 'ALL COLLECTIONS' },
    ...collections.map((c) => ({ slug: c.slug, name: c.name.toUpperCase() })),
  ]

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
        {collectionTabs.map((col) => (
          <button
            key={col.slug}
            onClick={() => handleCollectionChange(col.slug)}
            className={`h-11 px-6 rounded-full font-sans text-[10px] tracking-widest font-semibold transition-colors cursor-pointer ${
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
      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        !loading && (
          <div className="py-12 text-center text-sm font-sans text-[#666666] tracking-wide">
            No curations match the selected collection filter.
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
    </div>
  )
}
