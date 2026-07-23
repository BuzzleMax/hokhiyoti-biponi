import { supabase } from '../../lib/supabase'
import type { ProductReview, ReviewSummary } from '../../types/review.types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToReview(row: any): ProductReview {
  let photoUrls: string[] = []
  if (Array.isArray(row.review_images) && row.review_images.length > 0) {
    photoUrls = row.review_images.map((img: any) => img.image_url)
  } else if (row.photo_url) {
    photoUrls = [row.photo_url]
  }

  return {
    id: row.id,
    productId: row.product_id,
    customerName: row.customer_name,
    city: row.city || undefined,
    rating: Number(row.rating || 5),
    title: row.title || undefined,
    comment: row.comment,
    photoUrl: row.photo_url || photoUrls[0] || undefined,
    photoUrls,
    isVerifiedPurchase: Boolean(row.is_verified_purchase),
    isApproved: Boolean(row.is_approved),
    helpfulCount: Number(row.helpful_count || 0),
    createdAt: row.created_at || new Date().toISOString(),
  }
}

export const supabaseReviewService = {
  // Get approved reviews for product page display
  async getApprovedReviews(productId: string): Promise<ProductReview[]> {
    const { data, error } = await supabase
      .from('product_reviews')
      .select('*, review_images(image_url, sort_order)')
      .eq('product_id', productId)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('Reviews table query warning:', error)
      return []
    }
    return (data || []).map(rowToReview)
  },

  // Calculate review summary breakdown for a product
  calculateSummary(reviews: ProductReview[]): ReviewSummary {
    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      }
    }

    const totalReviews = reviews.length
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    let sum = 0

    reviews.forEach((r) => {
      const ratingKey = Math.min(Math.max(Math.round(r.rating), 1), 5) as 1 | 2 | 3 | 4 | 5
      breakdown[ratingKey] = (breakdown[ratingKey] || 0) + 1
      sum += r.rating
    })

    const averageRating = Number((sum / totalReviews).toFixed(1))

    return {
      averageRating,
      totalReviews,
      ratingBreakdown: breakdown,
    }
  },

  // Upload review photo to Supabase storage
  async uploadReviewPhoto(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop()
    const fileName = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`

    const { error } = await supabase.storage.from('review-images').upload(fileName, file)
    if (error) throw error

    const { data } = supabase.storage.from('review-images').getPublicUrl(fileName)
    return data.publicUrl
  },

  // Upload multiple review photos
  async uploadReviewPhotos(files: File[]): Promise<string[]> {
    const urls: string[] = []
    for (const file of files) {
      const url = await this.uploadReviewPhoto(file)
      urls.push(url)
    }
    return urls
  },

  // Submit review from frontend (Enters Pending queue: is_approved = false)
  async submitReview(reviewData: {
    productId: string
    customerName: string
    city?: string
    rating: number
    title?: string
    comment: string
    photoFile?: File | null
    photoFiles?: File[] | null
  }): Promise<ProductReview> {
    let uploadedUrls: string[] = []
    if (reviewData.photoFiles && reviewData.photoFiles.length > 0) {
      uploadedUrls = await this.uploadReviewPhotos(reviewData.photoFiles)
    } else if (reviewData.photoFile) {
      const singleUrl = await this.uploadReviewPhoto(reviewData.photoFile)
      uploadedUrls = [singleUrl]
    }

    const row = {
      product_id: reviewData.productId,
      customer_name: reviewData.customerName,
      city: reviewData.city || null,
      rating: reviewData.rating,
      title: reviewData.title || null,
      comment: reviewData.comment,
      photo_url: uploadedUrls[0] || null,
      is_approved: false, // Default to Pending moderation
      is_verified_purchase: false,
      helpful_count: 0,
    }

    const { data, error } = await supabase.from('product_reviews').insert(row).select().single()
    if (error) throw error

    if (uploadedUrls.length > 0) {
      const imgRows = uploadedUrls.map((url, idx) => ({
        review_id: data.id,
        image_url: url,
        sort_order: idx,
      }))
      await supabase.from('review_images').insert(imgRows)
    }

    return rowToReview({ ...data, review_images: uploadedUrls.map((u, i) => ({ image_url: u, sort_order: i })) })
  },

  // Increment helpful count
  async voteHelpful(reviewId: string): Promise<number> {
    const storageKey = `helpful_voted_${reviewId}`
    if (localStorage.getItem(storageKey)) {
      throw new Error('You have already voted on this review.')
    }

    const { data: current } = await supabase.from('product_reviews').select('helpful_count').eq('id', reviewId).single()
    const newCount = (current?.helpful_count || 0) + 1

    const { error } = await supabase.from('product_reviews').update({ helpful_count: newCount }).eq('id', reviewId)
    if (error) throw error

    localStorage.setItem(storageKey, 'true')
    return newCount
  },

  // ADMIN METHODS
  async getAllReviewsForAdmin(): Promise<ProductReview[]> {
    const { data, error } = await supabase
      .from('product_reviews')
      .select('*, review_images(image_url, sort_order)')
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('Failed to load admin reviews:', error)
      return []
    }
    return (data || []).map(rowToReview)
  },

  async updateReviewStatus(reviewId: string, isApproved: boolean): Promise<void> {
    const { error } = await supabase.from('product_reviews').update({ is_approved: isApproved }).eq('id', reviewId)
    if (error) throw error
  },

  async toggleVerifiedPurchase(reviewId: string, isVerified: boolean): Promise<void> {
    const { error } = await supabase.from('product_reviews').update({ is_verified_purchase: isVerified }).eq('id', reviewId)
    if (error) throw error
  },

  async deleteReview(reviewId: string): Promise<void> {
    const { error } = await supabase.from('product_reviews').delete().eq('id', reviewId)
    if (error) throw error
  },
}
