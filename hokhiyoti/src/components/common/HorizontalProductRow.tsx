import { useRef, useState, useEffect } from 'react'
import type { Product } from '../../types/product.types'
import ProductCard from '../home/ProductCard'

interface HorizontalProductRowProps {
  products: Product[]
  loading?: boolean
  skeletonCount?: number
  emptyMessage?: string
  className?: string
}

export default function HorizontalProductRow({
  products,
  loading = false,
  skeletonCount = 6,
  emptyMessage = 'No curations match your request.',
  className = '',
}: HorizontalProductRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScrollable = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 5)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 5)
  }

  useEffect(() => {
    checkScrollable()
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', checkScrollable, { passive: true })
    window.addEventListener('resize', checkScrollable)
    return () => {
      el.removeEventListener('scroll', checkScrollable)
      window.removeEventListener('resize', checkScrollable)
    }
  }, [products, loading])

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    const scrollAmount = el.clientWidth * 0.75
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
  }

  if (loading && products.length === 0) {
    return (
      <div className={`relative w-full ${className}`}>
        <div className="flex flex-row flex-nowrap overflow-x-auto scrollbar-none gap-3 sm:gap-4 md:gap-5 pb-4 pt-1 -mx-4 px-4 sm:-mx-6 sm:px-6 md:mx-0 md:px-0">
          {Array.from({ length: skeletonCount }).map((_, idx) => (
            <div
              key={`skel-hrow-${idx}`}
              className="shrink-0 snap-start w-[calc(46vw-6px)] sm:w-[calc(32vw-12px)] md:w-[calc(24vw-14px)] lg:w-[calc(19vw-16px)] xl:w-[calc(15.5vw-16px)] min-w-[150px] max-w-[260px] flex flex-col bg-white rounded-xl overflow-hidden border border-[rgba(0,0,0,0.04)] animate-pulse"
            >
              <div className="aspect-[4/5] bg-gray-200 w-full" />
              <div className="p-3 space-y-2.5 flex-1 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="h-3.5 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!loading && products.length === 0) {
    return (
      <div className="py-12 text-center bg-white/60 rounded-2xl border border-dashed border-black/10 p-6 my-4">
        <p className="font-sans text-xs sm:text-sm text-[#8a8a8a] tracking-wide font-light">
          {emptyMessage}
        </p>
      </div>
    )
  }

  return (
    <div className={`relative w-full group/row ${className}`}>
      {/* Left Arrow Button (Desktop) */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-20 w-10 h-10 rounded-full bg-white/95 text-[#111111] shadow-md border border-[rgba(0,0,0,0.08)] items-center justify-center hover:bg-[#111111] hover:text-white transition-all duration-300 opacity-90 hover:opacity-100 focus:outline-none cursor-pointer"
          aria-label="Scroll left"
        >
          <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Right Arrow Button (Desktop) */}
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-20 w-10 h-10 rounded-full bg-white/95 text-[#111111] shadow-md border border-[rgba(0,0,0,0.08)] items-center justify-center hover:bg-[#111111] hover:text-white transition-all duration-300 opacity-90 hover:opacity-100 focus:outline-none cursor-pointer"
          aria-label="Scroll right"
        >
          <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Horizontal Row Container */}
      <div
        ref={scrollRef}
        className="flex flex-row flex-nowrap overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-none gap-3 sm:gap-4 md:gap-5 pb-4 pt-1 -mx-4 px-4 sm:-mx-6 sm:px-6 md:mx-0 md:px-0"
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="shrink-0 snap-start w-[calc(46vw-6px)] sm:w-[calc(32vw-12px)] md:w-[calc(24vw-14px)] lg:w-[calc(19vw-16px)] xl:w-[calc(15.5vw-16px)] min-w-[150px] max-w-[260px] flex flex-col"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  )
}
