import { memo } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'wouter'
import type { Product } from '../../types/product.types'
import { formatPriceINR, getWhatsAppProductUrl, calculateCommission } from '../../lib/utils'
import { supabaseOrderService } from '../../services/supabase/order.service'

const ProductCard = memo(function ProductCard({ product }: { product: Product }) {
  const img = product.images?.[0]
  const hoverImg = product.images?.[1] || img
  const targetPath = `/product/${product.id}`
  const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${targetPath}` : undefined

  const whatsappUrl = getWhatsAppProductUrl({
    productName: product.name,
    price: product.price,
    productId: product.id,
    productUrl: fullUrl,
  })

  const handleBuyClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    try {
      const commissionPct = await supabaseOrderService.getCommissionPercentage()
      const { commissionAmount, sellerEarnings } = calculateCommission(product.price, commissionPct)

      await supabaseOrderService.createOrder({
        productId: product.id,
        productName: product.name,
        productPrice: product.price,
        commissionPercentage: commissionPct,
        commissionAmount,
        sellerEarnings,
        productUrl: fullUrl,
      })
    } catch (err) {
      console.error('Failed to save order, opening WhatsApp anyway:', err)
    }
    window.open(whatsappUrl, '_blank', 'noreferrer')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
      className="group flex flex-col bg-[#FFFFFF] rounded-xl overflow-hidden shadow-elevated border border-[rgba(0,0,0,0.04)]"
    >
      {/* Image Container */}
      <Link to={targetPath} className="relative block aspect-[4/5] w-full overflow-hidden bg-[#FAF9F6]">
        <div className="relative aspect-[4/5] bg-[#FAF9F6]">
          {img ? (
            <>
              <img
                src={img.url}
                alt={img.alt || product.name}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-1200 ease-out group-hover:scale-105 group-hover:opacity-0"
              />
              {hoverImg && (
                <img
                  src={hoverImg.url}
                  alt={hoverImg.alt || product.name}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover opacity-0 scale-100 transition-all duration-1200 ease-out group-hover:scale-105 group-hover:opacity-100"
                />
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-xs tracking-widest text-[#8a8a8a] font-sans">
              NO IMAGE AVAILABLE
            </div>
          )}
        </div>
        {product.category?.name && (
          <div className="absolute top-4 left-4 bg-[#0a0a0a] text-[#FAF9F6] font-sans text-[9px] tracking-[0.15em] font-medium py-1.5 px-4 rounded-lg z-10">
            {product.category.name.toUpperCase()}
          </div>
        )}
        {product.availabilityStatus === 'out_of_stock' && (
          <div className="absolute top-4 right-4 bg-[#8B3A3A] text-white font-sans text-[9px] font-bold tracking-[0.15em] uppercase py-1.5 px-3 rounded-lg z-10">
            OUT OF STOCK
          </div>
        )}
        {product.availabilityStatus === 'low_stock' && (
          <div className="absolute top-4 right-4 bg-[#B08D57] text-white font-sans text-[9px] font-bold tracking-[0.15em] uppercase py-1.5 px-3 rounded-lg z-10">
            ONLY {product.stockQuantity} LEFT
          </div>
        )}
      </Link>

      {/* Product Info */}
      <div className="p-7 flex flex-col flex-1 bg-white">
        <div className="flex flex-col gap-2 mb-5">
          <Link to={targetPath} className="hover:text-[#B08D57] transition-colors duration-400">
            <h3 className="font-heading text-lg font-medium text-[#0a0a0a] leading-tight">{product.name}</h3>
          </Link>
          <p className="font-sans text-xs text-[#8a8a8a] line-clamp-1 leading-normal font-light">{product.description}</p>
        </div>

        <div className="mt-auto flex items-center justify-between pt-5 border-t border-[rgba(0,0,0,0.04)]">
          <div className="flex items-baseline gap-2">
            <span className="font-sans text-sm font-semibold text-[#0a0a0a]">{formatPriceINR(product.price)}</span>
            {product.comparePrice && product.comparePrice > product.price && (
              <span className="font-sans text-xs text-[#8a8a8a] line-through">{formatPriceINR(product.comparePrice)}</span>
            )}
          </div>

          <div className="inline-flex items-center gap-2">
            <Link
              to={targetPath}
              className="inline-flex h-10 px-5 rounded-lg border border-[#0a0a0a] text-[#0a0a0a] hover:bg-[#0a0a0a] hover:text-[#FAF9F6] transition-colors duration-400 font-sans text-[10px] font-semibold tracking-[0.15em] items-center"
            >
              DETAILS
            </Link>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              onClick={handleBuyClick}
              className="inline-flex h-10 px-5 rounded-lg bg-[#0a0a0a] text-[#FAF9F6] hover:bg-[#B08D57] transition-colors duration-400 font-sans text-[10px] font-semibold tracking-[0.15em] items-center"
              aria-label={`Buy ${product.name} on WhatsApp`}
            >
              BUY NOW
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  )
})

export default ProductCard
