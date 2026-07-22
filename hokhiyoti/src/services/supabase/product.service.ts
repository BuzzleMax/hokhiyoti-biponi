import { supabase } from '../../lib/supabase'
export { supabaseCategoryService } from './category.service'
export { supabaseCollectionService } from './collection.service'
import type {
  Product,
  ProductImage,
  ProductColour,
  ProductSize,
  CategoryRef,
  CollectionRef,
  AvailabilityStatus,
} from '../../types/product.types'

/**
 * Utility to map a Supabase product database record and its sub-tables to the Product TypeScript object.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToProduct(row: any): Product {
  const category: CategoryRef | undefined =
    row.category_slug && row.category_name
      ? { id: row.category_id || '', slug: row.category_slug, name: row.category_name }
      : row.categories
      ? { id: row.categories.id, slug: row.categories.slug, name: row.categories.name }
      : undefined

  const collection: CollectionRef | undefined =
    row.collection_slug && row.collection_name
      ? { id: row.collection_id || '', slug: row.collection_slug, name: row.collection_name }
      : row.collections
      ? { id: row.collections.id, slug: row.collections.slug, name: row.collections.name }
      : undefined

  // Process Images from relational table or fallback JSON
  let images: ProductImage[] = []
  if (Array.isArray(row.product_images) && row.product_images.length > 0) {
    images = row.product_images.map((img: any) => ({
      id: img.id,
      url: img.image_url,
      alt: img.alt_text || row.name,
      sortOrder: img.sort_order,
      isCover: img.is_cover,
    }))
  } else if (Array.isArray(row.images)) {
    images = row.images.map((img: any) => ({
      url: typeof img === 'string' ? img : img.url || '',
      alt: typeof img === 'object' ? img.alt : row.name,
    }))
  }

  // Process Colours
  let colours: ProductColour[] = []
  if (Array.isArray(row.product_colours) && row.product_colours.length > 0) {
    colours = row.product_colours.map((c: any) => ({
      id: c.id,
      name: c.colour_name,
      hexCode: c.hex_code || '#111111',
      imageId: c.image_id,
    }))
  } else if (Array.isArray(row.colors)) {
    colours = row.colors.map((c: string) => ({ name: c, hexCode: '#111111' }))
  }

  // Process Sizes
  let sizes: ProductSize[] = []
  if (Array.isArray(row.product_sizes) && row.product_sizes.length > 0) {
    sizes = row.product_sizes.map((s: any) => ({
      id: s.id,
      size: s.size,
      stockQuantity: s.stock_quantity ?? 5,
    }))
  } else if (Array.isArray(row.sizes)) {
    sizes = row.sizes.map((s: string) => ({ size: s, stockQuantity: 5 }))
  }

  // Process Highlights
  let highlights: string[] = []
  if (Array.isArray(row.product_highlights) && row.product_highlights.length > 0) {
    highlights = row.product_highlights
      .sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
      .map((h: any) => h.highlight)
  } else if (Array.isArray(row.highlights)) {
    highlights = row.highlights
  }

  const stockQuantity = row.stock_quantity ?? row.stock ?? 0
  const lowStockLimit = row.low_stock_limit ?? 3

  let availabilityStatus: AvailabilityStatus = 'in_stock'
  if (stockQuantity <= 0) {
    availabilityStatus = 'out_of_stock'
  } else if (stockQuantity <= lowStockLimit) {
    availabilityStatus = 'low_stock'
  } else if (row.availability_status) {
    availabilityStatus = row.availability_status as AvailabilityStatus
  }

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description || '',
    price: Number(row.price || 0),
    comparePrice: row.compare_price ? Number(row.compare_price) : undefined,

    images,
    colours,
    sizes,
    highlights,

    category,
    collection,

    enableSizes: row.enable_sizes ?? (sizes.length > 0),
    fabric: row.fabric || undefined,
    careInstructions: row.care_instructions || undefined,
    shippingInfo: row.shipping_info || undefined,
    returnPolicy: row.return_policy || undefined,
    additionalInfo: row.additional_info || undefined,

    featured: Boolean(row.featured),
    newArrival: Boolean(row.new_arrival),
    bestSeller: Boolean(row.best_seller),

    stockQuantity,
    soldCount: row.sold_count ?? 0,
    lowStockLimit,
    availabilityStatus,
    availability: availabilityStatus === 'out_of_stock' ? 'Out of Stock' : availabilityStatus === 'low_stock' ? 'Low Stock' : 'In Stock',

    viewsCount: row.views_count ?? 0,
    rating: row.rating != null ? Number(row.rating) : 0,
    reviewsCount: row.reviews_count ?? 0,

    createdAt: row.created_at || new Date().toISOString(),
    currency: row.currency || 'INR',
    subtitle: row.subtitle || undefined,
  }
}

export const supabaseProductService = {
  async getProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*, product_images(*), product_colours(*), product_sizes(*), product_highlights(*)')
      .order('created_at', { ascending: false })

    if (error) {
      const fallback = await supabase.from('products').select('*').order('created_at', { ascending: false })
      if (fallback.error) throw fallback.error
      return (fallback.data || []).map(rowToProduct)
    }

    return (data || []).map(rowToProduct)
  },

  async getProductByIdOrSlug(identifier: string): Promise<Product> {
    if (!identifier) throw new Error('Product identifier required')

    const isUuid = /^[0-9a-fA-F-]{36}$/.test(identifier)
    let query = supabase.from('products').select('*, product_images(*), product_colours(*), product_sizes(*), product_highlights(*)')

    if (isUuid) {
      query = query.or(`id.eq.${identifier},slug.eq.${identifier}`)
    } else {
      query = query.eq('slug', identifier)
    }

    const { data, error } = await query.maybeSingle()

    if (error || !data) {
      let fbQuery = supabase.from('products').select('*')
      if (isUuid) {
        fbQuery = fbQuery.or(`id.eq.${identifier},slug.eq.${identifier}`)
      } else {
        fbQuery = fbQuery.eq('slug', identifier)
      }
      const fbRes = await fbQuery.single()
      if (fbRes.error || !fbRes.data) {
        throw new Error(`Product not found: ${identifier}`)
      }
      const prod = rowToProduct(fbRes.data)
      this.incrementViews(prod.id).catch(() => {})
      return prod
    }

    const prod = rowToProduct(data)
    this.incrementViews(prod.id).catch(() => {})
    return prod
  },

  async getProductBySlug(slug: string): Promise<Product> {
    return this.getProductByIdOrSlug(slug)
  },

  async incrementViews(productId: string): Promise<void> {
    try {
      const { data } = await supabase.from('products').select('views_count').eq('id', productId).single()
      if (data) {
        await supabase
          .from('products')
          .update({ views_count: (data.views_count || 0) + 1 })
          .eq('id', productId)
      }
    } catch {
      // Ignore background analytics increment failure
    }
  },

  async getFeaturedProducts(limit = 24): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*, product_images(*), product_colours(*), product_sizes(*), product_highlights(*)')
      .eq('featured', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      const all = await this.getProducts()
      return all.filter((p) => p.featured).slice(0, limit)
    }

    return (data || []).map(rowToProduct)
  },

  async getBestSellers(limit = 24): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*, product_images(*), product_colours(*), product_sizes(*), product_highlights(*)')
      .eq('best_seller', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      const all = await this.getProducts()
      return all.filter((p) => p.bestSeller).slice(0, limit)
    }

    return (data || []).map(rowToProduct)
  },

  async getNewArrivals(limit = 24): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*, product_images(*), product_colours(*), product_sizes(*), product_highlights(*)')
      .eq('new_arrival', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      const all = await this.getProducts()
      return all.filter((p) => p.newArrival).slice(0, limit)
    }

    return (data || []).map(rowToProduct)
  },

  async getProductsByCategory(categorySlug: string, limit?: number): Promise<Product[]> {
    let query = supabase
      .from('products')
      .select('*, product_images(*), product_colours(*), product_sizes(*), product_highlights(*)')
      .eq('category_slug', categorySlug)
      .order('created_at', { ascending: false })

    if (limit) query = query.limit(limit)

    const { data, error } = await query
    if (error) {
      const all = await this.getProducts()
      const filtered = all.filter((p) => p.category?.slug === categorySlug)
      return limit ? filtered.slice(0, limit) : filtered
    }

    return (data || []).map(rowToProduct)
  },

  async getProductsByCollection(collectionSlug: string, limit?: number): Promise<Product[]> {
    let query = supabase
      .from('products')
      .select('*, product_images(*), product_colours(*), product_sizes(*), product_highlights(*)')
      .eq('collection_slug', collectionSlug)
      .order('created_at', { ascending: false })

    if (limit) query = query.limit(limit)

    const { data, error } = await query
    if (error) {
      const all = await this.getProducts()
      const filtered = all.filter((p) => p.collection?.slug === collectionSlug)
      return limit ? filtered.slice(0, limit) : filtered
    }

    return (data || []).map(rowToProduct)
  },

  async searchProducts(query: string, limit = 24): Promise<Product[]> {
    const q = query.trim().toLowerCase()
    const all = await this.getProducts()
    if (q.length === 0) return all.slice(0, limit)

    const filtered = all.filter((p) => {
      const nameMatch = p.name.toLowerCase().includes(q)
      const descMatch = p.description.toLowerCase().includes(q)
      const catMatch = p.category?.name.toLowerCase().includes(q)
      const colMatch = p.collection?.name.toLowerCase().includes(q)
      const fabricMatch = p.fabric?.toLowerCase().includes(q)
      const colourMatch = p.colours.some((c) => c.name.toLowerCase().includes(q))
      return nameMatch || descMatch || catMatch || colMatch || fabricMatch || colourMatch
    })

    return filtered.slice(0, limit)
  },

  async createProduct(productData: Partial<Product>): Promise<Product> {
    const row = {
      name: productData.name,
      slug: productData.slug,
      description: productData.description,
      price: productData.price,
      compare_price: productData.comparePrice || null,
      category_id: productData.category?.id || null,
      category_slug: productData.category?.slug || null,
      category_name: productData.category?.name || null,
      collection_id: productData.collection?.id || null,
      collection_slug: productData.collection?.slug || null,
      collection_name: productData.collection?.name || null,
      enable_sizes: productData.enableSizes ?? false,
      fabric: productData.fabric || null,
      care_instructions: productData.careInstructions || null,
      shipping_info: productData.shippingInfo || null,
      return_policy: productData.returnPolicy || null,
      additional_info: productData.additionalInfo || null,
      featured: productData.featured || false,
      new_arrival: productData.newArrival || false,
      best_seller: productData.bestSeller || false,
      stock_quantity: productData.stockQuantity ?? 10,
      low_stock_limit: productData.lowStockLimit ?? 3,
      currency: productData.currency || 'INR',
      images: (productData.images || []).map((i) => ({ url: i.url, alt: i.alt || productData.name })),
      colors: (productData.colours || []).map((c) => c.name),
      sizes: (productData.sizes || []).map((s) => s.size),
      highlights: productData.highlights || [],
    }

    const { data: newProd, error } = await supabase.from('products').insert(row).select().single()
    if (error) throw error

    const productId = newProd.id

    try {
      if (productData.images && productData.images.length > 0) {
        const imgRows = productData.images.map((img, idx) => ({
          product_id: productId,
          image_url: img.url,
          alt_text: img.alt || productData.name,
          sort_order: idx,
          is_cover: idx === 0,
        }))
        await supabase.from('product_images').insert(imgRows)
      }

      if (productData.colours && productData.colours.length > 0) {
        const colourRows = productData.colours.map((c) => ({
          product_id: productId,
          colour_name: c.name,
          hex_code: c.hexCode || '#111111',
        }))
        await supabase.from('product_colours').insert(colourRows)
      }

      if (productData.sizes && productData.sizes.length > 0) {
        const sizeRows = productData.sizes.map((s) => ({
          product_id: productId,
          size: s.size,
          stock_quantity: s.stockQuantity ?? 5,
        }))
        await supabase.from('product_sizes').insert(sizeRows)
      }

      if (productData.highlights && productData.highlights.length > 0) {
        const highlightRows = productData.highlights.map((h, idx) => ({
          product_id: productId,
          highlight: h,
          position: idx,
        }))
        await supabase.from('product_highlights').insert(highlightRows)
      }
    } catch {
      // Ignore non-fatal relational sub-table insertion warnings
    }

    return this.getProductByIdOrSlug(productId)
  },

  async updateProduct(id: string, productData: Partial<Product>): Promise<Product> {
    const row = {
      name: productData.name,
      slug: productData.slug,
      description: productData.description,
      price: productData.price,
      compare_price: productData.comparePrice || null,
      category_id: productData.category?.id || null,
      category_slug: productData.category?.slug || null,
      category_name: productData.category?.name || null,
      collection_id: productData.collection?.id || null,
      collection_slug: productData.collection?.slug || null,
      collection_name: productData.collection?.name || null,
      enable_sizes: productData.enableSizes ?? false,
      fabric: productData.fabric || null,
      care_instructions: productData.careInstructions || null,
      shipping_info: productData.shippingInfo || null,
      return_policy: productData.returnPolicy || null,
      additional_info: productData.additionalInfo || null,
      featured: productData.featured || false,
      new_arrival: productData.newArrival || false,
      best_seller: productData.bestSeller || false,
      stock_quantity: productData.stockQuantity ?? 10,
      low_stock_limit: productData.lowStockLimit ?? 3,
      currency: productData.currency || 'INR',
      images: (productData.images || []).map((i) => ({ url: i.url, alt: i.alt || productData.name })),
      colors: (productData.colours || []).map((c) => c.name),
      sizes: (productData.sizes || []).map((s) => s.size),
      highlights: productData.highlights || [],
    }

    const { error } = await supabase.from('products').update(row).eq('id', id)
    if (error) throw error

    try {
      if (productData.images) {
        await supabase.from('product_images').delete().eq('product_id', id)
        if (productData.images.length > 0) {
          const imgRows = productData.images.map((img, idx) => ({
            product_id: id,
            image_url: img.url,
            alt_text: img.alt || productData.name,
            sort_order: idx,
            is_cover: idx === 0,
          }))
          await supabase.from('product_images').insert(imgRows)
        }
      }

      if (productData.colours) {
        await supabase.from('product_colours').delete().eq('product_id', id)
        if (productData.colours.length > 0) {
          const colourRows = productData.colours.map((c) => ({
            product_id: id,
            colour_name: c.name,
            hex_code: c.hexCode || '#111111',
          }))
          await supabase.from('product_colours').insert(colourRows)
        }
      }

      if (productData.sizes) {
        await supabase.from('product_sizes').delete().eq('product_id', id)
        if (productData.sizes.length > 0) {
          const sizeRows = productData.sizes.map((s) => ({
            product_id: id,
            size: s.size,
            stock_quantity: s.stockQuantity ?? 5,
          }))
          await supabase.from('product_sizes').insert(sizeRows)
        }
      }

      if (productData.highlights) {
        await supabase.from('product_highlights').delete().eq('product_id', id)
        if (productData.highlights.length > 0) {
          const highlightRows = productData.highlights.map((h, idx) => ({
            product_id: id,
            highlight: h,
            position: idx,
          }))
          await supabase.from('product_highlights').insert(highlightRows)
        }
      }
    } catch {
      // Ignore sub-table sync warnings
    }

    return this.getProductByIdOrSlug(id)
  },

  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) throw error
  },

  async uploadProductImage(file: File, productId: string): Promise<string> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${productId}/${Date.now()}.${fileExt}`

    const { error } = await supabase.storage.from('product-images').upload(fileName, file)
    if (error) throw error

    const { data } = supabase.storage.from('product-images').getPublicUrl(fileName)
    return data.publicUrl
  },
}
