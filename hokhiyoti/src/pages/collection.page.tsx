import { useEffect, useState } from 'react'
import { useParams, useLocation } from 'wouter'
import type { Product } from '../types/product.types'
import type { Collection } from '../types/collection.types'
import { supabaseProductService } from '../services/supabase/product.service'
import { supabaseCollectionService } from '../services/supabase/collection.service'
import ProductGrid from '../components/common/ProductGrid'
import { AppLink } from '../lib/navigation'
import { useSEO } from '../hooks/useSEO'
import { AlertCircle, ArrowLeft } from 'lucide-react'

export default function CollectionPage() {
  const { slug } = useParams() as { slug?: string }
  const [, navigate] = useLocation()

  const [products, setProducts] = useState<Product[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [currentCollection, setCurrentCollection] = useState<Collection | null>(null)
  const [notFound, setNotFound] = useState(false)

  const [loading, setLoading] = useState(true)
  const [loadingCollection, setLoadingCollection] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [cursors, setCursors] = useState<Array<{ createdAt: string; id: string } | null>>([null])

  const limit = 12

  // Update SEO dynamically based on current collection
  useSEO({
    title: currentCollection
      ? `${currentCollection.name} Collection | Hokhiyoti Biponi`
      : 'Curated Collections | Hokhiyoti Biponi',
    description: currentCollection?.description
      ? currentCollection.description
      : 'Explore curated edits of hand-loomed heritage fibers, Mekhela Chador, Silk Sarees, and timeless handlooms.',
  })

  // Load all available collections for navigation tabs
  useEffect(() => {
    supabaseCollectionService
      .listCollections()
      .then((res) => setCollections(res))
      .catch(() => setCollections([]))
  }, [])

  // Resolve current collection & reset pagination when route slug changes
  useEffect(() => {
    let cancelled = false
    setLoadingCollection(true)
    setNotFound(false)
    setCurrentCollection(null)
    setProducts([])
    setCursors([null])
    setHasMore(true)

    const resolveCollectionAndProducts = async () => {
      try {
        if (!slug || slug === 'all') {
          // General "All Collections" view
          if (!cancelled) {
            setCurrentCollection(null)
            setNotFound(false)
            setLoadingCollection(false)
            await fetchProducts(true, null, 'all')
          }
        } else {
          // Exact collection view
          const found = await supabaseCollectionService.getCollectionBySlugOrId(slug)
          if (cancelled) return

          if (found) {
            setCurrentCollection(found)
            setNotFound(false)
            setLoadingCollection(false)
            await fetchProducts(true, null, found.slug || found.id)
          } else {
            setCurrentCollection(null)
            setNotFound(true)
            setLoadingCollection(false)
            setLoading(false)
          }
        }
      } catch (err) {
        console.error('Failed to resolve collection route:', err)
        if (!cancelled) {
          setNotFound(true)
          setLoadingCollection(false)
          setLoading(false)
        }
      }
    }

    resolveCollectionAndProducts()

    return () => {
      cancelled = true
    }
  }, [slug])

  // Fetch paginated products
  const fetchProducts = async (isInitial = false, cursor = cursors[cursors.length - 1], targetSlug = slug || 'all') => {
    if (loading && !isInitial) return
    setLoading(true)

    try {
      let res: Product[] = []
      if (!targetSlug || targetSlug === 'all') {
        res = await supabaseProductService.getProducts({ limit, cursor })
      } else {
        res = await supabaseProductService.getProductsByCollection(targetSlug, limit, cursor)
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
        if (isInitial) setProducts([])
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

  const handleTabClick = (tabSlug: string) => {
    if (tabSlug === 'all') {
      navigate('/collection')
    } else {
      navigate(`/collection/${tabSlug}`)
    }
  }

  const collectionTabs = [
    { slug: 'all', name: 'ALL COLLECTIONS' },
    ...collections.map((c) => ({ slug: c.slug, name: c.name.toUpperCase() })),
  ]

  const activeTabSlug = slug || 'all'

  return (
    <div className="bg-[#FAF9F6] min-h-screen py-12 px-4 sm:px-6 md:px-12 max-w-[1600px] mx-auto space-y-12 font-sans">
      {/* Header Banner */}
      {loadingCollection ? (
        <div className="text-center max-w-[600px] mx-auto space-y-3 py-8 animate-pulse">
          <div className="h-4 bg-gray-200 rounded-md w-32 mx-auto" />
          <div className="h-8 bg-gray-200 rounded-md w-64 mx-auto" />
          <div className="h-4 bg-gray-200 rounded-md w-80 mx-auto" />
        </div>
      ) : notFound ? (
        /* COLLECTION NOT FOUND STATE */
        <div className="py-16 text-center max-w-[550px] mx-auto space-y-6 bg-white rounded-2xl p-8 border border-black/5 shadow-xs">
          <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto text-[#B08D57]">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h1 className="font-heading text-2xl sm:text-3xl font-medium text-[#111111]">
              Collection Not Found
            </h1>
            <p className="font-sans text-xs sm:text-sm text-[#666666] leading-relaxed font-light">
              The collection you are looking for does not exist, has been renamed, or is no longer available.
            </p>
          </div>
          <AppLink
            to="/collection"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#111111] hover:bg-[#B08D57] text-[#FAF9F6] font-sans text-xs font-semibold tracking-widest uppercase rounded-full transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Explore All Collections
          </AppLink>
        </div>
      ) : currentCollection ? (
        /* EXACT COLLECTION HEADER */
        <div className="relative rounded-2xl overflow-hidden bg-white border border-black/5 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-0 items-center">
            {/* Cover Image */}
            <div className="md:col-span-6 relative aspect-[16/9] md:aspect-[4/3] w-full overflow-hidden bg-[#FAF9F6]">
              <img
                src={currentCollection.imageUrl || '/assets/hero.png'}
                alt={currentCollection.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:hidden" />
              <div className="absolute bottom-4 left-4 text-white md:hidden">
                <span className="font-sans text-[9px] tracking-[0.2em] uppercase font-semibold text-[#FAF9F6]/90">
                  Collection
                </span>
                <h1 className="font-heading text-xl font-medium">{currentCollection.name}</h1>
              </div>
            </div>

            {/* Description Details */}
            <div className="md:col-span-6 p-8 sm:p-12 space-y-4">
              <span className="font-sans text-[10px] sm:text-[11px] font-medium tracking-[0.25em] text-[#B08D57] uppercase block">
                CURATED COLLECTION
              </span>
              <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-medium text-[#111111] leading-tight">
                {currentCollection.name}
              </h1>
              {currentCollection.description && (
                <p className="font-sans text-xs sm:text-sm text-[#555555] leading-relaxed font-light">
                  {currentCollection.description}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ALL COLLECTIONS HEADER */
        <div className="text-center max-w-[600px] mx-auto space-y-3">
          <span className="font-sans text-[11px] font-medium tracking-[0.25em] text-[#B08D57] uppercase">
            CURATED STYLING
          </span>
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-medium text-[#111111] leading-tight">
            Shop by Collection
          </h1>
          <p className="font-sans text-xs sm:text-sm text-[#666666] leading-relaxed font-light">
            Thoughtfully grouped edits. Materials, fit, and forms built to complement each other seamlessly.
          </p>
        </div>
      )}

      {/* Navigation Tabs (Preserved Collection Browser) */}
      {!notFound && (
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          {collectionTabs.map((col) => {
            const isActive = activeTabSlug === col.slug
            return (
              <button
                key={col.slug}
                onClick={() => handleTabClick(col.slug)}
                className={`h-10 px-5 sm:h-11 sm:px-6 rounded-full font-sans text-[9px] sm:text-[10px] tracking-widest font-semibold transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#111111] text-[#FAF9F6]'
                    : 'border border-[rgba(0,0,0,0.06)] text-[#111111] hover:border-[#111111] bg-white'
                }`}
              >
                {col.name}
              </button>
            )
          })}
        </div>
      )}

      {/* Product Grid */}
      {!notFound && (
        <>
          <ProductGrid
            products={products}
            loading={loading && products.length === 0}
            skeletonCount={8}
            emptyMessage={
              currentCollection
                ? `No products currently available in ${currentCollection.name}.`
                : 'No curations match the selected collection filter.'
            }
          />

          {/* Show More / Show Less Controls */}
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            {hasMore && !loading && (
              <button
                onClick={() => fetchProducts(false)}
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
        </>
      )}
    </div>
  )
}
