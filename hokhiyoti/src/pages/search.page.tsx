import { useEffect, useState, useTransition } from 'react'
import type { Product } from '../types/product.types'
import { supabaseProductService } from '../services/supabase/product.service'
import ProductCard from '../components/home/ProductCard'
import { Search } from 'lucide-react'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    startTransition(async () => {
      try {
        const res = await supabaseProductService.searchProducts(query)
        setResults(res)
      } catch {
        setResults([])
      }
    })
  }, [query])

  return (
    <div className="bg-[#FAF9F6] min-h-screen py-16 px-6 md:px-12 max-w-[1400px] mx-auto">
      {/* Title */}
      <div className="text-center max-w-[600px] mx-auto mb-12 space-y-3">
        <span className="font-sans text-[11px] font-medium tracking-[0.25em] text-[#B08D57] uppercase">
          FIND CURATIONS
        </span>
        <h1 className="font-heading text-4xl md:text-5xl font-medium text-[#111111] leading-tight">
          Search the Store
        </h1>
      </div>

      {/* Search Input */}
      <div className="max-w-[600px] mx-auto relative mb-16">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type to search e.g. silk, knit, belt..."
          className="w-full h-14 pl-14 pr-6 rounded-full border border-[rgba(0,0,0,0.08)] bg-white text-sm focus:outline-none focus:ring-1 focus:ring-[#B08D57]"
          type="text"
        />
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666666] stroke-[1.2]" />
      </div>

      {/* Grid Results */}
      {isPending ? (
        <div className="py-12 text-center text-xs tracking-widest text-[#666666] animate-pulse">
          SEARCHING CURATIONS...
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {results.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center text-sm font-sans text-[#666666] tracking-wide">
          No matches found. Try searching for 'silk', 'beanie', or 'belt'.
        </div>
      )}
    </div>
  )
}
