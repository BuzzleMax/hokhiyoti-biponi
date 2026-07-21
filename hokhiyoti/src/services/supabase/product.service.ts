import { supabase } from '../../lib/supabase'
import type { Product, ProductImage, CategoryRef, CollectionRef } from '../../types/product.types'

// Database row type
type ProductRow = {
  id: string
  created_at: string
  name: string
  slug: string
  description: string
  price: number
  compare_price: number | null
  images: { url: string; alt: string }[]
  category_id: string | null
  category_slug: string | null
  category_name: string | null
  collection_id: string | null
  collection_slug: string | null
  collection_name: string | null
  sizes: string[]
  colors: string[]
  fabric: string | null
  featured: boolean
  new_arrival: boolean
  best_seller: boolean
  stock: number
  availability: string
  rating: number
  currency: string | null
  subtitle: string | null
}

// Convert database row to Product type
function rowToProduct(row: ProductRow): Product {
  const category: CategoryRef | undefined = row.category_slug && row.category_name
    ? { id: row.category_id || '', slug: row.category_slug, name: row.category_name }
    : undefined

  const collection: CollectionRef | undefined = row.collection_slug && row.collection_name
    ? { id: row.collection_id || '', slug: row.collection_slug, name: row.collection_name }
    : undefined

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    price: Number(row.price),
    comparePrice: row.compare_price ? Number(row.compare_price) : undefined,
    images: row.images as ProductImage[],
    category,
    collection,
    sizes: row.sizes || [],
    colors: row.colors || [],
    fabric: row.fabric || undefined,
    featured: row.featured,
    newArrival: row.new_arrival,
    bestSeller: row.best_seller,
    rating: Number(row.rating),
    stock: row.stock,
    availability: row.availability,
    createdAt: row.created_at,
    currency: row.currency || undefined,
    subtitle: row.subtitle || undefined,
  }
}

// Convert Product to database row
function productToRow(product: Partial<Product>): Partial<ProductRow> {
  return {
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: product.price,
    compare_price: product.comparePrice || null,
    images: product.images || [],
    category_id: product.category?.id || null,
    category_slug: product.category?.slug || null,
    category_name: product.category?.name || null,
    collection_id: product.collection?.id || null,
    collection_slug: product.collection?.slug || null,
    collection_name: product.collection?.name || null,
    sizes: product.sizes || [],
    colors: product.colors || [],
    fabric: product.fabric || null,
    featured: product.featured || false,
    new_arrival: product.newArrival || false,
    best_seller: product.bestSeller || false,
    stock: product.stock || 0,
    availability: product.availability || 'in_stock',
    rating: product.rating || 0,
    currency: product.currency || 'USD',
    subtitle: product.subtitle || null,
  }
}

export const supabaseProductService = {
  async getProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map(rowToProduct)
  },

  async getProductBySlug(slug: string): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) throw error
    if (!data) throw new Error(`Product not found: ${slug}`)
    return rowToProduct(data)
  },

  async getFeaturedProducts(limit = 24): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('featured', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return (data || []).map(rowToProduct)
  },

  async getBestSellers(limit = 24): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('best_seller', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return (data || []).map(rowToProduct)
  },

  async getNewArrivals(limit = 24): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('new_arrival', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return (data || []).map(rowToProduct)
  },

  async getProductsByCategory(categorySlug: string, limit?: number): Promise<Product[]> {
    let query = supabase
      .from('products')
      .select('*')
      .eq('category_slug', categorySlug)
      .order('created_at', { ascending: false })

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query
    if (error) throw error
    return (data || []).map(rowToProduct)
  },

  async getProductsByCollection(collectionSlug: string, limit?: number): Promise<Product[]> {
    let query = supabase
      .from('products')
      .select('*')
      .eq('collection_slug', collectionSlug)
      .order('created_at', { ascending: false })

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query
    if (error) throw error
    return (data || []).map(rowToProduct)
  },

  async searchProducts(query: string, limit = 24): Promise<Product[]> {
    const q = query.trim().toLowerCase()
    if (q.length === 0) {
      return this.getProducts().then(products => products.slice(0, limit))
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return (data || []).map(rowToProduct)
  },

  async createProduct(product: Partial<Product>): Promise<Product> {
    const row = productToRow(product)
    const { data, error } = await supabase
      .from('products')
      .insert(row)
      .select()
      .single()

    if (error) throw error
    if (!data) throw new Error('Failed to create product')
    return rowToProduct(data)
  },

  async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
    const row = productToRow(product)
    const { data, error } = await supabase
      .from('products')
      .update(row)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    if (!data) throw new Error('Failed to update product')
    return rowToProduct(data)
  },

  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Upload product image to Supabase Storage
  async uploadProductImage(file: File, productId: string): Promise<string> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${productId}/${Date.now()}.${fileExt}`
    const filePath = fileName

    const { error } = await supabase.storage
      .from('product-images')
      .upload(filePath, file)

    if (error) throw error

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath)

    return publicUrl
  },

  // Delete product image from Supabase Storage
  async deleteProductImage(filePath: string): Promise<void> {
    const { error } = await supabase.storage
      .from('product-images')
      .remove([filePath])

    if (error) throw error
  },
}
