export type ProductId = string

export type ProductImage = {
  id?: string
  url: string
  alt?: string
  sortOrder?: number
  isCover?: boolean
}

export type ProductVideo = {
  id?: string
  url: string
  thumbnailUrl?: string
  alt?: string
  sortOrder?: number
  isCover?: boolean
}

export type ProductColour = {
  id?: string
  name: string
  hexCode?: string
  imageId?: string
}

export type ProductSize = {
  id?: string
  size: string
  stockQuantity?: number
}

export type ProductHighlight = {
  id?: string
  highlight: string
  position?: number
}

export type CategoryRef = {
  id: string
  slug: string
  name: string
}

export type CollectionRef = {
  id: string
  slug: string
  name: string
}

export type AvailabilityStatus = 'in_stock' | 'low_stock' | 'out_of_stock'

export type Product = {
  id: ProductId
  name: string
  slug: string
  description: string

  price: number
  comparePrice?: number

  // Relational / Array sub-entities
  images: ProductImage[]
  videos: ProductVideo[]
  colours: ProductColour[]
  sizes: ProductSize[]
  highlights: string[]

  category?: CategoryRef
  collection?: CollectionRef

  enableSizes: boolean
  fabric?: string
  careInstructions?: string
  shippingInfo?: string
  returnPolicy?: string
  additionalInfo?: string

  commissionPercentage?: number
  featured: boolean
  newArrival: boolean
  bestSeller: boolean
  active?: boolean
  archived?: boolean

  stockQuantity: number
  soldCount: number
  lowStockLimit: number
  availabilityStatus: AvailabilityStatus
  availability?: string

  viewsCount: number
  rating: number
  reviewsCount: number

  seoTitle?: string
  seoDescription?: string

  createdAt: string
  currency?: string
  subtitle?: string
}
