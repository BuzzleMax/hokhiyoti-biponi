import type { Product } from './product.types'

export type WatchBuyVideo = {
  id: string
  title: string
  description?: string
  videoUrl: string
  posterUrl?: string
  isActive: boolean
  displayOrder: number
  createdAt: string
  updatedAt?: string
  products: Product[]
}

export type WatchBuyVideoProductRelation = {
  id: string
  watchBuyVideoId: string
  productId: string
  displayOrder: number
  createdAt: string
  product?: Product
}

export type WatchBuyFormData = {
  title: string
  description?: string
  videoUrl: string
  posterUrl?: string
  isActive: boolean
  displayOrder: number
  productIds: string[]
}
