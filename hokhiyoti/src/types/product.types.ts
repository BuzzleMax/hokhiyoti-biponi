export type ProductId = string

export type ProductImage = {
  url: string
  alt: string
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

export type Product = {
  id: ProductId
  name: string
  slug: string
  description: string

  price: number
  comparePrice?: number

  // Keep legacy fields (used by existing UI components) optional for compatibility.
  currency?: string
  subtitle?: string

  images: ProductImage[]

  category?: CategoryRef
  collection?: CollectionRef

  sizes: string[]
  colors: string[]

  fabric?: string

  featured: boolean
  newArrival: boolean
  bestSeller: boolean

  rating: number
  stock: number
  availability: string

  createdAt: string
}
