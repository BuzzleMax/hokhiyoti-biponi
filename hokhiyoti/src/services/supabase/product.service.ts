import { supabase } from '../../lib/supabase'
export { supabaseCategoryService } from './category.service'
export { supabaseCollectionService } from './collection.service'
import type {
  Product,
  ProductImage,
  ProductVideo,
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
      sortOrder: img.sort_order ?? 0,
      isCover: Boolean(img.is_cover),
    }))
  } else if (Array.isArray(row.images)) {
    images = row.images.map((img: any, idx: number) => ({
      url: typeof img === 'string' ? img : img.url || '',
      alt: typeof img === 'object' ? img.alt : row.name,
      sortOrder: idx,
      isCover: idx === 0,
    }))
  }

  // Process Videos from relational table or fallback JSON
  let videos: ProductVideo[] = []
  if (Array.isArray(row.product_videos) && row.product_videos.length > 0) {
    videos = row.product_videos.map((vid: any) => ({
      id: vid.id,
      url: vid.video_url,
      thumbnailUrl: vid.thumbnail_url || undefined,
      alt: vid.alt_text || row.name,
      sortOrder: vid.sort_order ?? 0,
      isCover: Boolean(vid.is_cover),
    }))
  } else if (Array.isArray(row.videos)) {
    videos = row.videos.map((vid: any, idx: number) => ({
      url: typeof vid === 'string' ? vid : vid.url || '',
      thumbnailUrl: typeof vid === 'object' ? vid.thumbnailUrl : undefined,
      alt: typeof vid === 'object' ? vid.alt : row.name,
      sortOrder: idx,
      isCover: false,
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
    videos,
    colours,
    sizes,
    highlights,

    category,
    collection,

    commissionPercentage: row.commission_percentage ? Number(row.commission_percentage) : undefined,
    enableSizes: row.enable_sizes ?? (sizes.length > 0),
    fabric: row.fabric || undefined,
    careInstructions: row.care_instructions || undefined,
    shippingInfo: row.shipping_info || undefined,
    returnPolicy: row.return_policy || undefined,
    additionalInfo: row.additional_info || undefined,

    featured: Boolean(row.featured),
    newArrival: Boolean(row.new_arrival),
    bestSeller: Boolean(row.best_seller),
    active: row.active !== undefined ? Boolean(row.active) : true,
    archived: Boolean(row.archived),

    stockQuantity,
    soldCount: Number(row.sold_count || 0),
    lowStockLimit,
    availabilityStatus,
    availability: availabilityStatus,

    viewsCount: Number(row.views_count || 0),
    rating: Number(row.rating || 0),
    reviewsCount: Number(row.reviews_count || 0),

    seoTitle: row.seo_title || undefined,
    seoDescription: row.seo_description || undefined,

    createdAt: row.created_at || new Date().toISOString(),
    currency: row.currency || 'INR',
    subtitle: row.subtitle || undefined,
  }
}

export const supabaseProductService = {
  // Query fields
  selectQuery: `
    *,
    categories (id, slug, name),
    collections (id, slug, name),
    product_images (id, image_url, alt_text, sort_order, is_cover),
    product_videos (id, video_url, thumbnail_url, alt_text, sort_order, is_cover),
    product_colours (id, colour_name, hex_code, image_id),
    product_sizes (id, size, stock_quantity),
    product_highlights (id, highlight, position)
  `,

  async getProducts(params?: {
    categorySlug?: string
    collectionSlug?: string
    featured?: boolean
    newArrival?: boolean
    bestSeller?: boolean
    includeInactive?: boolean
  }): Promise<Product[]> {
    let query = supabase.from('products').select(this.selectQuery)

    if (!params?.includeInactive) {
      query = query.eq('active', true).eq('archived', false)
    }

    if (params?.categorySlug) {
      query = query.eq('category_slug', params.categorySlug)
    }
    if (params?.collectionSlug) {
      query = query.eq('collection_slug', params.collectionSlug)
    }
    if (params?.featured) {
      query = query.eq('featured', true)
    }
    if (params?.newArrival) {
      query = query.eq('new_arrival', true)
    }
    if (params?.bestSeller) {
      query = query.eq('best_seller', true)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.warn('Supabase product query error:', error)
      return []
    }

    return (data || []).map(rowToProduct)
  },

  async getBestSellers(limit?: number): Promise<Product[]> {
    const list = await this.getProducts({ bestSeller: true })
    return limit ? list.slice(0, limit) : list
  },

  async getFeaturedProducts(limit?: number): Promise<Product[]> {
    const list = await this.getProducts({ featured: true })
    return limit ? list.slice(0, limit) : list
  },

  async getNewArrivals(limit?: number): Promise<Product[]> {
    const list = await this.getProducts({ newArrival: true })
    return limit ? list.slice(0, limit) : list
  },

  async getProductsByCategory(categorySlug: string, limit?: number): Promise<Product[]> {
    const list = await this.getProducts({ categorySlug })
    return limit ? list.slice(0, limit) : list
  },

  async getProductsByCollection(collectionSlug: string, limit?: number): Promise<Product[]> {
    const list = await this.getProducts({ collectionSlug })
    return limit ? list.slice(0, limit) : list
  },

  async getProductByIdOrSlug(idOrSlug: string): Promise<Product | null> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug)

    let query = supabase.from('products').select(this.selectQuery)
    if (isUuid) {
      query = query.eq('id', idOrSlug)
    } else {
      query = query.eq('slug', idOrSlug)
    }

    const { data, error } = await query.maybeSingle()

    if (error || !data) {
      return null
    }

    // Increment view count in background
    try {
      const rawData = data as any
      await supabase
        .from('products')
        .update({ views_count: (rawData.views_count || 0) + 1 })
        .eq('id', rawData.id)
    } catch {
      // Ignore background view increment errors
    }

    return rowToProduct(data)
  },

  // Upload image to storage
  async uploadProductImage(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop()
    const fileName = `img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`

    const { error } = await supabase.storage.from('product-images').upload(fileName, file)
    if (error) throw error

    const { data } = supabase.storage.from('product-images').getPublicUrl(fileName)
    return data.publicUrl
  },

  // Upload video to storage
  async uploadProductVideo(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop()
    const fileName = `vid_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`

    const { error } = await supabase.storage.from('product-videos').upload(fileName, file)
    if (error) throw error

    const { data } = supabase.storage.from('product-videos').getPublicUrl(fileName)
    return data.publicUrl
  },

  // Create Product
  async createProduct(productData: {
    name: string
    slug?: string
    description: string
    price: number
    comparePrice?: number
    categorySlug?: string
    categoryName?: string
    collectionSlug?: string
    collectionName?: string
    enableSizes?: boolean
    fabric?: string
    careInstructions?: string
    shippingInfo?: string
    returnPolicy?: string
    additionalInfo?: string
    featured?: boolean
    newArrival?: boolean
    bestSeller?: boolean
    active?: boolean
    stockQuantity?: number
    images?: Array<{ url: string; alt?: string; isCover?: boolean; sortOrder?: number }>
    videos?: Array<{ url: string; thumbnailUrl?: string; alt?: string; isCover?: boolean; sortOrder?: number }>
    colours?: Array<{ name: string; hexCode?: string }>
    sizes?: Array<{ size: string; stockQuantity?: number }>
    highlights?: string[]
    seoTitle?: string
    seoDescription?: string
  }): Promise<Product> {
    const slug =
      productData.slug ||
      productData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') + `-${Date.now().toString().slice(-4)}`

    const row = {
      name: productData.name,
      slug,
      description: productData.description,
      price: productData.price,
      compare_price: productData.comparePrice || null,
      category_slug: productData.categorySlug || null,
      category_name: productData.categoryName || null,
      collection_slug: productData.collectionSlug || null,
      collection_name: productData.collectionName || null,
      enable_sizes: productData.enableSizes || false,
      fabric: productData.fabric || null,
      care_instructions: productData.careInstructions || null,
      shipping_info: productData.shippingInfo || null,
      return_policy: productData.returnPolicy || null,
      additional_info: productData.additionalInfo || null,
      featured: productData.featured || false,
      new_arrival: productData.newArrival || false,
      best_seller: productData.bestSeller || false,
      active: productData.active !== undefined ? productData.active : true,
      archived: false,
      stock_quantity: productData.stockQuantity ?? 10,
      seo_title: productData.seoTitle || null,
      seo_description: productData.seoDescription || null,
      images: (productData.images || []).map((i) => i.url),
      videos: (productData.videos || []).map((v) => ({ url: v.url, thumbnailUrl: v.thumbnailUrl })),
      colors: (productData.colours || []).map((c) => c.name),
      sizes: (productData.sizes || []).map((s) => s.size),
      highlights: productData.highlights || [],
    }

    const { data: newProd, error } = await supabase.from('products').insert(row).select().single()
    if (error) throw error

    const productId = newProd.id

    // Insert relational sub-tables if needed
    if (productData.images && productData.images.length > 0) {
      const imgRows = productData.images.map((img, idx) => ({
        product_id: productId,
        image_url: img.url,
        alt_text: img.alt || productData.name,
        sort_order: img.sortOrder ?? idx,
        is_cover: img.isCover ?? idx === 0,
      }))
      await supabase.from('product_images').insert(imgRows)
    }

    if (productData.videos && productData.videos.length > 0) {
      const vidRows = productData.videos.map((vid, idx) => ({
        product_id: productId,
        video_url: vid.url,
        thumbnail_url: vid.thumbnailUrl || null,
        alt_text: vid.alt || productData.name,
        sort_order: vid.sortOrder ?? idx,
        is_cover: vid.isCover ?? false,
      }))
      await supabase.from('product_videos').insert(vidRows)
    }

    if (productData.colours && productData.colours.length > 0) {
      const colRows = productData.colours.map((c) => ({
        product_id: productId,
        colour_name: c.name,
        hex_code: c.hexCode || '#111111',
      }))
      await supabase.from('product_colours').insert(colRows)
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
      const highRows = productData.highlights.map((h, idx) => ({
        product_id: productId,
        highlight: h,
        position: idx,
      }))
      await supabase.from('product_highlights').insert(highRows)
    }

    const created = await this.getProductByIdOrSlug(productId)
    return created || rowToProduct(newProd)
  },

  // Update Product
  async updateProduct(
    id: string,
    updates: {
      name?: string
      slug?: string
      description?: string
      price?: number
      comparePrice?: number
      categorySlug?: string
      categoryName?: string
      collectionSlug?: string
      collectionName?: string
      enableSizes?: boolean
      fabric?: string
      careInstructions?: string
      shippingInfo?: string
      returnPolicy?: string
      additionalInfo?: string
      featured?: boolean
      newArrival?: boolean
      bestSeller?: boolean
      active?: boolean
      archived?: boolean
      stockQuantity?: number
      images?: Array<{ id?: string; url: string; alt?: string; isCover?: boolean; sortOrder?: number }>
      videos?: Array<{ id?: string; url: string; thumbnailUrl?: string; alt?: string; isCover?: boolean; sortOrder?: number }>
      colours?: Array<{ name: string; hexCode?: string }>
      sizes?: Array<{ size: string; stockQuantity?: number }>
      highlights?: string[]
      seoTitle?: string
      seoDescription?: string
    }
  ): Promise<Product> {
    const rowUpdates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (updates.name !== undefined) rowUpdates.name = updates.name
    if (updates.slug !== undefined) rowUpdates.slug = updates.slug
    if (updates.description !== undefined) rowUpdates.description = updates.description
    if (updates.price !== undefined) rowUpdates.price = updates.price
    if (updates.comparePrice !== undefined) rowUpdates.compare_price = updates.comparePrice
    if (updates.categorySlug !== undefined) rowUpdates.category_slug = updates.categorySlug
    if (updates.categoryName !== undefined) rowUpdates.category_name = updates.categoryName
    if (updates.collectionSlug !== undefined) rowUpdates.collection_slug = updates.collectionSlug
    if (updates.collectionName !== undefined) rowUpdates.collection_name = updates.collectionName
    if (updates.enableSizes !== undefined) rowUpdates.enable_sizes = updates.enableSizes
    if (updates.fabric !== undefined) rowUpdates.fabric = updates.fabric
    if (updates.careInstructions !== undefined) rowUpdates.care_instructions = updates.careInstructions
    if (updates.shippingInfo !== undefined) rowUpdates.shipping_info = updates.shippingInfo
    if (updates.returnPolicy !== undefined) rowUpdates.return_policy = updates.returnPolicy
    if (updates.additionalInfo !== undefined) rowUpdates.additional_info = updates.additionalInfo
    if (updates.featured !== undefined) rowUpdates.featured = updates.featured
    if (updates.newArrival !== undefined) rowUpdates.new_arrival = updates.newArrival
    if (updates.bestSeller !== undefined) rowUpdates.best_seller = updates.bestSeller
    if (updates.active !== undefined) rowUpdates.active = updates.active
    if (updates.archived !== undefined) rowUpdates.archived = updates.archived
    if (updates.stockQuantity !== undefined) rowUpdates.stock_quantity = updates.stockQuantity
    if (updates.seoTitle !== undefined) rowUpdates.seo_title = updates.seoTitle
    if (updates.seoDescription !== undefined) rowUpdates.seo_description = updates.seoDescription

    if (updates.images) {
      rowUpdates.images = updates.images.map((i) => i.url)
    }
    if (updates.videos) {
      rowUpdates.videos = updates.videos.map((v) => ({ url: v.url, thumbnailUrl: v.thumbnailUrl }))
    }
    if (updates.colours) {
      rowUpdates.colors = updates.colours.map((c) => c.name)
    }
    if (updates.sizes) {
      rowUpdates.sizes = updates.sizes.map((s) => s.size)
    }
    if (updates.highlights) {
      rowUpdates.highlights = updates.highlights
    }

    const { error } = await supabase.from('products').update(rowUpdates).eq('id', id)
    if (error) throw error

    // Sync sub-tables if arrays provided
    if (updates.images) {
      await supabase.from('product_images').delete().eq('product_id', id)
      if (updates.images.length > 0) {
        const imgRows = updates.images.map((img, idx) => ({
          product_id: id,
          image_url: img.url,
          alt_text: img.alt || updates.name || 'Product Image',
          sort_order: img.sortOrder ?? idx,
          is_cover: img.isCover ?? idx === 0,
        }))
        await supabase.from('product_images').insert(imgRows)
      }
    }

    if (updates.videos) {
      await supabase.from('product_videos').delete().eq('product_id', id)
      if (updates.videos.length > 0) {
        const vidRows = updates.videos.map((vid, idx) => ({
          product_id: id,
          video_url: vid.url,
          thumbnail_url: vid.thumbnailUrl || null,
          alt_text: vid.alt || updates.name || 'Product Video',
          sort_order: vid.sortOrder ?? idx,
          is_cover: vid.isCover ?? false,
        }))
        await supabase.from('product_videos').insert(vidRows)
      }
    }

    if (updates.colours) {
      await supabase.from('product_colours').delete().eq('product_id', id)
      if (updates.colours.length > 0) {
        const colRows = updates.colours.map((c) => ({
          product_id: id,
          colour_name: c.name,
          hex_code: c.hexCode || '#111111',
        }))
        await supabase.from('product_colours').insert(colRows)
      }
    }

    if (updates.sizes) {
      await supabase.from('product_sizes').delete().eq('product_id', id)
      if (updates.sizes.length > 0) {
        const sizeRows = updates.sizes.map((s) => ({
          product_id: id,
          size: s.size,
          stock_quantity: s.stockQuantity ?? 5,
        }))
        await supabase.from('product_sizes').insert(sizeRows)
      }
    }

    if (updates.highlights) {
      await supabase.from('product_highlights').delete().eq('product_id', id)
      if (updates.highlights.length > 0) {
        const highRows = updates.highlights.map((h, idx) => ({
          product_id: id,
          highlight: h,
          position: idx,
        }))
        await supabase.from('product_highlights').insert(highRows)
      }
    }

    const updated = await this.getProductByIdOrSlug(id)
    if (!updated) throw new Error('Failed to retrieve updated product')
    return updated
  },

  // Duplicate Product
  async duplicateProduct(id: string): Promise<Product> {
    const original = await this.getProductByIdOrSlug(id)
    if (!original) throw new Error('Original product not found')

    return this.createProduct({
      name: `${original.name} (Copy)`,
      description: original.description,
      price: original.price,
      comparePrice: original.comparePrice,
      categorySlug: original.category?.slug,
      categoryName: original.category?.name,
      collectionSlug: original.collection?.slug,
      collectionName: original.collection?.name,
      enableSizes: original.enableSizes,
      fabric: original.fabric,
      careInstructions: original.careInstructions,
      shippingInfo: original.shippingInfo,
      returnPolicy: original.returnPolicy,
      additionalInfo: original.additionalInfo,
      featured: false,
      newArrival: true,
      bestSeller: false,
      active: true,
      stockQuantity: original.stockQuantity,
      images: original.images.map((img) => ({ url: img.url, alt: img.alt, isCover: img.isCover })),
      videos: original.videos.map((vid) => ({ url: vid.url, thumbnailUrl: vid.thumbnailUrl, alt: vid.alt, isCover: vid.isCover })),
      colours: original.colours.map((c) => ({ name: c.name, hexCode: c.hexCode })),
      sizes: original.sizes.map((s) => ({ size: s.size, stockQuantity: s.stockQuantity })),
      highlights: [...original.highlights],
    })
  },

  // Toggle Active/Publish state
  async toggleProductActive(id: string, active: boolean): Promise<void> {
    const { error } = await supabase.from('products').update({ active, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) throw error
  },

  // Toggle Archive state
  async toggleProductArchive(id: string, archived: boolean): Promise<void> {
    const { error } = await supabase.from('products').update({ archived, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) throw error
  },

  // Delete Product
  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) throw error
  },
}
