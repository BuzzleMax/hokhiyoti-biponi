import { useState, useEffect } from 'react'
import { Play } from 'lucide-react'

interface VideoThumbnailProps {
  videoUrl: string
  thumbnailUrl?: string
  alt?: string
  className?: string
  showPlayIcon?: boolean
  playIconSize?: 'sm' | 'md' | 'lg'
}

export default function VideoThumbnail({
  videoUrl,
  thumbnailUrl,
  alt = 'Product video preview',
  className = 'w-full h-full object-cover',
  showPlayIcon = true,
  playIconSize = 'md',
}: VideoThumbnailProps) {
  const [imgSrc, setImgSrc] = useState<string | undefined>(thumbnailUrl)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    setImgSrc(thumbnailUrl)
    setHasError(false)
  }, [thumbnailUrl, videoUrl])

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  const containerPadding = {
    sm: 'p-1.5',
    md: 'p-2.5',
    lg: 'p-3.5',
  }

  return (
    <div className="relative w-full h-full bg-[#0a0a0a] flex items-center justify-center overflow-hidden select-none">
      {imgSrc && !hasError ? (
        <img
          src={imgSrc}
          alt={alt}
          onError={() => setHasError(true)}
          loading="lazy"
          className={className}
        />
      ) : (
        <video
          src={videoUrl ? `${videoUrl}#t=0.5` : undefined}
          preload="metadata"
          muted
          playsInline
          className={`pointer-events-none ${className}`}
        />
      )}

      {showPlayIcon && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/25 hover:bg-black/40 transition-colors pointer-events-none z-10">
          <div
            className={`bg-white/90 backdrop-blur-md rounded-full shadow-lg text-[#0a0a0a] flex items-center justify-center transition-transform duration-300 ${containerPadding[playIconSize]}`}
          >
            <Play className={`${iconSizes[playIconSize]} fill-[#0a0a0a] text-[#0a0a0a] ml-0.5`} />
          </div>
        </div>
      )}

      {/* Video Indicator Badge in top-left */}
      <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-xs text-white text-[9px] font-sans font-semibold tracking-wider px-2 py-0.5 rounded-full uppercase z-10 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-[#B08D57]" />
        <span>VIDEO</span>
      </div>
    </div>
  )
}
