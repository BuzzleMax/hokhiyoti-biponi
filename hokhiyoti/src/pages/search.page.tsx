import { useEffect, useState, useMemo } from 'react'
import type { Product } from '../types/product.types'
import { supabaseProductService } from '../services/supabase/product.service'
import ProductCard from '../components/home/ProductCard'
import { Search, Filter, X, SlidersHorizontal } from 'lucide-react'
import { useSEO } from '../hooks/useSEO'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedCollection, setSelectedCollection] = useState<string>('all')
  const [selectedFabric, setSelectedFabric] = useState<string>('all')
  const [selectedColour, setSelectedColour] = useState<string>('all')
  const [selectedAvailability, setSelectedAvailability] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'price_low' | 'price_high'>('newest')
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  useSEO({
    title: 'Search & Explore Curations | Hokhiyoti Biponi',
    description: 'Find exquisite handwoven Mekhela Chador, Silk Sarees, and Heritage Handloom collections.',
  })

  useEffect(() => {
    supabaseProductService
      .getProducts()
      .then((res) => {
        setAllProducts(res)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Extract dynamic categories, collections, fabrics, and colours for filter dropdowns
  const categories = useMemo(() => {
    const set = new Set<string>()
    allProducts.forEach((p) => p.category?.name && set.add(p.category.name))
    return Array.from(set)
  }, [allProducts])

  const collections = useMemo(() => {
    const set = new Set<string>()
    allProducts.forEach((p) => p.collection?.name && set.add(p.collection.name))
    return Array.from(set)
  }, [allProducts])

  const fabrics = useMemo(() => {
    const set = new Set<string>()
    allProducts.forEach((p) => p.fabric && set.add(p.fabric))
    return Array.from(set)
  }, [allProducts])

  const colours = useMemo(() => {
    const set = new Set<string>()
    allProducts.forEach((p) => p.colours.forEach((c) => set.add(c.name)))
    return Array.from(set)
  }, [allProducts])

  // Multi-facet filtering logic
  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase()

    return allProducts
      .filter((p) => {
        // Search query
        if (q.length > 0) {
          const matchName = p.name.toLowerCase().includes(q)
          const matchDesc = p.description.toLowerCase().includes(q)
          const matchCat = p.category?.name.toLowerCase().includes(q)
          const matchCol = p.collection?.name.toLowerCase().includes(q)
          const matchFabric = p.fabric?.toLowerCase().includes(q)
          const matchColour = p.colours.some((c) => c.name.toLowerCase().includes(q))
          if (!matchName && !matchDesc && !matchCat && !matchCol && !matchFabric && !matchColour) return false
        }

        // Category filter
        if (selectedCategory !== 'all' && p.category?.name !== selectedCategory) return false

        // Collection filter
        if (selectedCollection !== 'all' && p.collection?.name !== selectedCollection) return false

        // Fabric filter
        if (selectedFabric !== 'all' && p.fabric !== selectedFabric) return false

        // Colour filter
        if (selectedColour !== 'all' && !p.colours.some((c) => c.name === selectedColour)) return false

        // Availability filter
        if (selectedAvailability === 'in_stock' && p.availabilityStatus === 'out_of_stock') return false
        if (selectedAvailability === 'out_of_stock' && p.availabilityStatus !== 'out_of_stock') return false

        return true
      })
      .sort((a, b) => {
        if (sortBy === 'price_low') return a.price - b.price
        if (sortBy === 'price_high') return b.price - a.price
        if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
  }, [allProducts, query, selectedCategory, selectedCollection, selectedFabric, selectedColour, selectedAvailability, sortBy])

  const clearFilters = () => {
    setQuery('')
    setSelectedCategory('all')
    setSelectedCollection('all')
    setSelectedFabric('all')
    setSelectedColour('all')
    setSelectedAvailability('all')
    setSortBy('newest')
  }

  return (
    <div className="bg-[#FAF9F6] min-h-screen py-12 px-4 md:px-12 max-w-[1400px] mx-auto space-y-10">
      {/* Title */}
      <div className="text-center max-w-[600px] mx-auto space-y-2">
        <span className="font-sans text-[11px] font-semibold tracking-[0.25em] text-[#B08D57] uppercase">
          EXPLORE & FIND
        </span>
        <h1 className="font-heading text-3xl md:text-4xl font-medium text-[#111111]">
          Search & Filter Store
        </h1>
        <p className="font-sans text-xs text-gray-500 font-light">
          Discover royal Mekhela Chador, Sarees, and handcrafted heritage wear.
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="max-w-2xl mx-auto relative">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by product name, silk type, colour, or style..."
          className="w-full h-14 pl-14 pr-12 rounded-full border border-black/10 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-[#B08D57] shadow-sm"
          type="text"
        />
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 stroke-[1.5]" />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-black"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Desktop Filter Toolbar */}
      <div className="hidden lg:flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-black/5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-sans text-xs font-semibold uppercase tracking-wider text-gray-700 flex items-center gap-1.5 mr-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#B08D57]" /> Filters:
          </span>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-9 px-3.5 rounded-full border border-black/10 text-xs bg-[#FAF9F6] focus:outline-none focus:border-[#B08D57]"
          >
            <option value="all">Category: All</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Collection Filter */}
          <select
            value={selectedCollection}
            onChange={(e) => setSelectedCollection(e.target.value)}
            className="h-9 px-3.5 rounded-full border border-black/10 text-xs bg-[#FAF9F6] focus:outline-none focus:border-[#B08D57]"
          >
            <option value="all">Collection: All</option>
            {collections.map((col) => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>

          {/* Fabric Filter */}
          {fabrics.length > 0 && (
            <select
              value={selectedFabric}
              onChange={(e) => setSelectedFabric(e.target.value)}
              className="h-9 px-3.5 rounded-full border border-black/10 text-xs bg-[#FAF9F6] focus:outline-none focus:border-[#B08D57]"
            >
              <option value="all">Fabric: All</option>
              {fabrics.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          )}

          {/* Colour Filter */}
          {colours.length > 0 && (
            <select
              value={selectedColour}
              onChange={(e) => setSelectedColour(e.target.value)}
              className="h-9 px-3.5 rounded-full border border-black/10 text-xs bg-[#FAF9F6] focus:outline-none focus:border-[#B08D57]"
            >
              <option value="all">Colour: All</option>
              {colours.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}

          {/* Availability */}
          <select
            value={selectedAvailability}
            onChange={(e) => setSelectedAvailability(e.target.value)}
            className="h-9 px-3.5 rounded-full border border-black/10 text-xs bg-[#FAF9F6] focus:outline-none focus:border-[#B08D57]"
          >
            <option value="all">Availability: All</option>
            <option value="in_stock">In Stock Only</option>
            <option value="out_of_stock">Out of Stock Only</option>
          </select>
        </div>

        {/* Sort & Reset */}
        <div className="flex items-center gap-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="h-9 px-3.5 rounded-full border border-black/10 text-xs bg-white focus:outline-none focus:border-[#B08D57] font-semibold"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
          </select>

          <button
            onClick={clearFilters}
            className="h-9 px-4 rounded-full text-xs font-medium text-gray-500 hover:text-black border border-transparent hover:border-gray-300"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Mobile Filter Toggle */}
      <div className="lg:hidden flex items-center justify-between">
        <button
          onClick={() => setShowMobileFilters(true)}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-white border border-black/10 text-xs font-semibold"
        >
          <Filter className="w-3.5 h-3.5 text-[#B08D57]" /> Filter & Sort
        </button>
        <span className="text-xs text-gray-500 font-light">{filteredProducts.length} Results</span>
      </div>

      {/* Mobile Filter Drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-xs bg-white h-full p-6 space-y-6 overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b">
              <h3 className="font-heading text-lg font-medium">Filter Store</h3>
              <button onClick={() => setShowMobileFilters(false)}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4 font-sans text-xs">
              <div>
                <label className="block font-semibold mb-1">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-2.5 rounded-lg border text-xs"
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Collection</label>
                <select
                  value={selectedCollection}
                  onChange={(e) => setSelectedCollection(e.target.value)}
                  className="w-full p-2.5 rounded-lg border text-xs"
                >
                  <option value="all">All Collections</option>
                  {collections.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full p-2.5 rounded-lg border text-xs"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                </select>
              </div>
            </div>

            <div className="pt-4 flex gap-2">
              <button
                onClick={() => { clearFilters(); setShowMobileFilters(false) }}
                className="flex-1 py-3 border border-gray-300 rounded-full text-xs font-semibold"
              >
                Reset
              </button>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="flex-1 py-3 bg-[#111111] text-white rounded-full text-xs font-semibold"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid Results */}
      {loading ? (
        <div className="py-16 text-center text-xs tracking-widest text-gray-400 animate-pulse">
          LOADING CURATIONS...
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-gray-200 space-y-3">
          <p className="font-sans text-sm font-medium text-[#111111]">No curations match your current search or filters.</p>
          <button
            onClick={clearFilters}
            className="px-6 py-2.5 rounded-full bg-[#111111] text-white text-xs font-semibold tracking-wider uppercase"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  )
}
