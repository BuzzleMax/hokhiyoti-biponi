import { useEffect, useState } from 'react'
import { useParams, Link } from 'wouter'
import { ChevronRight, Share2, Shield, Truck, RotateCcw, Check } from 'lucide-react'
import { supabaseProductService } from '../services/supabase/product.service'
import type { Product } from '../types/product.types'
import { formatPriceINR, getWhatsAppProductUrl } from '../lib/utils'
import { useSEO } from '../hooks/useSEO'
import { useRecentlyViewed } from '../hooks/useRecentlyViewed'

import ProductGallery from '../components/product/ProductGallery'
import ProductHighlights from '../components/product/ProductHighlights'
import ProductTabs from '../components/product/ProductTabs'
import ProductReviewsSection from '../components/product/ProductReviewsSection'
import RelatedProducts from '../components/product/RelatedProducts'
import RecentlyViewedSection from '../components/product/RecentlyViewedSection'

export default function ProductPage() {
  const { id } = useParams() as { id?: string }
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  const [selectedSize, setSelectedSize] = useState<string>('')
  const [selectedColor, setSelectedColor] = useState<string>('')
  const [copiedLink, setCopiedLink] = useState(false)

  const { recentlyViewed, addRecentlyViewed } = useRecentlyViewed()

  useEffect(() => {
    if (!id) return
    let active = true
    setLoading(true)

    supabaseProductService
      .getProductByIdOrSlug(id)
      .then((found) => {
        if (!active) return
        setProduct(found)
        if (found.sizes && found.sizes.length > 0 && found.sizes[0]) {
          setSelectedSize(found.sizes[0].size)
        }
        if (found.colours && found.colours.length > 0 && found.colours[0]) {
          setSelectedColor(found.colours[0].name)
        }
        addRecentlyViewed(found)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to fetch product:', err)
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [id])

  const fullUrl = typeof window !== 'undefined' ? window.location.href : ''

  useSEO({
    title: product ? `${product.name} | Luxury Handloom` : 'Product Details',
    description: product?.description || 'Authentic Assam Silk & Handloom Collections',
    image: product?.images?.[0]?.url,
    url: fullUrl,
    product: product || undefined,
    breadcrumbs: product
      ? [
          { name: 'Home', item: typeof window !== 'undefined' ? window.location.origin : '' },
          { name: 'Collection', item: `${typeof window !== 'undefined' ? window.location.origin : ''}/collection` },
          { name: product.category?.name || 'Curations', item: `${typeof window !== 'undefined' ? window.location.origin : ''}/category` },
          { name: product.name, item: fullUrl },
        ]
      : undefined,
  })

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#FAF9F6]">
        <div className="w-10 h-10 border-2 border-[#B08D57] border-t-transparent rounded-full animate-spin mb-4" />
        <div className="font-sans text-xs tracking-widest text-[#666666] animate-pulse uppercase">
          Curating Luxury Experience...
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#FAF9F6] p-6 text-center space-y-6">
        <h2 className="font-heading text-3xl font-medium text-[#111111]">Product Not Found</h2>
        <p className="font-sans text-xs text-gray-500 max-w-md leading-relaxed">
          The curated piece you are looking for may have moved or is no longer available in our active collection.
        </p>
        <Link to="/collection">
          <button className="h-12 px-8 rounded-full bg-[#111111] hover:bg-[#B08D57] text-[#FAF9F6] font-sans text-xs font-semibold tracking-widest uppercase transition-colors">
            EXPLORE CURATIONS
          </button>
        </Link>
      </div>
    )
  }

  const discountPercent =
    product.comparePrice && product.comparePrice > product.price
      ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
      : null

  const whatsappUrl = getWhatsAppProductUrl({
    productName: product.name,
    price: product.price,
    selectedColour: selectedColor,
    selectedSize: product.enableSizes ? selectedSize : undefined,
    enableSizes: product.enableSizes,
    productUrl: fullUrl,
  })

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: product.name, url: fullUrl }).catch(() => {})
    } else {
      navigator.clipboard.writeText(fullUrl)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    }
  }

  const hasAssurances = Boolean(product.shippingInfo || product.returnPolicy || product.fabric)

  return (
    <div className="bg-[#FAF9F6] min-h-screen py-10 px-4 md:px-12 max-w-[1400px] mx-auto space-y-16">
      {/* Breadcrumbs Navigation */}
      <nav className="flex items-center gap-2 text-xs font-sans font-light text-gray-500 overflow-x-auto whitespace-nowrap">
        <Link to="/" className="hover:text-[#B08D57] transition-colors">Home</Link>
        <ChevronRight className="w-3 h-3 text-gray-400" />
        <Link to="/collection" className="hover:text-[#B08D57] transition-colors">Collection</Link>
        {product.category?.name && (
          <>
            <ChevronRight className="w-3 h-3 text-gray-400" />
            <span className="text-[#111111] font-medium">{product.category.name}</span>
          </>
        )}
        <ChevronRight className="w-3 h-3 text-gray-400" />
        <span className="text-gray-400 truncate max-w-[180px]">{product.name}</span>
      </nav>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
        {/* Left Gallery */}
        <div className="lg:col-span-7">
          <ProductGallery images={product.images} productName={product.name} />
        </div>

        {/* Right Product Details & Buy Section */}
        <div className="lg:col-span-5 space-y-8">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              {product.category?.name && (
                <span className="font-sans text-[11px] font-semibold tracking-[0.25em] text-[#B08D57] uppercase">
                  {product.category.name}
                </span>
              )}

              <button
                onClick={handleShare}
                className="p-2 text-gray-500 hover:text-[#111111] transition-colors relative ml-auto"
                aria-label="Share product"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                {copiedLink && (
                  <span className="absolute -bottom-8 right-0 bg-black text-white text-[10px] py-1 px-2.5 rounded shadow">
                    Copied!
                  </span>
                )}
              </button>
            </div>

            <h1 className="font-heading text-3xl md:text-4xl font-medium text-[#111111] leading-snug">
              {product.name}
            </h1>

            <div className="flex items-baseline gap-3 pt-1">
              <span className="font-sans text-2xl md:text-3xl font-semibold text-[#111111]">
                {formatPriceINR(product.price)}
              </span>
              {product.comparePrice && product.comparePrice > product.price && (
                <span className="font-sans text-base text-gray-400 line-through font-light">
                  {formatPriceINR(product.comparePrice)}
                </span>
              )}
              {discountPercent && (
                <span className="font-sans text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {discountPercent}% OFF
                </span>
              )}
            </div>

            <div className="pt-1">
              {product.availabilityStatus === 'out_of_stock' ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-3 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" /> Out of Stock
                </span>
              ) : product.availabilityStatus === 'low_stock' ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" /> Only {product.stockQuantity} Left in Stock
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" /> In Stock & Ready to Dispatch
                </span>
              )}
            </div>
          </div>

          {product.description && (
            <p className="font-sans text-sm text-[#555555] leading-relaxed font-light">
              {product.description}
            </p>
          )}

          {/* Bullet Highlights - renders only if highlights exist */}
          <ProductHighlights highlights={product.highlights} />

          {/* Colours Chip Selector - renders only if colours exist */}
          {product.colours && product.colours.length > 0 && (
            <div className="space-y-3">
              <span className="font-sans text-[11px] font-semibold tracking-widest text-[#111111] uppercase block">
                Select Colour — <span className="text-[#B08D57]">{selectedColor}</span>
              </span>
              <div className="flex flex-wrap gap-2.5">
                {product.colours.map((c, idx) => {
                  const isSelected = selectedColor === c.name
                  return (
                    <button
                      key={c.id || idx}
                      onClick={() => setSelectedColor(c.name)}
                      className={`inline-flex items-center gap-2 h-10 px-4 rounded-full font-sans text-xs tracking-wider border transition-all ${
                        isSelected
                          ? 'border-[#111111] bg-[#111111] text-[#FAF9F6] shadow-sm scale-105'
                          : 'border-black/15 text-[#111111] bg-white hover:border-[#111111]'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/20"
                        style={{ backgroundColor: c.hexCode || '#111111' }}
                      />
                      <span>{c.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Size Selector - renders ONLY if enableSizes is true AND sizes exist */}
          {product.enableSizes && product.sizes && product.sizes.length > 0 && (
            <div className="space-y-3">
              <span className="font-sans text-[11px] font-semibold tracking-widest text-[#111111] uppercase block">
                Select Size — <span className="text-[#B08D57]">{selectedSize}</span>
              </span>
              <div className="flex flex-wrap gap-2.5">
                {product.sizes.map((s, idx) => {
                  const isSelected = selectedSize === s.size
                  return (
                    <button
                      key={s.id || idx}
                      onClick={() => setSelectedSize(s.size)}
                      className={`h-11 px-5 rounded-full font-sans text-xs font-medium tracking-wider border transition-all ${
                        isSelected
                          ? 'border-[#111111] bg-[#111111] text-[#FAF9F6] shadow-sm scale-105'
                          : 'border-black/15 text-[#111111] bg-white hover:border-[#111111]'
                      }`}
                    >
                      {s.size}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* WhatsApp Direct Buy Button */}
          <div className="space-y-3 pt-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="flex w-full h-14 rounded-full bg-[#111111] text-[#FAF9F6] hover:bg-[#B08D57] transition-all duration-300 font-sans text-xs font-semibold tracking-[0.2em] uppercase items-center justify-center shadow-md hover:shadow-lg gap-2"
              aria-label={`Buy ${product.name} on WhatsApp`}
            >
              <span>BUY NOW ON WHATSAPP</span>
            </a>
            <p className="font-sans text-[11px] text-[#777777] text-center font-light">
              Instant assistance & direct order confirmation with our consultants.
            </p>
          </div>

          {/* Assurances - renders ONLY if admin provided policies/info */}
          {hasAssurances && (
            <div className="pt-6 border-t border-[rgba(0,0,0,0.06)] space-y-3.5">
              {product.shippingInfo && (
                <div className="flex items-center gap-3 text-xs text-[#555555] font-light">
                  <Truck className="w-4 h-4 stroke-[1.5] text-[#B08D57]" />
                  <span>{product.shippingInfo}</span>
                </div>
              )}
              {product.returnPolicy && (
                <div className="flex items-center gap-3 text-xs text-[#555555] font-light">
                  <RotateCcw className="w-4 h-4 stroke-[1.5] text-[#B08D57]" />
                  <span>{product.returnPolicy}</span>
                </div>
              )}
              {product.fabric && (
                <div className="flex items-center gap-3 text-xs text-[#555555] font-light">
                  <Shield className="w-4 h-4 stroke-[1.5] text-[#B08D57]" />
                  <span>{product.fabric}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <ProductTabs product={product} />
      <ProductReviewsSection productId={product.id} productName={product.name} />
      <RelatedProducts
        currentProductId={product.id}
        categorySlug={product.category?.slug}
        collectionSlug={product.collection?.slug}
      />
      <RecentlyViewedSection products={recentlyViewed} currentProductId={product.id} />
    </div>
  )
}
