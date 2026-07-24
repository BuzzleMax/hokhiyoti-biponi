import { useState, useRef, useEffect } from 'react'
import { ZoomIn, ChevronLeft, ChevronRight, X, Play, Video as VideoIcon } from 'lucide-react'
import type { ProductImage, ProductVideo } from '../../types/product.types'

interface ProductGalleryProps {
  images?: ProductImage[]
  videos?: ProductVideo[]
  productName: string
}

type MediaItem = {
  id?: string
  type: 'image' | 'video'
  url: string
  thumbnailUrl?: string
  alt?: string
  isCover?: boolean
}

export default function ProductGallery({ images = [], videos = [], productName }: ProductGalleryProps) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [isZooming, setIsZooming] = useState(false)
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const mainImgRef = useRef<HTMLDivElement>(null)

  const fallbackImg: MediaItem = {
    type: 'image',
    url: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=1000&auto=format&fit=crop',
    alt: productName,
  }

  const mediaList: MediaItem[] = []

  images.forEach((img, idx) => {
    mediaList.push({
      id: img.id || `img_${idx}`,
      type: 'image',
      url: img.url,
      alt: img.alt || productName,
      isCover: img.isCover,
    })
  })

  videos.forEach((vid, idx) => {
    mediaList.push({
      id: vid.id || `vid_${idx}`,
      type: 'video',
      url: vid.url,
      thumbnailUrl: vid.thumbnailUrl,
      alt: vid.alt || `${productName} Video`,
      isCover: vid.isCover,
    })
  })

  const galleryItems = mediaList.length > 0 ? mediaList : [fallbackImg]
  const activeMedia = galleryItems[activeIdx] ?? galleryItems[0] ?? fallbackImg

  // Reset play state when changing active media
  useEffect(() => {
    setIsPlaying(false)
  }, [activeIdx])

  // Preload only the next image in the background
  useEffect(() => {
    if (galleryItems.length <= 1) return
    const nextIdx = (activeIdx + 1) % galleryItems.length
    const nextItem = galleryItems[nextIdx]
    if (nextItem && nextItem.type === 'image') {
      const img = new Image()
      img.src = nextItem.url
    }
  }, [activeIdx, galleryItems])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeMedia.type !== 'image' || !mainImgRef.current) return
    const rect = mainImgRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomPos({ x, y })
  }

  const handlePrev = () => {
    setActiveIdx((prev) => (prev === 0 ? galleryItems.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setActiveIdx((prev) => (prev === galleryItems.length - 1 ? 0 : prev + 1))
  }

  return (
    <div className="space-y-4">
      {/* Main Media Display Container */}
      <div
        ref={mainImgRef}
        onMouseEnter={() => activeMedia.type === 'image' && setIsZooming(true)}
        onMouseLeave={() => setIsZooming(false)}
        onMouseMove={handleMouseMove}
        className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden bg-white shadow-sm border border-[rgba(0,0,0,0.06)] group select-none flex items-center justify-center"
      >
        {activeMedia.type === 'image' ? (
          <>
            <img
              src={activeMedia.url}
              alt={activeMedia.alt || productName}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                isZooming ? 'opacity-0 md:opacity-0' : 'opacity-100'
              }`}
              loading={activeIdx === 0 ? 'eager' : 'lazy'}
              onClick={() => setIsModalOpen(true)}
            />

            {/* Desktop Magnifying Zoom Lens Overlay */}
            {isZooming && (
              <div
                className="hidden md:block absolute inset-0 pointer-events-none bg-no-repeat rounded-2xl cursor-zoom-in"
                style={{
                  backgroundImage: `url(${activeMedia.url})`,
                  backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                  backgroundSize: '220%',
                }}
              />
            )}

            {/* Zoom Icon Hint */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md p-2.5 rounded-full shadow-md text-[#111111] opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Expand image"
            >
              <ZoomIn className="w-4 h-4 stroke-[1.5]" />
            </button>
          </>
        ) : (
          /* Video Player Container with lazy loading thumbnail */
          <div className="relative w-full h-full bg-black flex items-center justify-center">
            {isPlaying ? (
              <video
                src={activeMedia.url}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
            ) : (
              <div
                onClick={() => setIsPlaying(true)}
                className="absolute inset-0 flex items-center justify-center cursor-pointer select-none"
              >
                {activeMedia.thumbnailUrl ? (
                  <img
                    src={activeMedia.thumbnailUrl}
                    alt={activeMedia.alt || productName}
                    className="w-full h-full object-cover opacity-70"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white/70">
                    <VideoIcon className="w-8 h-8" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/45 transition-colors">
                  <div className="bg-white/90 backdrop-blur-md p-4 rounded-full shadow-lg text-[#111111] hover:scale-105 transition-transform duration-300">
                    <Play className="w-6 h-6 fill-[#111111] text-[#111111]" />
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={() => setIsModalOpen(true)}
              className="absolute top-4 right-4 bg-black/60 text-white p-2 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
              title="Fullscreen Video"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Gallery Counter Badge */}
        {galleryItems.length > 1 && (
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white text-[11px] font-sans font-medium px-3 py-1 rounded-full tracking-wider uppercase z-10">
            {activeIdx + 1} / {galleryItems.length}
          </div>
        )}

        {/* Mobile / Arrow Navigation Overlay */}
        {galleryItems.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handlePrev()
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white backdrop-blur-md p-2 rounded-full text-[#111111] shadow-sm transition-all z-10"
              aria-label="Previous media"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleNext()
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white backdrop-blur-md p-2 rounded-full text-[#111111] shadow-sm transition-all z-10"
              aria-label="Next media"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Mobile Pagination Indicator Dots */}
        {galleryItems.length > 1 && (
          <div className="md:hidden absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 pointer-events-none z-10">
            {galleryItems.map((_, idx) => (
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

      {/* Thumbnails Strip below main media */}
      {galleryItems.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
          {galleryItems.map((item, idx) => (
            <button
              key={item.id || idx}
              onClick={() => setActiveIdx(idx)}
              className={`relative flex-shrink-0 w-20 aspect-[4/5] rounded-xl overflow-hidden border transition-all duration-300 bg-gray-100 ${
                activeIdx === idx
                  ? 'border-[#B08D57] ring-2 ring-[#B08D57]/20 scale-[1.02]'
                  : 'border-[rgba(0,0,0,0.08)] opacity-70 hover:opacity-100 hover:border-[#111111]'
              }`}
            >
              {item.type === 'image' ? (
                <img
                  src={item.url}
                  alt={item.alt || `${productName} ${idx + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="relative w-full h-full bg-black flex items-center justify-center">
                  {item.thumbnailUrl ? (
                    <img src={item.thumbnailUrl} alt="Video thumbnail" className="w-full h-full object-cover opacity-70" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white/70">
                      <VideoIcon className="w-6 h-6" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Play className="w-5 h-5 text-white fill-white" />
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Lightbox / Video Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <button
            onClick={() => setIsModalOpen(false)}
            className="absolute top-6 right-6 p-3 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors z-50"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>

          <div
            className="relative max-w-5xl max-h-[85vh] w-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {activeMedia.type === 'image' ? (
              <img
                src={activeMedia.url}
                alt={activeMedia.alt || productName}
                className="max-h-[85vh] w-auto object-contain rounded-lg shadow-2xl"
              />
            ) : (
              <video
                src={activeMedia.url}
                controls
                autoPlay
                playsInline
                className="max-h-[85vh] w-full rounded-lg shadow-2xl"
              />
            )}

            {galleryItems.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 p-3 rounded-full text-white transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 p-3 rounded-full text-white transition-colors"
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
