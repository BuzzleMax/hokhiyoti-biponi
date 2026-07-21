import { motion } from 'framer-motion'
import { Link } from 'wouter'
import type { Product } from '../../types/product.types'
import { formatPriceINR, getWhatsAppProductUrl } from '../../lib/utils'

export default function ProductCard({ product }: { product: Product }) {
  const img = product.images?.[0]
  const hoverImg = product.images?.[1] || img
  const whatsappUrl = getWhatsAppProductUrl(product.name, product.price)

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      className="group flex flex-col bg-[#FFFFFF] rounded-2xl overflow-hidden shadow-soft border border-[rgba(0,0,0,0.03)]"
    >
      {/* 4:5 Image Container with hover zoom */}
      <Link to={`/product/${product.id}`} className="relative block aspect-[4/5] w-full overflow-hidden bg-[#FAF9F6]">
        <div className="relative aspect-[4/5] bg-[#FAF9F6]">
          {img && hoverImg ? (
            <>
              {/* Primary Image */}
              <img
                src={img.url}
                alt={img.alt}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105 group-hover:opacity-0"
              />
              {/* Hover Image */}
              <img
                src={hoverImg.url}
                alt={hoverImg.alt}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover opacity-0 scale-100 transition-all duration-1000 ease-out group-hover:scale-105 group-hover:opacity-100"
              />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-xs tracking-widest text-[#666666] font-sans">
              NO IMAGE AVAILABLE
            </div>
          )}
        </div>

        {/* Currency tag */}
        <div className="absolute top-4 left-4 bg-[#111111] text-[#FAF9F6] font-sans text-[9px] tracking-widest font-medium py-1 px-3.5 rounded-full z-10">
          {product.category?.name.toUpperCase()}
        </div>
      </Link>

      {/* Product Info */}
      <div className="p-6 flex flex-col flex-1 bg-white">
        <div className="flex flex-col gap-1 mb-4">
          <Link to={`/product/${product.id}`} className="hover:text-[#B08D57] transition-colors duration-300">
            <h3 className="font-heading text-lg font-medium text-[#111111] leading-tight">
              {product.name}
            </h3>
          </Link>
          <p className="font-sans text-xs text-[#666666] line-clamp-1 leading-normal font-light">
            {product.description}
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between pt-4 border-t border-[rgba(0,0,0,0.04)]">
          <span className="font-sans text-sm font-semibold text-[#111111]">
            {formatPriceINR(product.price)}
          </span>
          <div className="inline-flex items-center gap-2">
            <Link
              to={`/product/${product.id}`}
              className="inline-flex h-10 px-5 rounded-full border border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-[#FAF9F6] transition-colors duration-300 font-sans text-[10px] font-semibold tracking-widest items-center"
            >
              DETAILS
            </Link>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 px-5 rounded-full bg-[#111111] text-[#FAF9F6] hover:bg-[#B08D57] transition-colors duration-300 font-sans text-[10px] font-semibold tracking-widest items-center"
              aria-label={`Buy ${product.name} on WhatsApp`}
            >
              BUY NOW
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
