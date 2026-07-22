export type ProductReview = {
  id: string
  productId: string
  customerName: string
  city?: string
  rating: number
  title?: string
  comment: string
  photoUrl?: string
  isVerifiedPurchase: boolean
  isApproved: boolean
  helpfulCount: number
  createdAt: string
}

export type ReviewSummary = {
  averageRating: number
  totalReviews: number
  ratingBreakdown: {
    5: number
    4: number
    3: number
    2: number
    1: number
  }
}
