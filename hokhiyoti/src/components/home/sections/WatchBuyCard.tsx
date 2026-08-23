import { useRef, useEffect, useState } from 'react'
import { Play, ShoppingBag } from 'lucide-react'
import type { WatchBuyVideo } from '../../../types/watchBuy.types'

interface WatchBuyCardProps {
  video: WatchBuyVideo
  onSelect: (video: WatchBuyVideo) => void
}

export default function WatchBuyCard({ video, onSelect }: WatchBuyCardProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const videoElement = videoRef.current
    if (!videoElement) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            videoElement
              .play()
              .then(() => setIsPlaying(true))
              .catch((err) => {
                console.warn('Autoplay prevented or failed:', err)
                setIsPlaying(false)
                setHasError(true)
              })
          } else {
            videoElement.pause()
            setIsPlaying(false)
          }
        })
      },
      { threshold: 0.35 }
    )

    observer.observe(videoElement)

    return () => {
      observer.disconnect()
    }
  }, [video.videoUrl])

  const productCount = video.products?.length || 0

  return (
    <div
      onClick={() => onSelect(video)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(video)
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Watch video: ${video.title}. Contains ${productCount} shopable products.`}
      className="group relative flex-shrink-0 w-[42vw] sm:w-[220px] md:w-[260px] aspect-[9/16] rounded-2xl overflow-hidden bg-black/90 border border-black/10 shadow-elevated cursor-pointer select-none transition-all duration-300 hover:scale-[1.02] hover:shadow-editorial focus:outline-none focus:ring-2 focus:ring-[#B08D57]"
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={video.videoUrl}
        poster={video.posterUrl}
        muted
        loop
        playsInline
        preload="metadata"
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 ${
          hasError && video.posterUrl ? 'opacity-0' : 'opacity-100'
        }`}
      />

      {/* Poster Image Fallback if video fails or is loading */}
      {(hasError || !isPlaying) && video.posterUrl && (
        <img
          src={video.posterUrl}
          alt={video.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Subtle Top & Bottom Gradient Overlay for typography contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-black/30 pointer-events-none" />

      {/* Top Tag Badges */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white font-sans text-[10px] font-semibold tracking-wider uppercase">
          <Play className="w-3 h-3 text-[#B08D57] fill-[#B08D57]" />
          Reel
        </span>

        {productCount > 0 && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#B08D57]/90 text-white font-sans text-[10px] font-bold tracking-wide shadow-sm">
            <ShoppingBag className="w-3 h-3" />
            {productCount} {productCount === 1 ? 'Item' : 'Items'}
          </span>
        )}
      </div>

      {/* Center Play Pulse Icon on Hover */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="w-13 h-13 rounded-full bg-white/25 backdrop-blur-md border border-white/40 flex items-center justify-center text-white shadow-lg transform group-hover:scale-110 transition-transform duration-300">
          <Play className="w-6 h-6 fill-white ml-0.5" />
        </div>
      </div>

      {/* Bottom Content / Title */}
      <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 text-white z-10 pointer-events-none">
        <h3 className="font-heading text-sm sm:text-base font-medium line-clamp-1 text-white drop-shadow-md">
          {video.title}
        </h3>
        {video.description && (
          <p className="font-sans text-[11px] sm:text-xs text-white/80 line-clamp-1 mt-0.5 font-light">
            {video.description}
          </p>
        )}
        <div className="mt-2 flex items-center gap-1.5 font-sans text-[11px] font-semibold text-[#E6CA94] group-hover:underline">
          <span>Tap to Watch & Shop</span>
          <span className="text-xs">→</span>
        </div>
      </div>
    </div>
  )
}
