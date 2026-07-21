import { useEffect, useState } from 'react'
import { useParams, Link } from 'wouter'
import { ArrowLeft, Shield, Truck, RotateCcw } from 'lucide-react'
import { supabaseProductService } from '../services/supabase/product.service'
import type { Product } from '../types/product.types'
import { formatPriceINR, getWhatsAppProductUrl } from '../lib/utils'

export default function ProductPage() {
  const { id } = useParams() as { id?: string }
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [selectedColor, setSelectedColor] = useState<string>('')
  const [activeImageIdx, setActiveImageIdx] = useState(0)

  useEffect(() => {
    if (!id) return
    let active = true
    supabaseProductService
      .getProductBySlug(id)
      .then((found) => {
        if (!active) return
        setProduct(found)
        if (found.sizes?.length) setSelectedSize(found.sizes[0] ?? '')
        if (found.colors?.length) setSelectedColor(found.colors[0] ?? '')
        setLoading(false)
      })
      .catch(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
      setLoading(true)
    }
  }, [id])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#FAF9F6]">
        <div className="font-sans text-xs tracking-widest text-[#666666] animate-pulse">
          LOADING CURATION...
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-[#FAF9F6] p-6 space-y-6">
        <h2 className="font-heading text-2xl font-medium text-[#111111]">Product Not Found</h2>
        <Link to="/">
          <button className="h-12 px-8 rounded-full bg-[#111111] text-[#FAF9F6] font-sans text-xs font-semibold tracking-widest uppercase">
            RETURN HOME
          </button>
        </Link>
      </div>
    )
  }

  const whatsappUrl = getWhatsAppProductUrl(product.name, product.price)

  return (
    <div className="bg-[#FAF9F6] min-h-screen py-16 px-6 md:px-12 max-w-[1400px] mx-auto">
      {/* Back link */}
      <Link to="/" className="inline-flex items-center gap-2 font-sans text-xs font-semibold tracking-widest text-[#111111] hover:text-[#B08D57] transition-colors mb-12">
        <ArrowLeft className="w-4 h-4 stroke-[1.2]" />
        <span>BACK TO curations</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
        {/* Left: Images */}
        <div className="lg:col-span-7 space-y-4">
          <div className="aspect-[4/5] w-full rounded-2xl overflow-hidden bg-white shadow-soft border border-[rgba(0,0,0,0.03)]">
            <img
              src={product.images[activeImageIdx]?.url}
              alt={product.images[activeImageIdx]?.alt || product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex gap-4">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`relative w-20 aspect-[4/5] rounded-lg overflow-hidden border bg-white ${
                    activeImageIdx === idx ? 'border-[#B08D57]' : 'border-[rgba(0,0,0,0.06)]'
                  }`}
                >
                  <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Info */}
        <div className="lg:col-span-5 space-y-8">
          <div className="space-y-3">
            <span className="font-sans text-[11px] font-medium tracking-[0.25em] text-[#B08D57] uppercase">
              {product.category?.name}
            </span>
            <h1 className="font-heading text-3xl md:text-4xl font-medium text-[#111111] leading-tight">
              {product.name}
            </h1>
            <p className="font-sans text-xl font-semibold text-[#111111]">
              {formatPriceINR(product.price)}
            </p>
          </div>

          <p className="font-sans text-sm text-[#666666] leading-relaxed font-light">
            {product.description}
          </p>

          {/* Color Selector */}
          {product.colors?.length > 0 && (
            <div className="space-y-3">
              <span className="font-sans text-[10px] font-semibold tracking-widest text-[#111111] uppercase block">
                Select Color — {selectedColor}
              </span>
              <div className="flex gap-2">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    className={`h-10 px-4 rounded-full font-sans text-xs tracking-wider border transition-colors ${
                      selectedColor === c
                        ? 'border-[#111111] bg-[#111111] text-[#FAF9F6]'
                        : 'border-[rgba(0,0,0,0.12)] text-[#111111] hover:border-[#111111]'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size Selector */}
          {product.sizes?.length > 0 && (
            <div className="space-y-3">
              <span className="font-sans text-[10px] font-semibold tracking-widest text-[#111111] uppercase block">
                Select Size — {selectedSize}
              </span>
              <div className="flex gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`h-10 px-4 rounded-full font-sans text-xs tracking-wider border transition-colors ${
                      selectedSize === s
                        ? 'border-[#111111] bg-[#111111] text-[#FAF9F6]'
                        : 'border-[rgba(0,0,0,0.12)] text-[#111111] hover:border-[#111111]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="flex w-full h-12 rounded-full bg-[#111111] text-[#FAF9F6] hover:bg-[#B08D57] transition-colors duration-300 font-sans text-xs font-semibold tracking-widest uppercase items-center justify-center"
              aria-label={`Buy ${product.name} on WhatsApp`}
            >
              BUY NOW ON WHATSAPP
            </a>
            <p className="font-sans text-xs text-[#666666] leading-relaxed font-light">
              Availability: {product.availability}
            </p>
          </div>

          {/* Assurances */}
          <div className="pt-6 border-t border-[rgba(0,0,0,0.06)] space-y-4">
            <div className="flex items-center gap-3 text-xs text-[#666666] font-light">
              <Truck className="w-4 h-4 stroke-[1.2] text-[#B08D57]" />
              <span>Shipping details are confirmed directly on WhatsApp before dispatch.</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#666666] font-light">
              <RotateCcw className="w-4 h-4 stroke-[1.2] text-[#B08D57]" />
              <span>Return and exchange support is shared before you confirm your order.</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#666666] font-light">
              <Shield className="w-4 h-4 stroke-[1.2] text-[#B08D57]" />
              <span>All orders are handled personally through our official WhatsApp store line.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
