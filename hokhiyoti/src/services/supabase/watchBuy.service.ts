import { supabase } from '../../lib/supabase'
import { rowToProduct } from './product.service'
import type { WatchBuyVideo, WatchBuyFormData } from '../../types/watchBuy.types'
import type { Product } from '../../types/product.types'

export const supabaseWatchBuyService = {
  /**
   * Fetch all Watch & Buy videos with their associated products.
   * If onlyActive is true (default for homepage), returns only active videos.
   */
  async getWatchBuyVideos(onlyActive = true): Promise<WatchBuyVideo[]> {
    let query = supabase
      .from('watch_buy_videos')
      .select(`
        *,
        watch_buy_video_products (
          id,
          display_order,
          product_id,
          products (
            *,
            categories (id, slug, name),
            collections (id, slug, name),
            product_images (id, image_url, alt_text, sort_order, is_cover),
            product_videos (id, video_url, thumbnail_url, alt_text, sort_order, is_cover),
            product_colours (id, colour_name, hex_code, image_id),
            product_sizes (id, size, stock_quantity)
          )
        )
      `)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (onlyActive) {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching watch_buy_videos:', error)
      return []
    }

    if (!data) return []

    return data.map((item: any) => {
      // Map relational products safely, filtering out null or deleted products
      const rawProductsRel = Array.isArray(item.watch_buy_video_products)
        ? item.watch_buy_video_products
        : []

      // Sort relations by display_order
      const sortedRel = [...rawProductsRel].sort(
        (a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0)
      )

      const products: Product[] = sortedRel
        .map((rel: any) => rel.products)
        .filter((prod: any) => prod && prod.id)
        .map((prod: any) => rowToProduct(prod))

      return {
        id: item.id,
        title: item.title,
        description: item.description || undefined,
        videoUrl: item.video_url,
        posterUrl: item.poster_url || undefined,
        isActive: Boolean(item.is_active),
        displayOrder: Number(item.display_order || 0),
        createdAt: item.created_at,
        updatedAt: item.updated_at || undefined,
        products,
      }
    })
  },

  /**
   * Upload video or poster media to Supabase storage.
   */
  async uploadMedia(file: File, bucketType: 'video' | 'poster'): Promise<string> {
    const bucketName = bucketType === 'video' ? 'product-videos' : 'product-images'
    const fileExt = file.name.split('.').pop()
    const prefix = bucketType === 'video' ? 'wb_vid' : 'wb_img'
    const fileName = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`

    const { error } = await supabase.storage.from(bucketName).upload(fileName, file, {
      upsert: true,
    })

    if (error) {
      console.error(`Error uploading ${bucketType} file to ${bucketName}:`, error)
      throw error
    }

    const { data } = supabase.storage.from(bucketName).getPublicUrl(fileName)
    return data.publicUrl
  },

  /**
   * Create a new Watch & Buy video entry with linked products.
   */
  async createWatchBuyVideo(formData: WatchBuyFormData): Promise<WatchBuyVideo | null> {
    const { data: videoData, error: videoError } = await supabase
      .from('watch_buy_videos')
      .insert({
        title: formData.title,
        description: formData.description || null,
        video_url: formData.videoUrl,
        poster_url: formData.posterUrl || null,
        is_active: formData.isActive,
        display_order: formData.displayOrder,
      })
      .select()
      .single()

    if (videoError || !videoData) {
      console.error('Error inserting watch_buy_video:', videoError)
      throw videoError
    }

    // Insert linked products if any
    if (formData.productIds && formData.productIds.length > 0) {
      const productRelations = formData.productIds.map((productId, index) => ({
        watch_buy_video_id: videoData.id,
        product_id: productId,
        display_order: index,
      }))

      const { error: relError } = await supabase
        .from('watch_buy_video_products')
        .insert(productRelations)

      if (relError) {
        console.error('Error inserting watch_buy_video_products:', relError)
      }
    }

    // Fetch the full record with products
    const videos = await this.getWatchBuyVideos(false)
    return videos.find((v) => v.id === videoData.id) || null
  },

  /**
   * Update an existing Watch & Buy video record and replace product links.
   */
  async updateWatchBuyVideo(id: string, formData: WatchBuyFormData): Promise<boolean> {
    const { error: videoError } = await supabase
      .from('watch_buy_videos')
      .update({
        title: formData.title,
        description: formData.description || null,
        video_url: formData.videoUrl,
        poster_url: formData.posterUrl || null,
        is_active: formData.isActive,
        display_order: formData.displayOrder,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (videoError) {
      console.error('Error updating watch_buy_video:', videoError)
      throw videoError
    }

    // Delete existing product links for this video
    const { error: deleteRelError } = await supabase
      .from('watch_buy_video_products')
      .delete()
      .eq('watch_buy_video_id', id)

    if (deleteRelError) {
      console.error('Error deleting old watch_buy_video_products:', deleteRelError)
    }

    // Re-insert product links
    if (formData.productIds && formData.productIds.length > 0) {
      const productRelations = formData.productIds.map((productId, index) => ({
        watch_buy_video_id: id,
        product_id: productId,
        display_order: index,
      }))

      const { error: relError } = await supabase
        .from('watch_buy_video_products')
        .insert(productRelations)

      if (relError) {
        console.error('Error re-inserting watch_buy_video_products:', relError)
      }
    }

    return true
  },

  /**
   * Delete a Watch & Buy video record (does not delete associated products).
   */
  async deleteWatchBuyVideo(id: string): Promise<boolean> {
    const { error } = await supabase.from('watch_buy_videos').delete().eq('id', id)

    if (error) {
      console.error('Error deleting watch_buy_video:', error)
      throw error
    }

    return true
  },

  /**
   * Quick toggle active status for a video.
   */
  async toggleActive(id: string, currentStatus: boolean): Promise<boolean> {
    const { error } = await supabase
      .from('watch_buy_videos')
      .update({ is_active: !currentStatus, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('Error toggling active status for watch_buy_video:', error)
      throw error
    }

    return true
  },
}
