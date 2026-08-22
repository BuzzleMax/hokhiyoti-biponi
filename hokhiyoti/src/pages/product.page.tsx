import { useEffect, useState } from 'react'
import { useParams, Link } from 'wouter'
import { ChevronRight, Share2, Shield, Truck, RotateCcw, Check } from 'lucide-react'
import { supabaseProductService } from '../services/supabase/product.service'
import { supabaseOrderService } from '../services/supabase/order.service'
import type { Product } from '../types/product.types'
import { formatPriceINR, getWhatsAppProductUrl, calculateCommission } from '../lib/utils'
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
        if (found) {
          if (found.sizes && found.sizes.length > 0 && found.sizes[0]) {
            setSelectedSize(found.sizes[0].size)
          }
          if (found.colours && found.colours.length > 0 && found.colours[0]) {
            setSelectedColor(found.colours[0].name)
          }
          addRecentlyViewed(found)
        }
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
        <div className="font-sans text-xs tracking-[0.2em] text-[#8a8a8a] animate-pulse uppercase">
          Curating Luxury Experience...
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#FAF9F6] p-6 text-center space-y-8">
        <h2 className="font-heading text-3xl font-medium text-[#0a0a0a]">Product Not Found</h2>
        <p className="font-sans text-xs text-[#8a8a8a] max-w-md leading-relaxed">
          The curated piece you are looking for may have moved or is no longer available in our active collection.
        </p>
        <Link to="/collection">
          <button className="h-12 px-8 rounded-lg bg-[#0a0a0a] hover:bg-[#B08D57] text-[#FAF9F6] font-sans text-xs font-semibold tracking-[0.15em] uppercase transition-colors duration-400">
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
    productId: product.id,
    selectedColour: selectedColor,
    selectedSize: product.enableSizes ? selectedSize : undefined,
    enableSizes: product.enableSizes,
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
        selectedColour: selectedColor,
        selectedSize: product.enableSizes ? selectedSize : undefined,
        productUrl: fullUrl,
      })
    } catch (err) {
      console.error('Failed to save order, opening WhatsApp anyway:', err)
    }
    window.open(whatsappUrl, '_blank', 'noreferrer')
  }

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
    <div className="bg-[#FAF9F6] min-h-screen py-12 px-6 md:px-12 max-w-[1600px] mx-auto space-y-20">
      {/* Breadcrumbs Navigation */}
      <nav className="flex items-center gap-2 text-xs font-sans font-light text-[#8a8a8a] overflow-x-auto whitespace-nowrap">
        <Link to="/" className="hover:text-[#B08D57] transition-colors duration-300">Home</Link>
        <ChevronRight className="w-3 h-3 text-[#8a8a8a]" />
        <Link to="/collection" className="hover:text-[#B08D57] transition-colors duration-300">Collection</Link>
        {product.category?.name && (
          <>
            <ChevronRight className="w-3 h-3 text-[#8a8a8a]" />
            <span className="text-[#0a0a0a] font-medium">{product.category.name}</span>
          </>
        )}
        <ChevronRight className="w-3 h-3 text-[#8a8a8a]" />
        <span className="text-[#8a8a8a] truncate max-w-[180px]">{product.name}</span>
      </nav>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
        {/* Left Media Gallery */}
        <div className="lg:col-span-7">
          <ProductGallery images={product.images} videos={product.videos} productName={product.name} />
        </div>

        {/* Right Product Details & Buy Section */}
        <div className="lg:col-span-5 space-y-10">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              {product.category?.name && (
                <span className="font-sans text-[11px] font-semibold tracking-[0.2em] text-[#B08D57] uppercase">
                  {product.category.name}
                </span>
              )}

              <button
                onClick={handleShare}
                className="p-2 text-[#8a8a8a] hover:text-[#0a0a0a] transition-colors duration-300 relative ml-auto"
                aria-label="Share product"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                {copiedLink && (
                  <span className="absolute -bottom-8 right-0 bg-[#0a0a0a] text-white text-[10px] py-1 px-2.5 rounded shadow">
                    Copied!
                  </span>
                )}
              </button>
            </div>

            <h1 className="font-heading text-3xl md:text-4xl font-medium text-[#0a0a0a] leading-snug">
              {product.name}
            </h1>

            <div className="flex items-baseline gap-3 pt-2">
              <span className="font-sans text-2xl md:text-3xl font-semibold text-[#0a0a0a]">
                {formatPriceINR(product.price)}
              </span>
              {product.comparePrice && product.comparePrice > product.price && (
                <span className="font-sans text-base text-[#8a8a8a] line-through font-light">
                  {formatPriceINR(product.comparePrice)}
                </span>
              )}
              {discountPercent && (
                <span className="font-sans text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                  {discountPercent}% OFF
                </span>
              )}
            </div>

            <div className="pt-2">
              {product.availabilityStatus === 'out_of_stock' ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#8B3A3A] bg-[#8B3A3A]/5 border border-[#8B3A3A]/20 px-3 py-1.5 rounded-lg">
                  <span className="w-2 h-2 rounded-full bg-[#8B3A3A] animate-pulse" /> Out of Stock
                </span>
              ) : product.availabilityStatus === 'low_stock' ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#B08D57] bg-[#B08D57]/5 border border-[#B08D57]/20 px-3 py-1.5 rounded-lg">
                  <span className="w-2 h-2 rounded-full bg-[#B08D57] animate-pulse" /> Only {product.stockQuantity} Left in Stock
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" /> In Stock & Ready to Dispatch
                </span>
              )}
            </div>
          </div>

          {product.description && (
            <p className="font-sans text-sm text-[#4a4a4a] leading-relaxed font-light">
              {product.description}
            </p>
          )}

          {/* Bullet Highlights */}
          <ProductHighlights highlights={product.highlights} />

          {/* Colours Chip Selector */}
          {product.colours && product.colours.length > 0 && (
            <div className="space-y-4">
              <span className="font-sans text-[11px] font-semibold tracking-[0.15em] text-[#0a0a0a] uppercase block">
                Select Colour — <span className="text-[#B08D57]">{selectedColor}</span>
              </span>
              <div className="flex flex-wrap gap-2.5">
                {product.colours.map((c, idx) => {
                  const isSelected = selectedColor === c.name
                  return (
                    <button
                      key={c.id || idx}
                      onClick={() => setSelectedColor(c.name)}
                      className={`inline-flex items-center gap-2 h-10 px-4 rounded-lg font-sans text-xs tracking-[0.15em] border transition-all duration-300 ${
                        isSelected
                          ? 'border-[#0a0a0a] bg-[#0a0a0a] text-[#FAF9F6] shadow-sm scale-105'
                          : 'border-black/15 text-[#0a0a0a] bg-white hover:border-[#0a0a0a]'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/20"
                        style={{ backgroundColor: c.hexCode || '#0a0a0a' }}
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
            <div className="space-y-4">
              <span className="font-sans text-[11px] font-semibold tracking-[0.15em] text-[#0a0a0a] uppercase block">
                Select Size — <span className="text-[#B08D57]">{selectedSize}</span>
              </span>
              <div className="flex flex-wrap gap-2.5">
                {product.sizes.map((s, idx) => {
                  const isSelected = selectedSize === s.size
                  return (
                    <button
                      key={s.id || idx}
                      onClick={() => setSelectedSize(s.size)}
                      className={`h-11 px-5 rounded-lg font-sans text-xs font-medium tracking-[0.15em] border transition-all duration-300 ${
                        isSelected
                          ? 'border-[#0a0a0a] bg-[#0a0a0a] text-[#FAF9F6] shadow-sm scale-105'
                          : 'border-black/15 text-[#0a0a0a] bg-white hover:border-[#0a0a0a]'
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
          <div className="space-y-4 pt-4">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              onClick={handleBuyClick}
              className="flex w-full h-16 rounded-lg bg-[#0a0a0a] text-[#FAF9F6] hover:bg-[#B08D57] transition-all duration-400 font-sans text-xs font-semibold tracking-[0.2em] uppercase items-center justify-center shadow-elevated hover:shadow-editorial gap-2"
              aria-label={`Buy ${product.name} on WhatsApp`}
            >
              <span>BUY NOW ON WHATSAPP</span>
            </a>
            <p className="font-sans text-[11px] text-[#8a8a8a] text-center font-light leading-relaxed">
              Instant assistance & direct order confirmation with our consultants.
            </p>
          </div>

          {/* Assurances */}
          {hasAssurances && (
            <div className="pt-8 border-t border-[rgba(0,0,0,0.04)] space-y-4">
              {product.shippingInfo && (
                <div className="flex items-center gap-3 text-xs text-[#4a4a4a] font-light">
                  <Truck className="w-4 h-4 stroke-[1.5] text-[#B08D57]" />
                  <span>{product.shippingInfo}</span>
                </div>
              )}
              {product.returnPolicy && (
                <div className="flex items-center gap-3 text-xs text-[#4a4a4a] font-light">
                  <RotateCcw className="w-4 h-4 stroke-[1.5] text-[#B08D57]" />
                  <span>{product.returnPolicy}</span>
                </div>
              )}
              {product.fabric && (
                <div className="flex items-center gap-3 text-xs text-[#4a4a4a] font-light">
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
