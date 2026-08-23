import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'wouter'
import { X, Volume2, VolumeX, Play, Pause, ShoppingBag, ArrowRight } from 'lucide-react'
import type { WatchBuyVideo } from '../../../types/watchBuy.types'
import { formatPriceINR } from '../../../lib/utils'

interface WatchBuyModalProps {
  video: WatchBuyVideo | null
  onClose: () => void
}

export default function WatchBuyModal({ video, onClose }: WatchBuyModalProps) {
  const [, setLocation] = useLocation()
  const modalRef = useRef<HTMLDivElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(false) // Sound enabled upon opening interactive modal

  useEffect(() => {
    if (!video) return

    // Prevent background scrolling while modal is active
    document.body.style.overflow = 'hidden'

    // Play video automatically on open
    const videoEl = videoRef.current
    if (videoEl) {
      videoEl.muted = false
      videoEl
        .play()
        .then(() => {
          setIsPlaying(true)
          setIsMuted(false)
        })
        .catch(() => {
          // If browser blocks unmuted play on initial click, fallback to muted play
          videoEl.muted = true
          setIsMuted(true)
          videoEl.play().catch(() => setIsPlaying(false))
        })
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [video, onClose])

  if (!video) return null

  const togglePlay = () => {
    const videoEl = videoRef.current
    if (!videoEl) return
    if (isPlaying) {
      videoEl.pause()
      setIsPlaying(false)
    } else {
      videoEl.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
    }
  }

  const toggleMute = () => {
    const videoEl = videoRef.current
    if (!videoEl) return
    videoEl.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const handleProductClick = (productId: string) => {
    onClose()
    setLocation(`/product/${productId}`)
  }

  const products = video.products || []

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-10 bg-black/85 backdrop-blur-md overflow-y-auto"
      onClick={(e) => {
        if (e.target === modalRef.current) onClose()
      }}
    >
      {/* Modal Container */}
      <div className="relative w-full max-w-5xl bg-[#111111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[92vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-black/60 hover:bg-[#B08D57] text-white border border-white/20 transition-colors cursor-pointer"
          aria-label="Close video viewer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Video Player Stage (Left / Top) */}
        <div className="relative flex-1 bg-black flex items-center justify-center min-h-[320px] sm:min-h-[440px] md:min-h-[580px] overflow-hidden">
          <video
            ref={videoRef}
            src={video.videoUrl}
            poster={video.posterUrl}
            loop
            playsInline
            onClick={togglePlay}
            className="w-full h-full max-h-[75vh] md:max-h-[85vh] object-contain cursor-pointer"
          />

          {/* Video Control Bar Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-center justify-between z-20">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="p-2 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-md transition-colors cursor-pointer"
                aria-label={isPlaying ? 'Pause video' : 'Play video'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
              </button>

              <button
                onClick={toggleMute}
                className="p-2 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-md transition-colors cursor-pointer"
                aria-label={isMuted ? 'Unmute video' : 'Mute video'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <span className="font-sans text-xs text-white/80 font-medium truncate max-w-[200px] sm:max-w-[300px]">
                {video.title}
              </span>
            </div>
          </div>
        </div>

        {/* Products Seen in Video Panel (Right / Bottom) */}
        <div className="w-full md:w-[380px] lg:w-[420px] bg-[#FAF9F6] text-[#111111] flex flex-col max-h-[45vh] md:max-h-[85vh] border-t md:border-t-0 md:border-l border-black/10">
          {/* Header */}
          <div className="p-5 border-b border-black/10 bg-white flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#B08D57]" />
              <h2 className="font-heading text-lg font-medium text-[#111111]">
                Products Seen in the video
              </h2>
            </div>
            <span className="font-sans text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#B08D57]/10 text-[#B08D57]">
              {products.length} {products.length === 1 ? 'Item' : 'Items'}
            </span>
          </div>

          {/* Product List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
            {products.length === 0 ? (
              <div className="py-12 text-center text-gray-400 font-sans text-xs font-light">
                No specific products tagged in this video.
              </div>
            ) : (
              products.map((product) => {
                const coverImage = product.images?.[0]?.url || ''
                const isOutOfStock =
                  product.outOfStock ||
                  product.availabilityStatus === 'out_of_stock' ||
                  product.stockQuantity <= 0

                const discountPercent =
                  product.comparePrice && product.comparePrice > product.price
                    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
                    : null

                return (
                  <div
                    key={product.id}
                    onClick={() => handleProductClick(product.id)}
                    className="group bg-white p-3 rounded-xl border border-black/5 hover:border-[#B08D57]/40 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-3.5 cursor-pointer"
                  >
                    {/* Product Image */}
                    <div className="relative w-20 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {coverImage ? (
                        <img
                          src={coverImage}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-[10px]">
                          No Image
                        </div>
                      )}
                      {discountPercent && !isOutOfStock && (
                        <span className="absolute top-1 left-1 bg-red-600 text-white font-sans text-[9px] font-bold px-1.5 py-0.5 rounded">
                          {discountPercent}% OFF
                        </span>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-heading text-sm font-medium text-[#111111] truncate group-hover:text-[#B08D57] transition-colors">
                        {product.name}
                      </h4>

                      {/* Pricing */}
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="font-sans text-sm font-bold text-[#111111]">
                          {formatPriceINR(product.price)}
                        </span>
                        {product.comparePrice && product.comparePrice > product.price && (
                          <span className="font-sans text-xs text-gray-400 line-through">
                            {formatPriceINR(product.comparePrice)}
                          </span>
                        )}
                      </div>

                      {/* Stock / Availability Status */}
                      <div className="mt-2 flex items-center justify-between">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center text-[10px] font-semibold text-red-600 px-2 py-0.5 rounded bg-red-50">
                            Out of Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[10px] font-semibold text-emerald-700 px-2 py-0.5 rounded bg-emerald-50">
                            Available
                          </span>
                        )}

                        <span className="inline-flex items-center gap-1 font-sans text-xs font-semibold text-[#B08D57] group-hover:translate-x-0.5 transition-transform">
                          Shop <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
