import { useState, useRef } from 'react'
import { ZoomIn, ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { ProductImage } from '../../types/product.types'

interface ProductGalleryProps {
  images: ProductImage[]
  productName: string
}

export default function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [isZooming, setIsZooming] = useState(false)
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const mainImgRef = useRef<HTMLDivElement>(null)

  const fallbackImg: ProductImage = { url: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=1000&auto=format&fit=crop', alt: productName }
  const galleryImages = images && images.length > 0 ? images : [fallbackImg]
  const activeImage = galleryImages[activeIdx] ?? galleryImages[0] ?? fallbackImg

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mainImgRef.current) return
    const rect = mainImgRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomPos({ x, y })
  }

  const handlePrev = () => {
    setActiveIdx((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setActiveIdx((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1))
  }

  return (
    <div className="space-y-4">
      {/* Main Image Container */}
      <div
        ref={mainImgRef}
        onMouseEnter={() => setIsZooming(true)}
        onMouseLeave={() => setIsZooming(false)}
        onMouseMove={handleMouseMove}
        onClick={() => setIsModalOpen(true)}
        className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden bg-white shadow-sm border border-[rgba(0,0,0,0.06)] cursor-zoom-in group select-none"
      >
        <img
          src={activeImage.url}
          alt={activeImage.alt || productName}
          className={`w-full h-full object-cover transition-opacity duration-300 ${isZooming ? 'opacity-0 md:opacity-0' : 'opacity-100'}`}
          loading="eager"
        />

        {/* Desktop Magnifying Zoom Lens Overlay */}
        {isZooming && (
          <div
            className="hidden md:block absolute inset-0 pointer-events-none bg-no-repeat rounded-2xl"
            style={{
              backgroundImage: `url(${activeImage.url})`,
              backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
              backgroundSize: '220%',
            }}
          />
        )}

        {/* Zoom Icon Hint */}
        <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md p-2.5 rounded-full shadow-md text-[#111111] opacity-0 group-hover:opacity-100 transition-opacity">
          <ZoomIn className="w-4 h-4 stroke-[1.5]" />
        </div>

        {/* Mobile Swipe / Arrow Navigation Overlay */}
        {galleryImages.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); handlePrev() }}
              className="md:hidden absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-md p-2 rounded-full text-[#111111] shadow-sm"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleNext() }}
              className="md:hidden absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-md p-2 rounded-full text-[#111111] shadow-sm"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Mobile Swipe Pagination Indicator Dots */}
        {galleryImages.length > 1 && (
          <div className="md:hidden absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
            {galleryImages.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activeIdx === idx ? 'w-5 bg-[#B08D57]' : 'w-1.5 bg-black/30'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails below main image */}
      {galleryImages.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
          {galleryImages.map((img, idx) => (
            <button
              key={img.id || idx}
              onClick={() => setActiveIdx(idx)}
              className={`relative flex-shrink-0 w-20 aspect-[4/5] rounded-xl overflow-hidden border transition-all duration-300 ${
                activeIdx === idx
                  ? 'border-[#B08D57] ring-2 ring-[#B08D57]/20 scale-[1.02]'
                  : 'border-[rgba(0,0,0,0.08)] opacity-70 hover:opacity-100 hover:border-[#111111]'
              }`}
            >
              <img src={img.url} alt={img.alt || `${productName} ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Modal Preview */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <button
            onClick={() => setIsModalOpen(false)}
            className="absolute top-6 right-6 p-3 text-white/80 hover:text-white bg-white/10 rounded-full"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="relative max-w-4xl max-h-[85vh] aspect-[4/5] w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={activeImage.url}
              alt={activeImage.alt || productName}
              className="w-full h-full object-contain rounded-lg"
            />
            {galleryImages.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 p-3 rounded-full text-white"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 p-3 rounded-full text-white"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
