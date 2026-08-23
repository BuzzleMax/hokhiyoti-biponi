import type { Product, ProductVideo } from '../types/product.types'

export type ProductMediaSelection = {
  type: 'video' | 'image'
  url: string
  thumbnailUrl?: string
  alt: string
  hasVideo: boolean
  isVideoCover: boolean
}

/**
  * Centralized media selection logic for Home Cards, Explore More Cards, and Product Galleries.
  * Priority:
  * 1. If product has a valid video AND product config says video should be displayed in product cards (showVideoOnHome || video.isCover)
  *    -> video thumbnail
  * 2. Otherwise -> primary product image (isCover || first image)
  * 3. If no primary image exists -> safe fallback placeholder.
  */
export function getProductPrimaryMedia(product: Product): ProductMediaSelection {
  const fallbackUrl = 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=1000&auto=format&fit=crop'

  const validVideo: ProductVideo | undefined = product.videos?.find(
    (v) => Boolean(v.url) && v.url.trim().length > 0
  )

  const showVideo = Boolean(
    validVideo &&
      (validVideo.isCover ||
        product.showVideoOnHome ||
        (product as unknown as Record<string, unknown>).show_video_on_home)
  )

  if (validVideo && showVideo) {
    return {
      type: 'video',
      url: validVideo.url,
      thumbnailUrl: validVideo.thumbnailUrl,
      alt: validVideo.alt || product.name,
      hasVideo: true,
      isVideoCover: true,
    }
  }

  const primaryImg = product.images?.find((img) => img.isCover) || product.images?.[0]
  if (primaryImg && primaryImg.url) {
    return {
      type: 'image',
      url: primaryImg.url,
      alt: primaryImg.alt || product.name,
      hasVideo: Boolean(validVideo),
      isVideoCover: false,
    }
  }

  return {
    type: 'image',
    url: fallbackUrl,
    alt: product.name,
    hasVideo: Boolean(validVideo),
    isVideoCover: false,
  }
}

/**
  * Captures a representative video frame using HTML5 Canvas client-side.
  * Returns a JPEG blob snapshot for storage upload, or null if frame capture fails.
  */
export function captureVideoFrame(videoSource: File | string, seekTime = 0.5): Promise<Blob | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(null)
      return
    }

    const video = document.createElement('video')
    video.crossOrigin = 'anonymous'
    video.muted = true
    video.playsInline = true
    video.preload = 'auto'

    const url = typeof videoSource === 'string' ? videoSource : URL.createObjectURL(videoSource)
    video.src = url

    const cleanup = () => {
      if (typeof videoSource !== 'string') {
        URL.revokeObjectURL(url)
      }
      video.remove()
    }

    const timeout = setTimeout(() => {
      cleanup()
      resolve(null)
    }, 6000)

    video.onloadeddata = () => {
      video.currentTime = seekTime
    }

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth || 640
        canvas.height = video.videoHeight || 360
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          canvas.toBlob(
            (blob) => {
              clearTimeout(timeout)
              cleanup()
              resolve(blob)
            },
            'image/jpeg',
            0.85
          )
          return
        }
      } catch (err) {
        console.warn('Canvas video snapshot capture failed:', err)
      }
      clearTimeout(timeout)
      cleanup()
      resolve(null)
    }

    video.onerror = () => {
      clearTimeout(timeout)
      cleanup()
      resolve(null)
    }
  })
}
