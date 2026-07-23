import { useState, useEffect } from 'react'
import { Star, ThumbsUp, CheckCircle, Image as ImageIcon, Plus, X, MessageSquare } from 'lucide-react'
import { supabaseReviewService } from '../../services/supabase/review.service'
import type { ProductReview, ReviewSummary } from '../../types/review.types'

interface ProductReviewsSectionProps {
  productId: string
  productName: string
}

export default function ProductReviewsSection({ productId, productName }: ProductReviewsSectionProps) {
  const [reviews, setReviews] = useState<ProductReview[]>([])
  const [summary, setSummary] = useState<ReviewSummary>({
    averageRating: 0,
    totalReviews: 0,
    ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  })
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'newest' | 'highest' | 'lowest'>('newest')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Review Form state
  const [formState, setFormState] = useState({
    customerName: '',
    city: '',
    rating: 5,
    title: '',
    comment: '',
    photoFiles: [] as File[],
  })
  const [submittedNotice, setSubmittedNotice] = useState(false)

  useEffect(() => {
    loadReviews()
  }, [productId])

  const loadReviews = async () => {
    try {
      const data = await supabaseReviewService.getApprovedReviews(productId)
      setReviews(data)
      setSummary(supabaseReviewService.calculateSummary(data))
    } catch (err) {
      console.warn('Could not load reviews:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleHelpful = async (reviewId: string) => {
    try {
      const newCount = await supabaseReviewService.voteHelpful(reviewId)
      setReviews((prev) => prev.map((r) => (r.id === reviewId ? { ...r, helpfulCount: newCount } : r)))
    } catch (err: any) {
      alert(err.message || 'You have already voted on this review.')
    }
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formState.customerName || !formState.comment) {
      alert('Please fill in your name and review message.')
      return
    }

    setSubmitting(true)
    try {
      await supabaseReviewService.submitReview({
        productId,
        customerName: formState.customerName,
        city: formState.city,
        rating: formState.rating,
        title: formState.title,
        comment: formState.comment,
        photoFiles: formState.photoFiles,
      })
      setSubmittedNotice(true)
      setTimeout(() => {
        setIsModalOpen(false)
        setSubmittedNotice(false)
        setFormState({ customerName: '', city: '', rating: 5, title: '', comment: '', photoFiles: [] })
      }, 2500)
    } catch (err) {
      console.error(err)
      alert('Failed to submit review. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files)
      setFormState((prev) => ({ ...prev, photoFiles: [...prev.photoFiles, ...selected] }))
    }
  }

  const removePhotoFile = (idx: number) => {
    setFormState((prev) => ({
      ...prev,
      photoFiles: prev.photoFiles.filter((_, i) => i !== idx),
    }))
  }

  // Sorted reviews
  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortBy === 'highest') return b.rating - a.rating
    if (sortBy === 'lowest') return a.rating - b.rating
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  // Collect all customer photo URLs
  const customerPhotos: string[] = []
  reviews.forEach((r) => {
    if (r.photoUrls && r.photoUrls.length > 0) {
      customerPhotos.push(...r.photoUrls)
    } else if (r.photoUrl) {
      customerPhotos.push(r.photoUrl)
    }
  })

  const hasApprovedReviews = reviews.length > 0

  return (
    <div className="pt-16 border-t border-[rgba(0,0,0,0.06)] space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl md:text-3xl font-medium text-[#111111]">
            Customer Reviews
          </h2>
          <p className="font-sans text-xs text-[#666666] font-light mt-1">
            Real feedback from our valued patrons of {productName}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-[#111111] hover:bg-[#B08D57] text-white font-sans text-xs font-semibold tracking-widest uppercase transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Write a Review</span>
        </button>
      </div>

      {loading ? (
        <p className="text-center py-8 text-xs text-gray-400 animate-pulse">Loading reviews...</p>
      ) : !hasApprovedReviews ? (
        /* Zero Approved Reviews Display - Strictly no stars, no 0 rating, no 0 reviews */
        <div className="text-center py-12 px-6 bg-white rounded-2xl border border-dashed border-gray-200 space-y-3">
          <MessageSquare className="w-10 h-10 text-[#B08D57] mx-auto opacity-70" />
          <h3 className="font-heading text-xl font-medium text-[#111111]">No reviews yet</h3>
          <p className="font-sans text-xs text-gray-500 font-light">Be the first customer to review this product.</p>
          <div className="pt-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 h-10 px-6 rounded-full bg-[#B08D57] hover:bg-[#111111] text-white font-sans text-xs font-semibold tracking-widest uppercase transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Write the First Review</span>
            </button>
          </div>
        </div>
      ) : (
        /* Approved Reviews Display */
        <div className="space-y-10">
          {/* Summary Card */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 p-6 md:p-8 rounded-2xl bg-[#FAF9F6] border border-[rgba(0,0,0,0.05)]">
            <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-4 border-b md:border-b-0 md:border-r border-[rgba(0,0,0,0.06)]">
              <span className="font-heading text-5xl font-medium text-[#111111]">{summary.averageRating}</span>
              <div className="flex items-center gap-1 my-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= Math.round(summary.averageRating)
                        ? 'fill-[#B08D57] text-[#B08D57]'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="font-sans text-xs text-[#666666] font-light">
                Based on {summary.totalReviews} verified {summary.totalReviews === 1 ? 'review' : 'reviews'}
              </span>
            </div>

            <div className="md:col-span-8 flex flex-col justify-center space-y-2">
              {([5, 4, 3, 2, 1] as const).map((star) => {
                const count = summary.ratingBreakdown[star] || 0
                const percentage = summary.totalReviews > 0 ? (count / summary.totalReviews) * 100 : 0
                return (
                  <div key={star} className="flex items-center gap-3 font-sans text-xs text-[#555555]">
                    <span className="w-8 font-medium">{star} ★</span>
                    <div className="flex-1 h-2 rounded-full bg-black/5 overflow-hidden">
                      <div
                        className="h-full bg-[#B08D57] transition-all duration-500 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-gray-500">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Customer Photos Strip */}
          {customerPhotos.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-sans text-xs font-semibold tracking-widest text-[#111111] uppercase flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#B08D57]" />
                <span>Customer Photos ({customerPhotos.length})</span>
              </h3>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                {customerPhotos.map((url, idx) => (
                  <div key={idx} className="w-20 aspect-square rounded-xl overflow-hidden border border-black/10 flex-shrink-0">
                    <img src={url} alt={`Customer review photo ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-between border-b border-[rgba(0,0,0,0.06)] pb-4">
            <span className="font-sans text-xs font-semibold tracking-wider text-[#111111] uppercase">
              All Reviews ({sortedReviews.length})
            </span>
            <div className="flex items-center gap-2">
              <span className="font-sans text-xs text-[#666666]">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="font-sans text-xs bg-transparent border border-black/10 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#B08D57]"
              >
                <option value="newest">Newest First</option>
                <option value="highest">Highest Rated</option>
                <option value="lowest">Lowest Rated</option>
              </select>
            </div>
          </div>

          {/* Review List Cards */}
          <div className="space-y-6">
            {sortedReviews.map((review) => (
              <div key={review.id} className="p-6 rounded-2xl bg-white border border-[rgba(0,0,0,0.05)] space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-sans text-sm font-semibold text-[#111111]">{review.customerName}</span>
                      {review.city && <span className="text-xs text-gray-400">• {review.city}</span>}
                      {review.isVerifiedPurchase && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle className="w-3 h-3" /> Verified Purchase
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= review.rating ? 'fill-[#B08D57] text-[#B08D57]' : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="text-[11px] text-gray-400 ml-2">
                        {new Date(review.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {review.title && <h4 className="font-sans text-sm font-semibold text-[#111111]">{review.title}</h4>}
                <p className="font-sans text-xs text-[#444444] leading-relaxed font-light">{review.comment}</p>

                {/* Multiple Photos Grid */}
                {review.photoUrls && review.photoUrls.length > 0 && (
                  <div className="flex gap-2 flex-wrap mt-2">
                    {review.photoUrls.map((url, idx) => (
                      <div key={idx} className="w-20 aspect-square rounded-lg overflow-hidden border border-black/10">
                        <img src={url} alt={`Review attachment ${idx + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between text-xs text-gray-500">
                  <button
                    onClick={() => handleHelpful(review.id)}
                    className="inline-flex items-center gap-1.5 hover:text-[#B08D57] transition-colors"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>Helpful ({review.helpfulCount})</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Write Review Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-black rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="font-heading text-2xl font-medium text-[#111111]">Write a Review</h3>
              <p className="font-sans text-xs text-gray-500 mt-1">Sharing your thoughts on {productName}</p>
            </div>

            {submittedNotice ? (
              <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="font-semibold text-emerald-900 text-sm">Thank You for Your Review!</h4>
                <p className="text-xs text-emerald-700">
                  Your review has been submitted successfully and will be published after quick admin verification.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#111111] mb-2">
                    Overall Rating
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setFormState((prev) => ({ ...prev, rating: star }))}
                        className="p-1"
                      >
                        <Star
                          className={`w-7 h-7 transition-colors ${
                            star <= formState.rating ? 'fill-[#B08D57] text-[#B08D57]' : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#111111] mb-1">Your Name *</label>
                    <input
                      type="text"
                      required
                      value={formState.customerName}
                      onChange={(e) => setFormState((prev) => ({ ...prev, customerName: e.target.value }))}
                      placeholder="e.g. Ananya Das"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-xs focus:outline-none focus:border-[#B08D57]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#111111] mb-1">City (Optional)</label>
                    <input
                      type="text"
                      value={formState.city}
                      onChange={(e) => setFormState((prev) => ({ ...prev, city: e.target.value }))}
                      placeholder="e.g. Guwahati"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-xs focus:outline-none focus:border-[#B08D57]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#111111] mb-1">Review Title (Optional)</label>
                  <input
                    type="text"
                    value={formState.title}
                    onChange={(e) => setFormState((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Exquisite quality and weave!"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-xs focus:outline-none focus:border-[#B08D57]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#111111] mb-1">Review Details *</label>
                  <textarea
                    required
                    rows={4}
                    value={formState.comment}
                    onChange={(e) => setFormState((prev) => ({ ...prev, comment: e.target.value }))}
                    placeholder="Tell us about the fabric texture, fit, color vibrancy, and experience..."
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-xs focus:outline-none focus:border-[#B08D57]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#111111] mb-1">Add Photos (Multiple Optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#FAF9F6] file:text-[#111111] hover:file:bg-[#B08D57] hover:file:text-white"
                  />
                  {formState.photoFiles.length > 0 && (
                    <div className="flex gap-2 flex-wrap mt-2">
                      {formState.photoFiles.map((file, idx) => (
                        <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-black/10 bg-gray-50 flex items-center justify-center text-[10px] p-1">
                          <span className="truncate">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removePhotoFile(idx)}
                            className="absolute top-0.5 right-0.5 bg-black/70 text-white rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-12 rounded-full bg-[#111111] hover:bg-[#B08D57] text-white font-sans text-xs font-semibold tracking-widest uppercase transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Submitting Review...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
