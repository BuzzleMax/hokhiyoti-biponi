import { memo } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'wouter'
import type { Product } from '../../types/product.types'
import { formatPriceINR } from '../../lib/utils'
import { getProductPrimaryMedia } from '../../lib/media.utils'
import VideoThumbnail from '../common/VideoThumbnail'

const ProductCard = memo(function ProductCard({ product }: { product: Product }) {
  const primaryMedia = getProductPrimaryMedia(product)
  const img = product.images?.[0]
  const hoverImg = product.images?.[1] || img
  const targetPath = `/product/${product.id}`

  const discountPercent =
    product.comparePrice && product.comparePrice > product.price
      ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
      : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      className="h-full flex flex-col"
    >
      <Link
        to={targetPath}
        className="group relative flex flex-col bg-white rounded-xl overflow-hidden shadow-elevated border border-[rgba(0,0,0,0.04)] h-full cursor-pointer transition-all duration-300 hover:shadow-editorial hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-[#B08D57]"
        aria-label={`View details for ${product.name}`}
      >
        {/* Media Thumbnail Container */}
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#FAF9F6]">
          {primaryMedia.type === 'video' ? (
            <VideoThumbnail
              videoUrl={primaryMedia.url}
              thumbnailUrl={primaryMedia.thumbnailUrl || img?.url}
              alt={primaryMedia.alt}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          ) : img ? (
            <>
              <img
                src={img.url}
                alt={img.alt || product.name}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-out group-hover:scale-105 group-hover:opacity-0"
              />
              {hoverImg && hoverImg !== img ? (
                <img
                  src={hoverImg.url}
                  alt={hoverImg.alt || product.name}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover opacity-0 scale-100 transition-all duration-700 ease-out group-hover:scale-105 group-hover:opacity-100"
                />
              ) : null}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-[10px] tracking-widest text-[#8a8a8a] font-sans">
              NO IMAGE AVAILABLE
            </div>
          )}

          {/* Badges */}
          {product.category?.name && (
            <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-[#0a0a0a]/90 backdrop-blur-xs text-[#FAF9F6] font-sans text-[8px] sm:text-[9px] tracking-[0.15em] font-medium py-0.5 px-2 sm:py-1 sm:px-3 rounded-md z-10">
              {product.category.name.toUpperCase()}
            </div>
          )}

          {product.outOfStock || product.availabilityStatus === 'out_of_stock' ? (
            <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-[#8B3A3A] text-white font-sans text-[8px] sm:text-[9px] font-bold tracking-[0.15em] uppercase py-0.5 px-2 sm:py-1 sm:px-2.5 rounded-md z-10">
              OUT OF STOCK
            </div>
          ) : product.availabilityStatus === 'low_stock' ? (
            <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-[#B08D57] text-white font-sans text-[8px] sm:text-[9px] font-bold tracking-[0.15em] uppercase py-0.5 px-2 sm:py-1 sm:px-2.5 rounded-md z-10">
              LOW STOCK
            </div>
          ) : null}
        </div>

        {/* Product Info Section (NO CTA Buttons) */}
        <div className="p-3 sm:p-4 flex flex-col flex-1 bg-white justify-between">
          <div className="space-y-1">
            <h3 className="font-heading text-xs sm:text-sm md:text-base font-medium text-[#0a0a0a] leading-snug line-clamp-1 group-hover:text-[#B08D57] transition-colors duration-300">
              {product.name}
            </h3>
            {product.description && (
              <p className="font-sans text-[10px] sm:text-xs text-[#8a8a8a] line-clamp-1 font-light leading-normal">
                {product.description}
              </p>
            )}
          </div>

          <div className="mt-3 pt-2.5 border-t border-[rgba(0,0,0,0.04)] flex items-baseline justify-between gap-1.5 flex-wrap">
            <div className="flex items-baseline gap-1.5">
              <span className="font-sans text-xs sm:text-sm font-semibold text-[#0a0a0a]">
                {formatPriceINR(product.price)}
              </span>
              {product.comparePrice && product.comparePrice > product.price && (
                <span className="font-sans text-[10px] sm:text-xs text-[#8a8a8a] line-through font-light">
                  {formatPriceINR(product.comparePrice)}
                </span>
              )}
            </div>

            {discountPercent ? (
              <span className="font-sans text-[9px] sm:text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded uppercase">
                {discountPercent}% OFF
              </span>
            ) : product.rating && product.rating > 0 ? (
              <span className="font-sans text-[9px] sm:text-[10px] text-[#B08D57] font-medium">
                ★ {product.rating.toFixed(1)}
              </span>
            ) : null}
          </div>
        </div>
      </Link>
    </motion.div>
  )
})

export default ProductCard
