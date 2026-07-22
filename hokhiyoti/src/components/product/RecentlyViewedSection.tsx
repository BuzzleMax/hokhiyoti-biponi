import ProductCard from '../home/ProductCard'
import { Clock } from 'lucide-react'
import type { Product } from '../../types/product.types'

interface RecentlyViewedSectionProps {
  products: Product[]
  currentProductId: string
}

export default function RecentlyViewedSection({ products, currentProductId }: RecentlyViewedSectionProps) {
  const filtered = products.filter((p) => p.id !== currentProductId && p.slug !== currentProductId).slice(0, 4)

  if (filtered.length === 0) return null

  return (
    <div className="pt-16 border-t border-[rgba(0,0,0,0.06)] space-y-8">
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-[#B08D57]" />
        <h2 className="font-heading text-2xl md:text-3xl font-medium text-[#111111]">
          Recently Viewed
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filtered.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}
