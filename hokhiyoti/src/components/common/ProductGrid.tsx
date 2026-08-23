import type { Product } from '../../types/product.types'
import ProductCard from '../home/ProductCard'

interface ProductGridProps {
  products: Product[]
  loading?: boolean
  skeletonCount?: number
  emptyMessage?: string
  className?: string
}

export default function ProductGrid({
  products,
  loading = false,
  skeletonCount = 6,
  emptyMessage = 'No curations match your request.',
  className = '',
}: ProductGridProps) {
  if (loading && products.length === 0) {
    return (
      <div
        className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5 lg:gap-6 ${className}`}
      >
        {Array.from({ length: skeletonCount }).map((_, idx) => (
          <div
            key={`skel-${idx}`}
            className="flex flex-col bg-white rounded-xl overflow-hidden border border-[rgba(0,0,0,0.04)] animate-pulse"
          >
            <div className="aspect-[4/5] bg-gray-200 w-full" />
            <div className="p-3 sm:p-4 space-y-2.5 flex-1 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="h-3.5 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-100 rounded w-1/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!loading && products.length === 0) {
    return (
      <div className="py-16 text-center bg-white/60 rounded-2xl border border-dashed border-black/10 p-8">
        <p className="font-sans text-xs sm:text-sm text-[#8a8a8a] tracking-wide font-light">
          {emptyMessage}
        </p>
      </div>
    )
  }

  return (
    <div
      className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5 lg:gap-6 ${className}`}
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
