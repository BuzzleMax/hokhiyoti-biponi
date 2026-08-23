import { useEffect, useState, useRef } from 'react'
import { ChevronLeft, ChevronRight, Play } from 'lucide-react'
import { supabaseWatchBuyService } from '../../../services/supabase/watchBuy.service'
import type { WatchBuyVideo } from '../../../types/watchBuy.types'
import WatchBuyCard from './WatchBuyCard'
import WatchBuyModal from './WatchBuyModal'

export default function WatchBuySection() {
  const [videos, setVideos] = useState<WatchBuyVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState<WatchBuyVideo | null>(null)

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  useEffect(() => {
    supabaseWatchBuyService
      .getWatchBuyVideos(true)
      .then((data) => setVideos(data))
      .catch((err) => console.error('Failed to load Watch & Buy videos:', err))
      .finally(() => setLoading(false))
  }, [])

  const updateScrollState = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 8)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8)
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    updateScrollState()
    el.addEventListener('scroll', updateScrollState, { passive: true })
    const resizeObs = new ResizeObserver(updateScrollState)
    resizeObs.observe(el)
    return () => {
      el.removeEventListener('scroll', updateScrollState)
      resizeObs.disconnect()
    }
  }, [videos])

  const scrollByAmount = (direction: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    const scrollAmount = el.clientWidth * 0.7
    el.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' })
  }

  // Hide the section entirely if not loading and no active videos exist
  if (!loading && videos.length === 0) return null

  return (
    <>
      <section
        aria-label="Watch & Buy video shopping section"
        className="py-16 sm:py-20 bg-[#0E0E0E] relative overflow-hidden"
      >
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 39px, #B08D57 39px, #B08D57 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, #B08D57 39px, #B08D57 40px)' }}
        />

        <div className="relative max-w-[1600px] mx-auto px-4 sm:px-6 md:px-12">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <span className="font-sans text-[11px] font-medium tracking-[0.3em] text-[#B08D57] uppercase block mb-2">
                FASHION REELS
              </span>
              <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-semibold text-white leading-tight tracking-tight">
                Watch &amp; Buy
              </h2>
              <p className="mt-2 font-sans text-xs sm:text-sm text-white/50 font-light max-w-sm">
                Discover pieces in motion — tap any reel to explore &amp; shop the look.
              </p>
            </div>

            {/* Arrow Navigation for Desktop */}
            {videos.length > 1 && (
              <div className="hidden md:flex items-center gap-2 mb-1">
                <button
                  onClick={() => scrollByAmount('left')}
                  disabled={!canScrollLeft}
                  className="p-2.5 rounded-full border border-white/15 text-white/60 hover:text-white hover:border-[#B08D57] hover:bg-[#B08D57]/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => scrollByAmount('right')}
                  disabled={!canScrollRight}
                  className="p-2.5 rounded-full border border-white/15 text-white/60 hover:text-white hover:border-[#B08D57] hover:bg-[#B08D57]/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Horizontal Scrolling Video Row */}
          {loading ? (
            /* Skeleton State */
            <div className="flex gap-3 sm:gap-4 overflow-hidden">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-[42vw] sm:w-[220px] md:w-[260px] aspect-[9/16] rounded-2xl bg-white/5 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="relative">
              {/* Left Fade Shadow */}
              {canScrollLeft && (
                <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#0E0E0E] to-transparent z-10 pointer-events-none" />
              )}

              {/* Scroll Container */}
              <div
                ref={scrollRef}
                className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-none pb-4 -mb-4"
                style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
              >
                {videos.map((video) => (
                  <div key={video.id} style={{ scrollSnapAlign: 'start' }}>
                    <WatchBuyCard
                      video={video}
                      onSelect={setSelectedVideo}
                    />
                  </div>
                ))}
              </div>

              {/* Right Fade Shadow */}
              {canScrollRight && (
                <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#0E0E0E] to-transparent z-10 pointer-events-none" />
              )}
            </div>
          )}

          {/* Mobile Arrow Hint */}
          {!loading && videos.length > 2 && (
            <div className="mt-5 flex items-center gap-2 md:hidden text-white/40 font-sans text-[11px] font-light">
              <Play className="w-3 h-3 fill-white/30" />
              <span>Scroll to see more reels</span>
            </div>
          )}
        </div>
      </section>

      {/* Video Modal Portal */}
      {selectedVideo && (
        <WatchBuyModal
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </>
  )
}
